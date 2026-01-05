import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { amount, currency, payment_method, service, reference, metadata } = await req.json();

    if (!amount || !currency || !payment_method || !service || !reference) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, currency, payment_method, service, reference" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const baseUrl = "https://evenpass.sn";
    const successUrl = `${baseUrl}/payment/success?ref=${reference}&service=${service}`;
    const errorUrl = `${baseUrl}/payment/error?service=${service}`;

    if (payment_method === "wave") {
      const waveApiKey = Deno.env.get("WAVE_API_KEY");
      if (!waveApiKey) {
        console.error("WAVE_API_KEY not configured");
        return new Response(
          JSON.stringify({ error: "Wave payment service not configured" }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const wavePayload = {
        amount: amount.toString(),
        currency: currency,
        error_url: errorUrl,
        success_url: successUrl
      };

      console.log("[WAVE PASS] Creating checkout session:", wavePayload);

      const response = await fetch("https://api.wave.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${waveApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(wavePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[WAVE PASS] API Error:", response.status, errorText);
        return new Response(
          JSON.stringify({
            error: "Wave payment initiation failed",
            details: errorText
          }),
          {
            status: response.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const data = await response.json();
      console.log("[WAVE PASS] Checkout session created:", data.id);

      return new Response(
        JSON.stringify({
          success: true,
          payment_method: "wave",
          checkout_url: data.wave_launch_url,
          session_id: data.id,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else if (payment_method === "orange_money") {
      const orangeApiKey = Deno.env.get("ORANGE_MONEY_API_KEY");
      const orangeMerchantId = Deno.env.get("ORANGE_MONEY_MERCHANT_ID");

      if (!orangeApiKey || !orangeMerchantId) {
        console.error("Orange Money credentials not configured");
        return new Response(
          JSON.stringify({ error: "Orange Money payment service not configured" }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const orangePayload = {
        merchant_key: orangeMerchantId,
        currency: currency,
        order_id: reference,
        amount: amount,
        return_url: successUrl,
        cancel_url: errorUrl,
        notif_url: `${baseUrl}/api/orange-notify`,
      };

      console.log("[ORANGE MONEY PASS] Creating payment:", orangePayload);

      const response = await fetch("https://api.orange.com/orange-money-webpay/dev/v1/webpayment", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${orangeApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orangePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ORANGE MONEY PASS] API Error:", response.status, errorText);
        return new Response(
          JSON.stringify({
            error: "Orange Money payment initiation failed",
            details: errorText
          }),
          {
            status: response.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const data = await response.json();
      console.log("[ORANGE MONEY PASS] Payment created:", data.payment_token);

      return new Response(
        JSON.stringify({
          success: true,
          payment_method: "orange_money",
          checkout_url: data.payment_url,
          payment_token: data.payment_token,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid payment method. Use 'wave' or 'orange_money'" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("[PASS PAYMENT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
