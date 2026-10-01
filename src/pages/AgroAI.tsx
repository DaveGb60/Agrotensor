import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ImagePlus, Loader2, MoreVertical, Plus, RotateCw, Search, Send, X, Sprout, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AIConversation, AIMessage, AIQuota, deleteConversation, fetchConversations, fetchMessages, fetchUsage,
  fileToDataUrl, getLocalConversations, getLocalMessages, isCloudOnly, removeLocalChat, saveLocalChat,
  searchConversations, sendChat, setCloudOnly, signPaths, uploadImage,
} from '@/lib/agroAI';

function renderMarkdown(text: string) {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = esc
    .replace(/^### (.*)$/gm, '<h4 class="font-semibold mt-2">$1</h4>')
    .replace(/^## (.*)$/gm, '<h3 class="font-semibold mt-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*[-*] (.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\s*\d+\. (.*)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n/g, '<br/>');
  return DOMPurify.sanitize(html);
}

interface Pending { dataUrl: string; path?: string; uploading: boolean }

function mergeConvs(a: AIConversation[], b: AIConversation[]) {
  const map = new Map<string, AIConversation>();
  [...a, ...b].forEach((c) => {
    const cur = map.get(c.id);
    if (!cur || c.updated_at > cur.updated_at) map.set(c.id, c);
  });
  return [...map.values()].sort((x, y) => y.updated_at.localeCompare(x.updated_at));
}

export default function AgroAI() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<AIConversation[]>(() => getLocalConversations());
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState<AIQuota | null>(null);
  const [limitHit, setLimitHit] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AIConversation[] | null>(null);
  const [moreCursor, setMoreCursor] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [cloudOnly, setCloudOnlyState] = useState(isCloudOnly());
  const [lastFailed, setLastFailed] = useState<{ text: string; attachments: string[] } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(conversationId ?? null);

  const outOfMessages = quota ? quota.messagesUsed >= quota.messageLimit : false;
  const outOfImages = quota ? quota.imagesUsed >= quota.imageLimit : false;

  // Initial: usage + cloud list
  useEffect(() => {
    fetchUsage().then(setQuota).catch(() => {});
    fetchConversations().then((list) => {
      setConvs((cur) => mergeConvs(cur, list));
      if (list.length === 20) setMoreCursor(list[list.length - 1].updated_at);
    }).catch(() => {});
  }, []);

  // Load active conversation
  useEffect(() => {
    activeIdRef.current = conversationId ?? null;
    setLastFailed(null);
    if (!conversationId) { setMessages([]); return; }
    const local = getLocalMessages(conversationId);
    if (local) setMessages(local);
    else setMessages([]);
    fetchMessages(conversationId).then((m) => {
      if (activeIdRef.current !== conversationId) return;
      setMessages(m);
      const conv = convs.find((c) => c.id === conversationId);
      if (conv) saveLocalChat(conv, m);
    }).catch(() => { if (!local) toast.error('Could not load this chat. Check your connection.'); });
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Sign attachment URLs
  useEffect(() => {
    const need = messages.flatMap((m) => m.attachments).filter((p) => !signed[p]);
    if (need.length) signPaths(need).then((u) => setSigned((s) => ({ ...s, ...u }))).catch(() => {});
  }, [messages, signed]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Debounced search: local first, then cloud
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults(null); return; }
    setResults(convs.filter((c) => `${c.title} ${c.preview}`.toLowerCase().includes(q)));
    const t = setTimeout(() => {
      searchConversations(q).then((r) => setResults((cur) => mergeConvs(cur ?? [], r))).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [query, convs]);

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = 3 - photos.length;
    for (const file of Array.from(files).slice(0, room)) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setPhotos((p) => [...p, { dataUrl, uploading: true }]);
        uploadImage(dataUrl)
          .then(({ path }) => {
            setPhotos((p) => p.map((x) => (x.dataUrl === dataUrl ? { ...x, path, uploading: false } : x)));
            setSigned((s) => ({ ...s, [path]: dataUrl }));
            setQuota((q) => (q ? { ...q, imagesUsed: q.imagesUsed + 1 } : q));
          })
          .catch((e) => {
            setPhotos((p) => p.filter((x) => x.dataUrl !== dataUrl));
            toast.error(e.message);
          });
      } catch (e) { toast.error((e as Error).message); }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const send = useCallback(async (retry?: { text: string; attachments: string[] }) => {
    const body = retry?.text ?? text.trim();
    const attachments = retry?.attachments ?? photos.filter((p) => p.path).map((p) => p.path!);
    if ((!body && !attachments.length) || busy) return;
    if (photos.some((p) => p.uploading)) { toast('Please wait for your photo to finish uploading.'); return; }

    setBusy(true);
    setLastFailed(null);
    if (!retry) { setText(''); setPhotos([]); }
    const now = new Date().toISOString();
    const userMsg: AIMessage = { id: `u-${now}`, role: 'user', text: body, attachments, status: 'sent', created_at: now };
    const botId = `a-${now}`;
    setMessages((m) => [...(retry ? m.filter((x) => x.status !== 'failed') : m), userMsg,
      { id: botId, role: 'assistant', text: '', attachments: [], status: 'pending', created_at: now }]);

    let convId = conversationId ?? null;
    let title = body.slice(0, 60) || 'Photo question';
    try {
      const final = await sendChat({ text: body, attachments, conversationId: convId }, {
        onMeta: (meta) => {
          convId = meta.conversationId;
          title = meta.title;
          activeIdRef.current = convId;
          setMessages((m) => m.map((x) => (x.id === botId ? { ...x, status: meta.failed ? 'failed' : 'streaming' } : x)));
        },
        onToken: (t) => setMessages((m) => m.map((x) => (x.id === botId ? { ...x, text: x.text + t } : x))),
      });
      setQuota((q) => (q ? { ...q, messagesUsed: q.messagesUsed + 1 } : q));
      let finalMsgs: AIMessage[] = [];
      setMessages((m) => {
        finalMsgs = m.map((x) => (x.id === botId ? { ...x, text: final, status: x.status === 'failed' ? 'failed' : 'sent' } : x));
        return finalMsgs;
      });
      if (convId) {
        const existing = convs.find((c) => c.id === convId);
        const conv: AIConversation = {
          id: convId, title: existing?.title ?? title, preview: final.slice(0, 140),
          created_at: existing?.created_at ?? now, updated_at: new Date().toISOString(),
        };
        setConvs((c) => mergeConvs(c.filter((x) => x.id !== convId), [conv]));
        setTimeout(() => saveLocalChat(conv, finalMsgs), 0);
        if (!conversationId) navigate(`/ai/${convId}`, { replace: true });
      }
    } catch (e) {
      const err = e as Error & { status?: number };
      setMessages((m) => m.filter((x) => x.id !== botId).map((x) => (x.id === userMsg.id ? { ...x, status: 'failed' } : x)));
      if (err.status === 429 && /limit|today/i.test(err.message)) {
        setLimitHit(err.message);
        setQuota((q) => (q ? { ...q, messagesUsed: q.messageLimit } : q));
      } else {
        setLastFailed({ text: body, attachments });
        toast.error(navigator.onLine ? err.message : 'You are offline. Connect to ask AgroTensor AI.');
      }
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [text, photos, busy, conversationId, convs, navigate]);

  const removeChat = async (id: string) => {
    try {
      await deleteConversation(id);
      removeLocalChat(id);
      setConvs((c) => c.filter((x) => x.id !== id));
      setResults((r) => r?.filter((x) => x.id !== id) ?? null);
      if (id === conversationId) navigate('/ai');
      toast.success('Chat deleted');
    } catch { toast.error('Could not delete this chat. Try again when online.'); }
  };

  const loadMore = async () => {
    if (!moreCursor) return;
    try {
      const list = await fetchConversations(moreCursor);
      setConvs((c) => mergeConvs(c, list));
      setMoreCursor(list.length === 20 ? list[list.length - 1].updated_at : null);
    } catch { toast.error('Could not load older chats.'); }
  };

  const shown = results ?? convs;

  const list = (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 space-y-2 border-b border-border">
        <Button className="w-full justify-start gap-2" onClick={() => { navigate('/ai'); setListOpen(false); }}>
          <Plus className="h-4 w-4" /> New chat
        </Button>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" className="pl-8" />
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1">
        {shown.length === 0 && <li className="text-sm text-muted-foreground p-3">{query ? 'No matching chats.' : 'No chats yet.'}</li>}
        {shown.map((c) => (
          <li key={c.id} className={cn('group flex items-center rounded-md', c.id === conversationId ? 'bg-accent' : 'hover:bg-muted')}>
            <button className="flex-1 min-w-0 text-left px-3 py-2" onClick={() => { navigate(`/ai/${c.id}`); setListOpen(false); }}>
              <p className="text-sm font-medium truncate">{c.title || 'Untitled chat'}</p>
              <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Chat options">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive" onClick={() => removeChat(c.id)}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
        {!results && moreCursor && (
          <li><Button variant="ghost" className="w-full" onClick={loadMore}>See more</Button></li>
        )}
      </ul>
      <div className="p-3 border-t border-border flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium">Keep chats in cloud only</p>
          <p className="text-[10px] text-muted-foreground">Don't store chats on this device</p>
        </div>
        <Switch checked={cloudOnly} onCheckedChange={(v) => { setCloudOnly(v); setCloudOnlyState(v); }} />
      </div>
    </div>
  );

  const remaining = useMemo(() => quota ? Math.max(0, quota.messageLimit - quota.messagesUsed) : null, [quota]);
  const disabled = busy || outOfMessages;

  return (
    <div className="flex h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)] border border-border rounded-lg overflow-hidden bg-card">
      <aside className="hidden lg:flex w-72 border-r border-border flex-col">{list}</aside>
      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="left" className="p-0 w-80 flex flex-col">
          <SheetHeader className="p-3 border-b"><SheetTitle>Chats</SheetTitle></SheetHeader>
          {list}
        </SheetContent>
      </Sheet>

      <section className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setListOpen(true)}>Chats</Button>
          <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center"><Sprout className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">AgroTensor AI</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {remaining !== null ? `${remaining}/${quota!.messageLimit} questions · ${Math.max(0, quota!.imageLimit - quota!.imagesUsed)}/${quota!.imageLimit} photos left today` : 'Your farming assistant'}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => navigate('/ai')} aria-label="New chat"><Plus className="h-4 w-4" /></Button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
              <Sprout className="h-10 w-10 text-primary" />
              <p className="font-medium text-foreground">Ask AgroTensor AI about your farm</p>
              <p className="text-sm max-w-sm">Crop diseases, livestock care, feeding, planting seasons — or attach a photo of a plant or animal.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] text-sm', m.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2' : 'text-foreground')}>
                {m.attachments.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {m.attachments.map((p) => signed[p]
                      ? <img key={p} src={signed[p]} alt="Attached" className="h-28 w-28 object-cover rounded-lg" />
                      : <div key={p} className="h-28 w-28 rounded-lg bg-muted animate-pulse" />)}
                  </div>
                )}
                {m.status === 'pending' ? (
                  <span className="inline-flex gap-1 py-2" aria-label="AgroTensor AI is typing">
                    {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                  </span>
                ) : m.role === 'assistant' ? (
                  <div className={cn('leading-relaxed', m.status === 'failed' && 'text-destructive')} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
                ) : (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                )}
                {m.role === 'user' && m.status === 'failed' && <p className="text-[10px] opacity-80 mt-1">Not sent</p>}
              </div>
            </div>
          ))}
          {lastFailed && !busy && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => send(lastFailed)}><RotateCw className="h-3.5 w-3.5 mr-1" /> Retry</Button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {(limitHit || outOfMessages) && (
          <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <p>{limitHit || `You've used all ${quota?.messageLimit} AgroTensor AI questions for today. Please come back tomorrow.`}</p>
          </div>
        )}

        <div className="border-t border-border p-3">
          {photos.length > 0 && (
            <div className="flex gap-2 mb-2">
              {photos.map((p) => (
                <div key={p.dataUrl} className="relative h-16 w-16">
                  <img src={p.dataUrl} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                  {p.uploading && <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-md"><Loader2 className="h-4 w-4 animate-spin" /></div>}
                  <button type="button" aria-label="Remove photo" onClick={() => setPhotos((x) => x.filter((y) => y !== p))}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => onPickFiles(e.target.files)} />
            <Button type="button" variant="ghost" size="icon" aria-label="Attach photo"
              disabled={disabled || outOfImages || photos.length >= 3} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-5 w-5" />
            </Button>
            <Textarea ref={inputRef} autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={1}
              placeholder={outOfMessages ? 'Daily limit reached' : 'Ask about crops, livestock, soil…'}
              disabled={outOfMessages} className="min-h-[44px] max-h-40 resize-none"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <Button type="button" size="icon" className="h-11 w-11 shrink-0" aria-label="Send"
              disabled={disabled || (!text.trim() && !photos.some((p) => p.path))} onClick={() => send()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
