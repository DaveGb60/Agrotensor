import { supabase } from "@/integrations/supabase/client";
import { isNetworkOnline } from './networkStatus';

let publicKeyCache: string | null = null;
let scriptPromise: Promise<void> | null = null;

const PAYSTACK_SCRIPT = "https://js.paystack.co/v2/inline.js";

export async function getPaystackPublicKey(): Promise<string> {
  if (!isNetworkOnline()) throw new Error('Paystack requires an internet connection');
  if (publicKeyCache) return publicKeyCache;
  const { data, error } = await supabase.functions.invoke("paystack?action=config", {
    method: "GET",
  });
  if (error) throw new Error(error.message);
  if (!data?.publicKey) throw new Error("Paystack public key unavailable");
  publicKeyCache = data.publicKey as string;
  return publicKeyCache;
}

export function loadPaystackScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!isNetworkOnline()) return Promise.reject(new Error('Paystack requires an internet connection'));
  if ((window as any).PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = PAYSTACK_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Paystack"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export async function verifyPaystackTransaction(reference: string) {
  if (!isNetworkOnline()) throw new Error('Paystack verification requires an internet connection');
  const { data, error } = await supabase.functions.invoke("paystack?action=verify", {
    method: "POST",
    body: { reference },
  });
  if (error) throw new Error(error.message);
  return data as {
    success: boolean;
    status: string;
    amount: number;
    currency: string;
    channel: string;
    reference: string;
  };
}

export interface DonationOptions {
  email: string;
  amount: number; // major units (KES/NGN/etc.)
  currency?: string;
  name?: string;
  message?: string;
  onSuccess: (ref: string) => void;
  onClose?: () => void;
}

export async function openPaystackDonation(opts: DonationOptions) {
  const [publicKey] = await Promise.all([getPaystackPublicKey(), loadPaystackScript()]);
  const PaystackPop = (window as any).PaystackPop;
  if (!PaystackPop) throw new Error("Paystack not available");
  const handler = PaystackPop.setup({
    key: publicKey,
    email: opts.email,
    amount: Math.round(opts.amount * 100), // smallest unit
    currency: opts.currency || "KES",
    channels: ["card", "mobile_money", "bank", "bank_transfer", "ussd"],
    metadata: {
      custom_fields: [
        opts.name && {
          display_name: "Name",
          variable_name: "name",
          value: opts.name,
        },
        opts.message && {
          display_name: "Message",
          variable_name: "message",
          value: opts.message,
        },
      ].filter(Boolean),
    },
    callback: (response: { reference: string }) => {
      opts.onSuccess(response.reference);
    },
    onClose: () => opts.onClose?.(),
  });
  handler.openIframe();
}
