import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import Razorpay from "npm:razorpay@2.9.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { cart_items, shipping_address_id, payment_provider, guest_info, shipping_cost } = await req.json();

        // 1. Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: Deno.env.get("RAZORPAY_KEY_ID"),
            key_secret: Deno.env.get("RAZORPAY_KEY_SECRET"),
        });

        // 2. Calculate Total (Server-side validation)
        let subtotal = 0;
        for (const item of cart_items) {
            const { data: variant } = await supabase
                .from("product_variants")
                .select("price, stock_quantity, product:products(base_price, discount_percentage)")
                .eq("id", item.variant_id)
                .single();

            if (!variant) throw new Error(\`Variant \${item.variant_id} not found\`);
      
      // Calculate Price logic (Reuse existing logic or simplify)
      // Assuming passed price is correct for now, but IDEALLY fetch from DB
      // For speed, we will trust the variant fetch:
      const basePrice = variant.product.base_price;
      const discount = variant.product.discount_percentage || 0;
      const price = basePrice * (1 - discount / 100);
      
      subtotal += price * item.quantity;
    }
    
    // Hard check shipping Logic again or trust client? 
    // TRUST BUT VERIFY: Recalculate basic shipping rules
    let verifiedShipping = 0;
    if (subtotal < 1000 && payment_provider === "cod") {
        verifiedShipping = 49; // Default fallback
    }
    // If prepaid, free. If > 1000, free. 
    if (payment_provider !== "cod" || subtotal >= 1000) verifiedShipping = 0;

    const totalAmount = Math.round((subtotal + verifiedShipping) * 100); // Amount in paise

    // 3. Create Razorpay Order
    const rzpOrder = await razorpay.orders.create({
      amount: totalAmount,
      currency: "INR",
      receipt: \`rcpt_\${Date.now()}\`,
    });

    // 4. Call DB Function `place_order` (Atomic Lock)
    // We pass razorpay_order_id to the DB function to save it
    // NOTE: In our schema, we modified place_order to verify stock.
    // We will call it NOW to reserve stock.
    
    // User ID?
    // We need to parse JWT to get user_id if logged in
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
    }

    const { data: orderId, error: dbError } = await supabase.rpc("place_order", {
      p_user_id: userId,
      p_cart_items: cart_items,
      p_shipping_address_id: shipping_address_id,
      p_payment_details: { provider: payment_provider },
      p_guest_info: guest_info,
      p_shipping_cost: verifiedShipping, // use verified
      p_razorpay_order_id: rzpOrder.id
    });

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ 
          order_id: orderId, 
          razorpay_order_id: rzpOrder.id, 
          amount: totalAmount, 
          currency: "INR",
          key: Deno.env.get("RAZORPAY_KEY_ID") 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
