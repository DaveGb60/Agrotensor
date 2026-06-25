// Paystack edge function: returns public key and verifies transactions.
// Deployed with verify_jwt = false (donations are public).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PAYSTACK_PUBLIC_KEY = Deno.env.get("PAYSTACK_PUBLIC_KEY") ?? "";
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "";

  try {
    if (action === "config") {
      if (!PAYSTACK_PUBLIC_KEY) {
        return json({ error: "Paystack public key not configured" }, 500);
      }
      return json({ publicKey: PAYSTACK_PUBLIC_KEY });
    }

    if (action === "verify") {
      if (!PAYSTACK_SECRET_KEY) {
        return json({ error: "Paystack secret key not configured" }, 500);
      }
      const body = await req.json().catch(() => ({}));
      const reference = String(body?.reference ?? "").trim();
      if (!reference || reference.length > 200) {
        return json({ error: "Invalid reference" }, 400);
      }
      const r = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
      );
      const data = await r.json();
      if (!r.ok) {
        return json({ error: "Verification failed", details: data }, r.status);
      }
      const status = data?.data?.status;
      const amount = data?.data?.amount; // kobo / smallest unit
      const currency = data?.data?.currency;
      const channel = data?.data?.channel;
      return json({
        success: status === "success",
        status,
        amount,
        currency,
        channel,
        reference: data?.data?.reference,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
