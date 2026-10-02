import { useEffect, useRef, useState } from 'react';
import { BarChart3, Loader2, Send, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getAllProjects, getAnimalsByProject, getRecordsByProject, FarmProject } from '@/lib/db';
import { RichAnswer } from './RichAnswer';
import { cn } from '@/lib/utils';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farm-insights`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const SUGGESTIONS = [
  'Show my monthly costs vs revenue as a chart',
  'Where am I spending the most? Give a table',
  'How are my yields trending, and how can I improve them?',
  'Give a histogram of my sale amounts',
];

interface Turn { role: 'user' | 'assistant'; content: string; error?: string }

async function buildContext(p: FarmProject) {
  const strip = (o: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(o).filter(([k, v]) => v !== undefined && v !== '' && !/^(id|projectId|lockedAt|createdAt|updatedAt|isLocked)$/.test(k)));
  const ctx: Record<string, unknown> = {
    title: p.title, type: p.projectType, recordType: p.recordType, startDate: p.startDate,
    completed: p.isCompleted, details: p.details, customColumns: p.customColumns,
  };
  if (p.projectType === 'breeding') {
    const animals = await getAnimalsByProject(p.id);
    ctx.animals = animals.slice(0, 300).map((a) => strip({
      tag: a.animalId, sex: a.sex, breed: a.breed, age: a.age, birthDate: a.birthDate, health: a.healthStatus,
      status: a.currentStatus, acquisitionCost: a.acquisitionCost,
      matings: a.matingHistory.length, pregnancies: a.pregnancyHistory.map((x) => strip({ start: x.startDate, status: x.status })),
      births: a.birthRecords.map((b) => strip({ date: b.birthDate, offspring: b.offspringIds.length })),
      sales: a.saleRecords.map((s) => strip({ date: s.saleDate, price: s.price })),
      treatments: a.treatmentHistory.map((t) => strip({ date: t.date, treatment: t.treatment, cost: t.cost })),
      deaths: a.deathRecords.map((d) => strip({ date: d.deathDate, cause: d.cause })),
    }));
  } else {
    const records = await getRecordsByProject(p.id);
    ctx.recordCount = records.length;
    ctx.records = records
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-600)
      .map((r) => strip({
        date: r.date, item: r.item, produce: r.produceAmount, revenue: r.produceRevenue, comment: r.comment?.slice(0, 120),
        ...r.customFields, batchSale: r.isBatchSale || undefined, sold: r.soldQuantity,
      }));
  }
  return ctx;
}

export function FarmInsightsDialog({ open, onOpenChange, initialProjectId }: {
  open: boolean; onOpenChange: (o: boolean) => void; initialProjectId?: string;
}) {
  const [projects, setProjects] = useState<FarmProject[]>([]);
  const [projectId, setProjectId] = useState<string | undefined>(initialProjectId);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    getAllProjects().then((ps) => {
      const live = ps.filter((p) => !p.isDeleted);
      setProjects(live);
      setProjectId((cur) => cur ?? initialProjectId ?? live[0]?.id);
    });
  }, [open, initialProjectId]);

  useEffect(() => { setTurns([]); }, [projectId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns]);

  const ask = async (q?: string) => {
    const question = (q ?? input).trim();
    const project = projects.find((p) => p.id === projectId);
    if (!question || !project || busy) return;
    if (!navigator.onLine) {
      setTurns((t) => [...t, { role: 'user', content: question }, { role: 'assistant', content: '', error: 'You are offline. Connect to the internet to analyse this project.' }]);
      return;
    }
    setInput('');
    setBusy(true);
    const history = turns.filter((t) => !t.error && t.content).map(({ role, content }) => ({ role, content }));
    setTurns((t) => [...t, { role: 'user', content: question }, { role: 'assistant', content: '' }]);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const update = (fn: (t: Turn) => Turn) => setTurns((ts) => ts.map((t, i) => (i === ts.length - 1 ? fn(t) : t)));
    try {
      const context = await buildContext(project);
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ question, project: context, history }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'Analysis is unavailable right now.');
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        const m = /\n*\[\[ERROR:(.*)\]\]$/.exec(full);
        update((t) => ({ ...t, content: m ? full.slice(0, m.index) : full, error: m?.[1] }));
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') update((t) => ({ ...t, error: (e as Error).message }));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const project = projects.find((p) => p.id === projectId);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) abortRef.current?.abort(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl w-[96vw] h-[88dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border space-y-2">
          <DialogTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Farm Insights</DialogTitle>
          <DialogDescription>Ask about a project's costs, yields and operations. Answers can include tables and charts.</DialogDescription>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger><SelectValue placeholder={projects.length ? 'Choose a project' : 'No projects yet'} /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}{p.isCompleted ? ' (completed)' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {turns.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{project ? `Try asking about “${project.title}”:` : 'Create a project first to get insights.'}</p>
              {project && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} variant="outline" size="sm" className="h-auto whitespace-normal text-left" onClick={() => ask(s)}>{s}</Button>
                  ))}
                </div>
              )}
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
              {t.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 text-sm whitespace-pre-wrap">{t.content}</div>
              ) : (
                <div className="w-full">
                  {!t.content && !t.error && <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Analysing your records…</span>}
                  {t.content && <RichAnswer text={t.content} streaming={busy && i === turns.length - 1} />}
                  {t.error && <p className="mt-2 text-sm text-destructive">{t.error}</p>}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3 flex items-end gap-2">
          <Textarea
            value={input} onChange={(e) => setInput(e.target.value)} rows={1} disabled={!project}
            placeholder="e.g. Which month had the best profit and why?"
            className="min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
          />
          {busy ? (
            <Button size="icon" variant="outline" className="h-11 w-11 shrink-0" aria-label="Stop" onClick={() => abortRef.current?.abort()}><Square className="h-4 w-4" /></Button>
          ) : (
            <Button size="icon" className="h-11 w-11 shrink-0" aria-label="Ask" disabled={!input.trim() || !project} onClick={() => ask()}><Send className="h-4 w-4" /></Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
