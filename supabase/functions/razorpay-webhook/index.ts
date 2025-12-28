import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import crypto from "node:crypto";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // 1. Signature Verification
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const signature = req.headers.get("x-razorpay-signature");
    const bodyText = await req.text(); // Read raw text

    if (!secret || !signature) {
        return new Response("Missing Secret/Signature", { status: 400 });
    }

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(bodyText);
    const digest = shasum.digest("hex");

    if (digest !== signature) {
        return new Response("Invalid Signature", { status: 401 });
    }

    // 2. Process Event (Idempotent)
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const event = JSON.parse(bodyText);
    const eventId = event.payload.payment.entity.id; // Or event.id

    // Check logs
    const { data: existing } = await supabase
        .from("webhook_logs")
        .select("id")
        .eq("source", "razorpay")
        .eq("event_id", event.id) // Use Unique Event ID
        .single();

    if (existing) {
        return new Response("Already Processed", { status: 200 });
    }

    // Capture Log
    await supabase.from("webhook_logs").insert({
        source: 'razorpay',
        event_id: event.id,
        event_type: event.event,
        payload: event
    });

    // 3. Handle specific events
    if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;
        const rzpOrderId = payment.order_id;

        // Update Order to PAID
        const { error } = await supabase
            .from("orders")
            .update({
                status: "paid",
                payment_status: "active", // Razorpay status
                razorpay_payment_id: payment.id,
                webhook_verified: true
            })
            .eq("razorpay_order_id", rzpOrderId);

        if (error) console.error("DB Update Failed:", error);

        // Trigger POD logic? (Handled by another n8n webhook or DB trigger)
    } else if (event.event === "payment.failed") {
        // Handle failure (optional release stock)
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });
});
