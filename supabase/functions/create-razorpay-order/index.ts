import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CartItem = {
  id: string;
  quantity?: number;
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

function generateOrderNumber(): string {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `EVD-${year}${month}${day}-${random}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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
     * 1. Read environment variables
     * ---------------------------------------------------------
     */

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
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

    if (!razorpayKeyId) {
      throw new Error("Missing RAZORPAY_KEY_ID");
    }

    if (!razorpayKeySecret) {
      throw new Error("Missing RAZORPAY_KEY_SECRET");
    }

   console.log("Razorpay credential diagnostic:", {
  key_id_present: Boolean(razorpayKeyId),
  key_id_prefix: razorpayKeyId
    ? razorpayKeyId.substring(0, 8)
    : null,
  key_id_length: razorpayKeyId?.length ?? 0,
  secret_present: Boolean(razorpayKeySecret),
  secret_length: razorpayKeySecret?.length ?? 0,
});

    /*
     * ---------------------------------------------------------
     * 2. Get authenticated user
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
      console.error("Authentication error:", userError);

      return jsonResponse(
        { error: "You must be signed in to place an order." },
        401
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. Create privileged Supabase client
     *
     * Service role is ONLY used server-side.
     * It bypasses RLS.
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
     * 4. Read request body
     * ---------------------------------------------------------
     */

    const body = await req.json();

    const cartItems: CartItem[] = body?.items;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return jsonResponse(
        { error: "Your cart is empty." },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Validate cart item IDs
     * ---------------------------------------------------------
     */

    const noteIds = [
      ...new Set(
        cartItems
          .map((item) => item?.id)
          .filter(
            (id): id is string =>
              typeof id === "string" && id.length > 0
          )
      ),
    ];

    if (noteIds.length === 0) {
      return jsonResponse(
        { error: "No valid notes were provided." },
        400
      );
    }

    if (noteIds.length !== cartItems.length) {
      return jsonResponse(
        { error: "Invalid or duplicate cart items." },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Get REAL prices from database
     *
     * Never trust price/is_free sent by the browser.
     * ---------------------------------------------------------
     */

    const {
      data: notes,
      error: notesError,
    } = await supabaseAdmin
      .from("notes")
      .select(
        "id, title, price, is_free"
      )
      .in("id", noteIds);

    if (notesError) {
      console.error("Notes lookup error:", notesError);
      throw new Error("Unable to verify the selected notes.");
    }

    if (!notes || notes.length !== noteIds.length) {
      return jsonResponse(
        {
          error:
            "One or more selected notes no longer exist.",
        },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 7. Calculate total from database values
     * ---------------------------------------------------------
     */

    let subtotal = 0;

    const orderItems = notes.map((note) => {
      const requestedItem = cartItems.find(
        (item) => item.id === note.id
      );

      const quantity = requestedItem?.quantity ?? 1;

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 10
      ) {
        throw new Error(
          "Invalid quantity for one or more notes."
        );
      }

      const isFree = Boolean(note.is_free);

      const unitPrice = isFree
        ? 0
        : Number(note.price ?? 0);

      if (!isFree && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
        throw new Error(
          `Invalid price configured for note: ${note.title}`
        );
      }

      const lineTotal = unitPrice * quantity;

      subtotal += lineTotal;

      return {
        note_id: note.id,
        note_title: note.title,
        unit_price: unitPrice,
        quantity,
      };
    });

    /*
     * Round to two decimal places.
     */
    subtotal = Math.round(subtotal * 100) / 100;

    /*
     * ---------------------------------------------------------
     * 8. Generate our internal order number
     * ---------------------------------------------------------
     */

    const orderNumber = generateOrderNumber();

    /*
     * ---------------------------------------------------------
     * 9. Create order in Supabase
     * ---------------------------------------------------------
     */

    const {
      data: createdOrder,
      error: orderInsertError,
    } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: "pending",
        subtotal,
        total_amount: subtotal,
        currency: "INR",
      })
      .select(
        `
          id,
          order_number,
          status,
          subtotal,
          total_amount,
          currency
        `
      )
      .single();

    if (orderInsertError || !createdOrder) {
      console.error(
        "Order insert error:",
        orderInsertError
      );

      throw new Error(
        "Unable to create your order."
      );
    }

    /*
     * ---------------------------------------------------------
     * 10. Create order items
     * ---------------------------------------------------------
     */

    const itemsToInsert = orderItems.map((item) => ({
      order_id: createdOrder.id,
      note_id: item.note_id,
      note_title: item.note_title,
      unit_price: item.unit_price,
      quantity: item.quantity,
    }));

    const {
      error: itemsInsertError,
    } = await supabaseAdmin
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsInsertError) {
      console.error(
        "Order items insert error:",
        itemsInsertError
      );

      // Clean up the order if its items couldn't be created.
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", createdOrder.id);

      throw new Error(
        "Unable to create your order items."
      );
    }

    /*
     * ---------------------------------------------------------
     * 11. Handle completely free orders
     *
     * No Razorpay order is necessary for ₹0.
     * ---------------------------------------------------------
     */

    if (subtotal === 0) {
      const {
        error: freeOrderUpdateError,
      } = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
        })
        .eq("id", createdOrder.id);

      if (freeOrderUpdateError) {
        console.error(
          "Free order update error:",
          freeOrderUpdateError
        );
      }

      return jsonResponse({
        success: true,
        free_order: true,
        order_id: createdOrder.id,
        order_number: createdOrder.order_number,
        amount: 0,
        currency: "INR",
      });
    }

    /*
     * ---------------------------------------------------------
     * 12. Validate Razorpay amount
     * ---------------------------------------------------------
     */

    const razorpayAmount = Math.round(
      subtotal * 100
    );

    if (
      !Number.isInteger(razorpayAmount) ||
      razorpayAmount < 100
    ) {
      throw new Error(
        "The order amount must be at least ₹1."
      );
    }

    /*
     * ---------------------------------------------------------
     * 13. Create Razorpay order
     * ---------------------------------------------------------
     *
     * Razorpay expects amount in paise.
     *
     * ₹99 = 9900
     * ---------------------------------------------------------
     */

    const razorpayAuth = btoa(
      `${razorpayKeyId}:${razorpayKeySecret}`
    );

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${razorpayAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: razorpayAmount,
          currency: "INR",
          receipt: createdOrder.order_number,
          partial_payment: false,
          notes: {
            supabase_order_id: createdOrder.id,
            user_id: user.id,
          },
        }),
      }
    );

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay order creation failed:",
        razorpayData
      );

      // Remove the pending database order because
      // the Razorpay order was not created.
      await supabaseAdmin
        .from("order_items")
        .delete()
        .eq("order_id", createdOrder.id);

      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", createdOrder.id);

      return jsonResponse(
        {
          error:
            razorpayData?.error?.description ||
            "Unable to create Razorpay order.",
        },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 14. Save Razorpay order ID in our database
     * ---------------------------------------------------------
     */

    const {
      error: updateOrderError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        razorpay_order_id: razorpayData.id,
      })
      .eq("id", createdOrder.id);

    if (updateOrderError) {
      console.error(
        "Failed to save Razorpay order ID:",
        updateOrderError
      );

      return jsonResponse(
        {
          error:
            "Payment order was created, but we could not save it. Please contact support.",
        },
        500
      );
    }

    /*
     * ---------------------------------------------------------
     * 15. Return safe data to frontend
     *
     * NEVER return razorpayKeySecret.
     * ---------------------------------------------------------
     */

    return jsonResponse({
      success: true,
      free_order: false,

      order_id: createdOrder.id,
      order_number: createdOrder.order_number,

      razorpay_order_id: razorpayData.id,
      razorpay_key_id: razorpayKeyId,

      amount: razorpayAmount,
      amount_rupees: subtotal,
      currency: "INR",

      customer: {
        email: user.email ?? null,
      },
    });
  } catch (error) {
    console.error(
      "create-razorpay-order error:",
      error
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the order.",
      },
      500
    );
  }
});
