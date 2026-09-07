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
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // Only POST is allowed
  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
    );
  }

  try {
    /*
     * ---------------------------------------------------------
     * 1. Get Authorization header
     * ---------------------------------------------------------
     */

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse(
        { error: "Missing authorization header" },
        401,
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. Get environment variables
     * ---------------------------------------------------------
     */

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get(
      "SUPABASE_ANON_KEY",
    );
    const supabaseServiceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    const razorpayKeyId = Deno.env.get(
      "RAZORPAY_KEY_ID",
    );
    const razorpayKeySecret = Deno.env.get(
      "RAZORPAY_KEY_SECRET",
    );

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey ||
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      console.error(
        "Required environment variables are missing.",
      );

      return jsonResponse(
        {
          error:
            "Server configuration is incomplete.",
        },
        500,
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. Authenticate the current Supabase user
     *
     * This client uses the user's JWT.
     * It is used ONLY for authentication.
     * ---------------------------------------------------------
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
      console.error(
        "Authentication failed:",
        userError,
      );

      return jsonResponse(
        { error: "Unauthorized" },
        401,
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Create service-role client
     *
     * This is used for trusted server-side database
     * operations.
     *
     * IMPORTANT:
     * We still verify user.id against the order's user_id.
     * ---------------------------------------------------------
     */

    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
    );

    /*
     * ---------------------------------------------------------
     * 5. Read request body
     * ---------------------------------------------------------
     */

    const body = await req.json();

    const orderId = body?.orderId;

    if (
      typeof orderId !== "string" ||
      !orderId.trim()
    ) {
      return jsonResponse(
        { error: "orderId is required." },
        400,
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Load the Supabase order
     *
     * Service role is used here so RLS cannot prevent the
     * Edge Function from reading the order.
     *
     * We STILL require the order to belong to the
     * authenticated user.
     * ---------------------------------------------------------
     */

    const {
      data: order,
      error: orderError,
    } = await adminClient
      .from("orders")
      .select(
        "id, user_id, order_number, status, total_amount, currency, razorpay_order_id",
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
     * ---------------------------------------------------------
     * 7. Make sure the order is still payable
     * ---------------------------------------------------------
     */

    if (order.status !== "pending") {
      return jsonResponse(
        {
          error:
            "This order is no longer payable.",
          status: order.status,
        },
        409,
      );
    }

    /*
     * ---------------------------------------------------------
     * 8. If a Razorpay order already exists, reuse it
     *
     * This prevents duplicate Razorpay orders when the
     * customer refreshes/retries checkout.
     * ---------------------------------------------------------
     */

    if (order.razorpay_order_id) {
      console.log(
        "Using existing Razorpay order:",
        order.razorpay_order_id,
      );

      return jsonResponse({
        orderId: order.id,
        orderNumber: order.order_number,
        razorpayOrderId:
          order.razorpay_order_id,
        amount: Math.round(
          Number(order.total_amount) * 100,
        ),
        currency:
          order.currency || "INR",
        keyId: razorpayKeyId,
      });
    }

    /*
     * ---------------------------------------------------------
     * 9. Convert order amount to paise
     * ---------------------------------------------------------
     */

    const amountInPaise = Math.round(
      Number(order.total_amount) * 100,
    );

    if (
      !Number.isInteger(amountInPaise) ||
      amountInPaise < 100
    ) {
      console.error(
        "Invalid order amount:",
        order.total_amount,
      );

      return jsonResponse(
        { error: "Invalid order amount." },
        400,
      );
    }

    /*
     * ---------------------------------------------------------
     * 10. Create Razorpay order
     * ---------------------------------------------------------
     */

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            btoa(
              `${razorpayKeyId}:${razorpayKeySecret}`,
            ),
        },

        body: JSON.stringify({
          amount: amountInPaise,
          currency:
            order.currency || "INR",

          receipt:
            order.order_number,

          notes: {
            supabase_order_id:
              order.id,

            user_id:
              user.id,
          },
        }),
      },
    );

    const razorpayData =
      await razorpayResponse.json();

    /*
     * ---------------------------------------------------------
     * 11. Check Razorpay response
     * ---------------------------------------------------------
     */

    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay order creation failed:",
        razorpayData,
      );

      return jsonResponse(
        {
          error:
            "Unable to create Razorpay order.",
        },
        502,
      );
    }

    if (
      !razorpayData?.id ||
      !razorpayData?.amount ||
      !razorpayData?.currency
    ) {
      console.error(
        "Invalid Razorpay response:",
        razorpayData,
      );

      return jsonResponse(
        {
          error:
            "Razorpay returned an invalid order.",
        },
        502,
      );
    }

    /*
     * ---------------------------------------------------------
     * 12. Save Razorpay order ID in Supabase
     *
     * This is the important part that was previously
     * vulnerable to RLS blocking the update.
     * ---------------------------------------------------------
     */

    const {
      data: updatedOrder,
      error: updateError,
    } = await adminClient
      .from("orders")
      .update({
        razorpay_order_id:
          razorpayData.id,
      })
      .eq("id", order.id)
      .eq("user_id", user.id)
      .select(
        "id, razorpay_order_id",
      )
      .single();

    if (updateError) {
      console.error(
        "Unable to save Razorpay order ID:",
        updateError,
      );

      /*
       * IMPORTANT:
       * Razorpay order was created but Supabase could
       * not save its ID. Do not silently continue.
       */
      return jsonResponse(
        {
          error:
            "Razorpay order was created, but could not be saved.",
        },
        500,
      );
    }

    if (
      !updatedOrder?.razorpay_order_id
    ) {
      console.error(
        "Razorpay order ID was not saved.",
      );

      return jsonResponse(
        {
          error:
            "Razorpay order ID could not be confirmed.",
        },
        500,
      );
    }

    /*
     * ---------------------------------------------------------
     * 13. Return Razorpay order information to frontend
     * ---------------------------------------------------------
     */

    console.log(
      "Razorpay order created successfully:",
      {
        userId: user.id,
        supabaseOrderId: order.id,
        razorpayOrderId:
          razorpayData.id,
        amount:
          razorpayData.amount,
        currency:
          razorpayData.currency,
      },
    );

    return jsonResponse({
      orderId: order.id,
      orderNumber:
        order.order_number,

      razorpayOrderId:
        razorpayData.id,

      amount:
        razorpayData.amount,

      currency:
        razorpayData.currency,

      keyId:
        razorpayKeyId,
    });
  } catch (error) {
    /*
     * ---------------------------------------------------------
     * 14. Unexpected server error
     * ---------------------------------------------------------
     */

    console.error(
      "create-razorpay-order failed:",
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