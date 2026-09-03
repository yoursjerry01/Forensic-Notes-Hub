import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function generateHmacSha256(
  message: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();

  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    messageData
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405
    );
  }

  try {
    /*
     * ---------------------------------------------------------
     * 1. Environment variables
     * ---------------------------------------------------------
     */

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
    const razorpayKeySecret = Deno.env.get(
      "RAZORPAY_KEY_SECRET"
    );

    if (!supabaseUrl) {
      throw new Error("Missing SUPABASE_URL");
    }

    if (!supabaseAnonKey) {
      throw new Error("Missing SUPABASE_ANON_KEY");
    }

    if (!supabaseServiceRoleKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!razorpayKeySecret) {
      throw new Error("Missing RAZORPAY_KEY_SECRET");
    }

    /*
     * ---------------------------------------------------------
     * 2. Authenticate user
     * ---------------------------------------------------------
     */

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        { error: "Missing Authorization header" },
        401
      );
    }

    const accessToken = authorization.replace(
      /^Bearer\s+/i,
      ""
    );

    if (!accessToken) {
      return jsonResponse(
        { error: "Invalid authorization token" },
        401
      );
    }

    const authClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user) {
      return jsonResponse(
        {
          error: "You must be signed in.",
        },
        401
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. Admin Supabase client
     * ---------------------------------------------------------
     */

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /*
     * ---------------------------------------------------------
     * 4. Read payment data
     * ---------------------------------------------------------
     */

    const body = await req.json();

    const orderId = body?.order_id;
    const razorpayOrderId = body?.razorpay_order_id;
    const razorpayPaymentId = body?.razorpay_payment_id;
    const razorpaySignature = body?.razorpay_signature;

    if (
      typeof orderId !== "string" ||
      typeof razorpayOrderId !== "string" ||
      typeof razorpayPaymentId !== "string" ||
      typeof razorpaySignature !== "string"
    ) {
      return jsonResponse(
        {
          error: "Incomplete payment verification data.",
        },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Get the internal order
     * ---------------------------------------------------------
     */

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        `
          id,
          user_id,
          status,
          razorpay_order_id,
          total_amount,
          currency
        `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return jsonResponse(
        {
          error: "Order not found.",
        },
        404
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Make sure this order belongs to the user
     * ---------------------------------------------------------
     */

    if (order.user_id !== user.id) {
      return jsonResponse(
        {
          error: "You are not allowed to verify this order.",
        },
        403
      );
    }

    /*
     * ---------------------------------------------------------
     * 7. Make sure Razorpay order matches our order
     * ---------------------------------------------------------
     */

    if (order.razorpay_order_id !== razorpayOrderId) {
      return jsonResponse(
        {
          error: "Razorpay order does not match this order.",
        },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 8. Prevent re-processing already paid orders
     * ---------------------------------------------------------
     */

    if (order.status === "paid") {
      return jsonResponse({
        success: true,
        already_paid: true,
        order_id: order.id,
      });
    }

    /*
     * ---------------------------------------------------------
     * 9. Verify Razorpay signature
     *
     * Razorpay requires:
     *
     * razorpay_order_id + "|" + razorpay_payment_id
     *
     * signed with the Razorpay Key Secret.
     * ---------------------------------------------------------
     */

    const generatedSignature =
      await generateHmacSha256(
        `${razorpayOrderId}|${razorpayPaymentId}`,
        razorpayKeySecret
      );

    if (generatedSignature !== razorpaySignature) {
      console.error("Invalid Razorpay signature.");

      return jsonResponse(
        {
          error: "Payment verification failed.",
        },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 10. Mark order as paid
     * ---------------------------------------------------------
     */

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      })
      .eq("id", order.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "Order payment update failed:",
        updateError
      );

      throw new Error(
        "Payment was verified, but the order could not be updated."
      );
    }

    /*
     * ---------------------------------------------------------
     * 11. Success
     * ---------------------------------------------------------
     */

    return jsonResponse({
      success: true,
      order_id: order.id,
      status: "paid",
      razorpay_payment_id: razorpayPaymentId,
    });
  } catch (error) {
    console.error(
      "verify-razorpay-payment error:",
      error
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while verifying payment.",
      },
      500
    );
  }
});