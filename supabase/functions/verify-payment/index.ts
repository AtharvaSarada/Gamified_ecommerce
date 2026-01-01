
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
    // Handle CORS preflight messages
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log(`[verify-payment] Received ${req.method} request`);

        // Parse Request Body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            throw new Error("Invalid JSON body");
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

        console.log(`[verify-payment] Payload:`, { razorpay_order_id, razorpay_payment_id, has_signature: !!razorpay_signature });

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new Error("Missing required payment details (order_id, payment_id, or signature)");
        }

        // 1. Verify Signature
        const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
        if (!secret) {
            console.error("[verify-payment] RAZORPAY_KEY_SECRET is missing in env");
            throw new Error("Server configuration error");
        }

        // Use Web Crypto API or safe HMAC approach
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const data = encoder.encode(text);

        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
        const signatureArray = Array.from(new Uint8Array(signatureBuffer));
        const generated_signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (generated_signature !== razorpay_signature) {
            console.error(`[verify-payment] Signature Mismatch! Generated: ${generated_signature}, Received: ${razorpay_signature}`);
            throw new Error("Invalid payment signature");
        }

        console.log("[verify-payment] Signature Verified. Updating DB...");

        // 2. Update Database
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseKey) {
            console.error("[verify-payment] Supabase Credentials missing");
            throw new Error("Server configuration error (Supabase)");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from("orders")
            .update({
                status: "paid",
                payment_status: "completed",
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature,
                updated_at: new Date().toISOString()
            })
            .eq("razorpay_order_id", razorpay_order_id);

        if (error) {
            console.error("[verify-payment] DB Update Error:", error);
            throw error;
        }

        console.log("[verify-payment] Success!");

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("[verify-payment] Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
