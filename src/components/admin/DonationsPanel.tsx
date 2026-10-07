import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Donation {
  reference: string; email: string | null; donor_name: string | null; message: string | null;
  amount_minor: number; currency: string; channel: string | null; paid_at: string | null; created_at: string;
}
interface Data { count: number; donors: number; totals: Record<string, number>; month: Record<string, number>; recent: Donation[] }

const fmt = (minor: number, cur: string) =>
  `${cur} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const join = (m: Record<string, number>) => Object.entries(m).map(([c, v]) => fmt(v, c)).join(" · ") || "—";

export function DonationsPanel({ callAdmin }: { callAdmin: (a: string) => Promise<any> }) {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { callAdmin("donations").then(setData).catch((e) => setErr(e.message)); }, [callAdmin]);

  if (err) return <p className="text-sm text-destructive p-4">Could not load donations: {err}</p>;
  if (!data) return <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Total received", join(data.totals)], ["This month", join(data.month)],
          ["Transactions", String(data.count)], ["Unique supporters", String(data.donors)]].map(([l, v]) => (
          <Card key={l}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="text-lg font-semibold break-words">{v}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transactions</CardTitle>
          <CardDescription>Successful coffee/support payments, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.recent.length === 0 ? <p className="text-sm text-muted-foreground">No donations yet.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Supporter</TableHead><TableHead>Amount</TableHead>
                <TableHead>Method</TableHead><TableHead>Message</TableHead><TableHead>Reference</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.recent.map((d) => (
                  <TableRow key={d.reference}>
                    <TableCell className="whitespace-nowrap">{new Date(d.paid_at || d.created_at).toLocaleString()}</TableCell>
                    <TableCell>{d.donor_name || "—"}<div className="text-xs text-muted-foreground">{d.email}</div></TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{fmt(d.amount_minor, d.currency)}</TableCell>
                    <TableCell>{d.channel ? <Badge variant="secondary">{d.channel}</Badge> : "—"}</TableCell>
                    <TableCell className="max-w-[220px] truncate" title={d.message || ""}>{d.message || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{d.reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
