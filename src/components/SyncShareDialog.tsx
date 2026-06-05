import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Download,
  Copy,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Share2,
  KeyRound,
} from 'lucide-react';
import { FarmProject } from '@/lib/db';
import { createSyncShare, claimSyncShare, CreateShareResult, ClaimResult } from '@/lib/syncShare';

interface SyncShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: FarmProject[];
  onSyncComplete: () => void;
}

type SendStep = 'select' | 'submitting' | 'done';
type ReceiveStep = 'enter' | 'fetching' | 'done';

export function SyncShareDialog({ open, onOpenChange, projects, onSyncComplete }: SyncShareDialogProps) {
  const { toast } = useToast();

  const [tab, setTab] = useState<'send' | 'receive'>('send');

  // Send state
  const [sendStep, setSendStep] = useState<SendStep>('select');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareResult, setShareResult] = useState<CreateShareResult | null>(null);

  // Receive state
  const [receiveStep, setReceiveStep] = useState<ReceiveStep>('enter');
  const [code, setCode] = useState('');
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);

  const reset = () => {
    setSendStep('select');
    setSelected(new Set());
    setShareResult(null);
    setReceiveStep('enter');
    setCode('');
    setClaimResult(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const handleCreateShare = async () => {
    if (selected.size === 0) {
      toast({ title: 'Select at least one project', variant: 'destructive' });
      return;
    }
    try {
      setSendStep('submitting');
      const res = await createSyncShare(Array.from(selected), projects);
      setShareResult(res);
      setSendStep('done');
    } catch (e) {
      toast({ title: 'Failed to create share', description: (e as Error).message, variant: 'destructive' });
      setSendStep('select');
    }
  };

  const handleClaim = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast({ title: 'Enter a sync code', variant: 'destructive' });
      return;
    }
    try {
      setReceiveStep('fetching');
      const res = await claimSyncShare(trimmed);
      setClaimResult(res);
      setReceiveStep('done');
      onSyncComplete();
      toast({
        title: 'Sync complete',
        description: `${res.importedProjects} project(s), ${res.importedRecords} new record(s) (${res.skippedRecords} duplicates skipped)`,
      });
    } catch (e) {
      toast({ title: 'Sync failed', description: (e as Error).message, variant: 'destructive' });
      setReceiveStep('enter');
    }
  };

  const copyCode = () => {
    if (!shareResult) return;
    navigator.clipboard.writeText(shareResult.share_code);
    toast({ title: 'Code copied' });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Project Sync
          </DialogTitle>
          <DialogDescription>
            Share projects between devices using a short, one-time sync code.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'send' | 'receive')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send" className="gap-2">
              <Send className="h-4 w-4" /> Send
            </TabsTrigger>
            <TabsTrigger value="receive" className="gap-2">
              <Download className="h-4 w-4" /> Receive
            </TabsTrigger>
          </TabsList>

          {/* ---------- SEND ---------- */}
          <TabsContent value="send" className="space-y-4 mt-4">
            {sendStep === 'select' && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Choose projects to share</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() =>
                      setSelected(
                        selected.size === projects.length
                          ? new Set()
                          : new Set(projects.map((p) => p.id))
                      )
                    }
                  >
                    {selected.size === projects.length ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <ScrollArea className="h-64 rounded-md border">
                  <div className="p-2 space-y-1">
                    {projects.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No projects available.</p>
                    )}
                    {projects.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 rounded-md p-2 hover:bg-muted cursor-pointer"
                      >
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">ID: {p.id.slice(0, 8)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
                <Button onClick={handleCreateShare} className="w-full gap-2" disabled={selected.size === 0}>
                  <Send className="h-4 w-4" />
                  Generate Sync Code ({selected.size})
                </Button>
              </>
            )}

            {sendStep === 'submitting' && (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading projects…</p>
              </div>
            )}

            {sendStep === 'done' && shareResult && (
              <div className="space-y-4 py-4">
                <div className="text-center space-y-1">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Share this code with the receiving device</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shareResult.share_code}
                    className="text-center font-mono text-2xl tracking-widest h-14"
                  />
                  <Button variant="outline" size="icon" className="h-14 w-14" onClick={copyCode}>
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Valid until {new Date(shareResult.expires_at).toLocaleString()}
                </p>
                <Button variant="outline" className="w-full gap-2" onClick={reset}>
                  <ArrowLeft className="h-4 w-4" /> Share another
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ---------- RECEIVE ---------- */}
          <TabsContent value="receive" className="space-y-4 mt-4">
            {receiveStep === 'enter' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sync-code" className="text-sm">Enter sync code</Label>
                  <Input
                    id="sync-code"
                    placeholder="ABCD-1234"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="text-center font-mono text-2xl tracking-widest h-14 uppercase"
                    maxLength={9}
                  />
                  <p className="text-xs text-muted-foreground">
                    Codes are case-insensitive. Duplicate records are skipped automatically.
                  </p>
                </div>
                <Button onClick={handleClaim} className="w-full gap-2" disabled={!code.trim()}>
                  <KeyRound className="h-4 w-4" /> Receive Sync
                </Button>
              </>
            )}

            {receiveStep === 'fetching' && (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Fetching projects…</p>
              </div>
            )}

            {receiveStep === 'done' && claimResult && (
              <div className="space-y-3 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
                <p className="font-medium">Sync complete</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{claimResult.importedProjects} project(s) merged</p>
                  <p>{claimResult.importedRecords} new record(s) imported</p>
                  <p>{claimResult.skippedRecords} duplicate(s) skipped</p>
                </div>
                <Button variant="outline" className="w-full gap-2 mt-2" onClick={reset}>
                  <ArrowLeft className="h-4 w-4" /> Receive another
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
