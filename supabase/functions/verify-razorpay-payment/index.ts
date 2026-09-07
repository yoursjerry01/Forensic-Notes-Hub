import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
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
      405,
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse(
        { error: "Missing authorization header" },
        401,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
    const razorpayKeySecret = Deno.env.get(
      "RAZORPAY_KEY_SECRET",
    );

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey ||
      !razorpayKeySecret
    ) {
      console.error(
        "Required environment variables are missing.",
      );

      return jsonResponse(
        { error: "Server configuration is incomplete." },
        500,
      );
    }

    /*
     * Client 1:
     * Used ONLY to verify the user's JWT.
     */
    const authClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      console.error("Authentication failed:", userError);

      return jsonResponse(
        { error: "Unauthorized" },
        401,
      );
    }

    /*
     * Client 2:
     * Service-role client for trusted server-side
     * order verification/update operations.
     */
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
    );

    const body = await req.json();

    const orderId = body?.orderId;
    const razorpayOrderId = body?.razorpayOrderId;
    const razorpayPaymentId = body?.razorpayPaymentId;
    const razorpaySignature = body?.razorpaySignature;

    if (
      typeof orderId !== "string" ||
      typeof razorpayOrderId !== "string" ||
      typeof razorpayPaymentId !== "string" ||
      typeof razorpaySignature !== "string"
    ) {
      return jsonResponse(
        {
          error:
            "Payment verification data is incomplete.",
        },
        400,
      );
    }

    /*
     * Load the order using service role.
     * We STILL verify that the order belongs to the
     * authenticated user.
     */
    const {
      data: order,
      error: orderError,
    } = await adminClient
      .from("orders")
      .select(
        "id, user_id, status, razorpay_order_id, total_amount, currency",
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Unable to load order:",
        orderError,
      );

      return jsonResponse(
        { error: "Unable to load order." },
        500,
      );
    }

    if (!order) {
      return jsonResponse(
        { error: "Order not found." },
        404,
      );
    }

    /*
     * Make sure the Razorpay order belongs to this
     * exact Supabase order.
     */
    if (
      order.razorpay_order_id !== razorpayOrderId
    ) {
      console.error(
        "Razorpay order mismatch:",
        {
          databaseRazorpayOrderId:
            order.razorpay_order_id,
          receivedRazorpayOrderId:
            razorpayOrderId,
          supabaseOrderId: order.id,
        },
      );

      return jsonResponse(
        {
          error: "Razorpay order does not match.",
        },
        400,
      );
    }

    /*
     * Verify Razorpay signature:
     *
     * HMAC SHA-256(
     *   razorpay_order_id + "|" + razorpay_payment_id,
     *   Razorpay secret
     * )
     */
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(razorpayKeySecret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

    const signatureBuffer =
      await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(
          `${razorpayOrderId}|${razorpayPaymentId}`,
        ),
      );

    const generatedSignature = Array.from(
      new Uint8Array(signatureBuffer),
    )
      .map((byte) =>
        byte.toString(16).padStart(2, "0"),
      )
      .join("");

    if (
      generatedSignature !== razorpaySignature
    ) {
      console.error(
        "Invalid Razorpay signature.",
      );

      return jsonResponse(
        {
          error: "Payment verification failed.",
        },
        400,
      );
    }

    /*
     * Signature is valid.
     *
     * Now mark the order as paid.
     */
    const {
      data: updatedOrder,
      error: updateError,
    } = await adminClient
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      })
      .eq("id", order.id)
      .eq("user_id", user.id)
      .select(
        "id, status, razorpay_order_id, razorpay_payment_id",
      )
      .single();

    if (updateError) {
      console.error(
        "Unable to update order:",
        updateError,
      );

      return jsonResponse(
        {
          error:
            "Payment was verified, but the order could not be completed.",
        },
        500,
      );
    }

    console.log(
      "Payment verified successfully:",
      {
        userId: user.id,
        orderId: order.id,
        razorpayOrderId,
        razorpayPaymentId,
      },
    );

    return jsonResponse({
      success: true,
      message: "Payment verified successfully.",
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    });
  } catch (error) {
    console.error(
      "verify-razorpay-payment failed:",
      error,
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      500,
    );
  }
});