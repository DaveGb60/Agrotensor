import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  openPaystackDonation,
  verifyPaystackTransaction,
} from "@/lib/paystack";

const PRESETS = [200, 500, 1000, 2500];
const CURRENCIES = ["KES", "NGN", "GHS", "ZAR", "USD"] as const;
type Currency = (typeof CURRENCIES)[number];

interface DonateDialogProps {
  trigger?: React.ReactNode;
}

export function DonateDialog({ trigger }: DonateDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(500);
  const [currency, setCurrency] = useState<Currency>("KES");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setMessage("");
    setLoading(false);
  };

  const handleDonate = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: "Email required", description: "Enter a valid email for the receipt." });
      return;
    }
    if (!amount || amount < 50) {
      toast({ title: "Amount too low", description: "Minimum donation is 50." });
      return;
    }
    setLoading(true);
    // Close our dialog first so Paystack's iframe isn't blocked by Radix's overlay/focus trap
    setOpen(false);
    // Give Radix a tick to unmount the overlay before opening Paystack
    await new Promise((r) => setTimeout(r, 50));
    try {
      await openPaystackDonation({
        email,
        amount,
        currency,
        name: name || undefined,
        message: message || undefined,
        onClose: () => setLoading(false),
        onSuccess: async (reference) => {
          try {
            const res = await verifyPaystackTransaction(reference);
            if (res.success) {
              toast({
                title: "Thank you! 💚",
                description: `Your ${currency} ${amount} donation via ${res.channel} was received.`,
              });
              reset();
            } else {
              toast({
                title: "Payment not confirmed",
                description: `Status: ${res.status}. If you were charged, contact support.`,
                variant: "destructive",
              });
            }
          } catch (e: any) {
            toast({
              title: "Verification error",
              description: e?.message ?? "Could not verify the payment.",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (e: any) {
      toast({
        title: "Could not open Paystack",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-2">
            <Heart className="h-4 w-4" />
            Donate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Support FarmDesk
          </DialogTitle>
          <DialogDescription>
            Donations and tips help keep FarmDesk free. Pay securely via card, mobile money, bank
            transfer, or USSD — powered by Paystack.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={amount === p ? "default" : "outline"}
                  onClick={() => setAmount(p)}
                >
                  {currency} {p.toLocaleString()}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="h-10 rounded-md border border-input bg-background px-2 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={50}
                step={50}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Custom amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="donor-email">Email (for receipt)</Label>
            <Input
              id="donor-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="donor-name">Name (optional)</Label>
            <Input
              id="donor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="donor-message">Message (optional)</Label>
            <Textarea
              id="donor-message"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="A note to the team"
            />
          </div>

          <Button onClick={handleDonate} disabled={loading} className="w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening Paystack…
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" />
                Donate {currency} {amount.toLocaleString()}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Secured by Paystack · Card · M-Pesa · Mobile Money · Bank · USSD
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}