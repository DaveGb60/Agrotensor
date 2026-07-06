import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ShieldCheck, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  scanForRecoverableData,
  restoreFromScan,
  writeAutoSnapshot,
  RecoverySummary,
  RestoreOutcome,
} from '@/lib/dataRecovery';
import { toast } from 'sonner';

export default function DataRecovery() {
  const [scanning, setScanning] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [summary, setSummary] = useState<RecoverySummary | null>(null);
  const [outcome, setOutcome] = useState<RestoreOutcome | null>(null);

  const runScan = async () => {
    setScanning(true);
    setOutcome(null);
    try {
      const s = await scanForRecoverableData();
      setSummary(s);
    } catch (e) {
      toast.error('Scan failed', { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    void runScan();
  }, []);

  const runRestore = async () => {
    if (!summary) return;
    setRestoring(true);
    try {
      const result = await restoreFromScan(summary.scans);
      setOutcome(result);
      if (result.projectsRestored + result.recordsRestored + result.animalsRestored > 0) {
        toast.success('Data restored', {
          description: `${result.projectsRestored} projects, ${result.recordsRestored} records, ${result.animalsRestored} animals recovered.`,
        });
      } else {
        toast.info('Nothing new to restore', {
          description: 'All discovered items already exist in the live database.',
        });
      }
      // Refresh scan + write a fresh snapshot
      await writeAutoSnapshot();
      await runScan();
    } catch (e) {
      toast.error('Restore failed', { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setRestoring(false);
    }
  };

  const forceSnapshot = async () => {
    const ok = await writeAutoSnapshot();
    if (ok) {
      toast.success('Snapshot saved', { description: 'A rescue copy of your current data was written.' });
      void runScan();
    } else {
      toast.info('No data to snapshot yet.');
    }
  };

  const totalRecoverable =
    (summary?.totalProjects ?? 0) + (summary?.totalRecords ?? 0) + (summary?.totalAnimals ?? 0);

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Data Recovery
        </h1>
        <p className="text-muted-foreground mt-1">
          Scan this device's local storage for projects and records from previous app versions and restore them.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>How data survives app updates</AlertTitle>
        <AlertDescription className="text-sm space-y-2">
          <p>
            AgroTensor stores everything in this browser's local database (IndexedDB). App updates do <b>not</b> touch
            your data — the schema is upgraded in place, never wiped. From this version on, we also keep an
            independent rescue snapshot in a separate database so future updates always have a fallback.
          </p>
          <p>
            If your data disappeared after an update, it usually means the browser opened the app from a different
            web address than before (each address has its own private database). Data from a different address can
            only be recovered by opening the app from that original address.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" /> Local storage scan
            </CardTitle>
            <CardDescription>Looks through every AgroTensor database on this device.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={runScan} disabled={scanning}>
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Rescan</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!summary ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Scanning...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Currently live" value={summary.liveProjectCount} suffix="projects" />
                <Stat label="Discovered" value={summary.totalProjects} suffix="projects" />
                <Stat label="Discovered" value={summary.totalRecords} suffix="records" />
                <Stat label="Discovered" value={summary.totalAnimals} suffix="animals" />
              </div>

              {summary.hasSnapshot && (
                <div className="text-xs text-muted-foreground">
                  Last rescue snapshot: {summary.snapshotAt ? new Date(summary.snapshotAt).toLocaleString() : 'available'}.
                </div>
              )}

              {summary.scans.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    No orphaned AgroTensor data found on this device beyond what is already loaded.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sources found</p>
                  <div className="rounded-md border divide-y">
                    {summary.scans.map((scan) => (
                      <div key={scan.source} className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="font-mono text-xs text-muted-foreground">{scan.source}</div>
                        <div className="flex gap-2 flex-wrap">
                          {scan.projects.length > 0 && <Badge variant="secondary">{scan.projects.length} projects</Badge>}
                          {scan.records.length > 0 && <Badge variant="secondary">{scan.records.length} records</Badge>}
                          {scan.animals.length > 0 && <Badge variant="secondary">{scan.animals.length} animals</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={runRestore}
                  disabled={restoring || totalRecoverable === 0}
                >
                  {restoring && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Restore discovered data
                </Button>
                <Button variant="outline" onClick={forceSnapshot}>
                  Save rescue snapshot now
                </Button>
              </div>

              {outcome && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Restore complete</AlertTitle>
                  <AlertDescription className="text-sm">
                    Restored {outcome.projectsRestored} projects, {outcome.recordsRestored} records, and {outcome.animalsRestored} animals.
                    {outcome.skipped > 0 && ` Skipped ${outcome.skipped} items already present or locked.`}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{suffix}</div>
    </div>
  );
}
