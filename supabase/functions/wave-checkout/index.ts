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
    const { amount, currency, metadata } = await req.json();

    if (!amount || !currency) {
      return new Response(
        JSON.stringify({ error: "Amount and currency are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const waveApiKey = Deno.env.get("WAVE_API_KEY");
    if (!waveApiKey) {
      console.error("WAVE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const baseUrl = req.headers.get("origin") || "https://evenpass.sn";

    const wavePayload = {
      amount: amount.toString(),
      currency: currency,
      error_url: `${baseUrl}/error`,
      success_url: `${baseUrl}/success?booking=${metadata?.bookingNumber || ""}`
    };

    console.log("[WAVE] Creating checkout session:", wavePayload);

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
      console.error("[WAVE] API Error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: "Payment initiation failed",
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
    console.log("[WAVE] Checkout session created:", data.id);

    return new Response(
      JSON.stringify({
        success: true,
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
  } catch (error) {
    console.error("[WAVE] Unexpected error:", error);
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