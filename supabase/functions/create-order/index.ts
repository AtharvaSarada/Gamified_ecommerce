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
    // 0. Env Var Check
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!supabaseUrl || !supabaseKey || !razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Environment Variables: ", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        hasRzpId: !!razorpayKeyId,
        hasRzpSecret: !!razorpayKeySecret
      });
      throw new Error("Server Configuration Error: Missing Environment Variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cart_items, shipping_address_id, payment_provider, guest_info } = await req.json();

    // 1. Initialize Razorpay
    let razorpay;
    try {
      razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });
    } catch (err) {
      console.error("Razorpay Init Error", err);
      throw new Error("Failed to initialize payment provider");
    }

    // 2. Calculate Total (Server-side validation)
    let subtotal = 0;
    for (const item of cart_items) {
      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .select("price, stock_quantity, product:products(base_price, discount_percentage)")
        .eq("id", item.variant_id)
        .single();

      if (variantError || !variant) {
        console.error(`Variant ${item.variant_id} not found`, variantError);
        throw new Error(`Variant ${item.variant_id} not found`);
      }

      // Calculate Price logic
      const basePrice = variant.product.base_price;
      const discount = variant.product.discount_percentage || 0;
      const price = basePrice * (1 - discount / 100);

      subtotal += price * item.quantity;
    }

    // Hard check shipping Logic
    let verifiedShipping = 0;
    if (subtotal < 1000 && payment_provider === "cod") {
      verifiedShipping = 49;
    }
    if (payment_provider !== "cod" || subtotal >= 1000) verifiedShipping = 0;

    const totalAmount = Math.round((subtotal + verifiedShipping) * 100); // Amount in paise

    // 3. Create Razorpay Order
    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: totalAmount,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      });
    } catch (err) {
      console.error("Razorpay Order Create Error", err);
      throw new Error(`Payment Provider Error: ${err.error?.description || err.message}`);
    }

    // 4. Call DB Function `place_order`
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
      p_shipping_cost: verifiedShipping,
      p_razorpay_order_id: rzpOrder.id
    });

    if (dbError) {
      console.error("DB place_order Error", dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        order_id: orderId,
        razorpay_order_id: rzpOrder.id,
        amount: totalAmount,
        currency: "INR",
        key: razorpayKeyId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Global Catch Error", error);
    return new Response(JSON.stringify({ error: error.message, details: error.stack }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
