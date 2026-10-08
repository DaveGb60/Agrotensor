import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, ExternalLink, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/agroAI";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FeedPost {
  id: string;
  title: string;
  summary: string;
  body: string;
  area: string;
  image_url: string;
  links: { label: string; url: string }[];
  likes: number;
  dislikes: number;
  created_at: string;
}

const REACT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feed-react`;
const STORE_KEY = "agrotensor-feed-reactions";
const CACHE_KEY = "agrotensor-feed-cache";

const readReactions = (): Record<string, 1 | -1> => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function Reactions({ post, mine, onReact }: { post: FeedPost; mine?: 1 | -1; onReact: (v: 1 | -1) => void }) {
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Like"
        aria-pressed={mine === 1}
        onClick={() => onReact(1)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
          mine === 1 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
        )}
      >
        <ThumbsUp className="h-4 w-4" /> {post.likes}
      </button>
      <button
        type="button"
        aria-label="Dislike"
        aria-pressed={mine === -1}
        onClick={() => onReact(-1)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
          mine === -1 ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:text-foreground"
        )}
      >
        <ThumbsDown className="h-4 w-4" /> {post.dislikes}
      </button>
    </div>
  );
}

const Feed = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]"); } catch { return []; }
  });
  const [loading, setLoading] = useState(posts.length === 0);
  const [mine, setMine] = useState(readReactions);
  const [open, setOpen] = useState<FeedPost | null>(null);

  useEffect(() => {
    document.title = "Farm Feed — AgroTensor";
    supabase
      .from("feed_posts")
      .select("id,title,summary,body,area,image_url,links,likes,dislikes,created_at")
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          if (!posts.length) toast({ title: "Couldn't load the feed", description: "Check your connection and try again." });
          return;
        }
        const list = (data ?? []) as unknown as FeedPost[];
        setPosts(list);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* full */ }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const react = async (post: FeedPost, v: 1 | -1) => {
    const prev = mine[post.id];
    const next = prev === v ? 0 : v;
    // Optimistic update
    const delta = (p: FeedPost): FeedPost => ({
      ...p,
      likes: p.likes + (next === 1 ? 1 : 0) - (prev === 1 ? 1 : 0),
      dislikes: p.dislikes + (next === -1 ? 1 : 0) - (prev === -1 ? 1 : 0),
    });
    const updatedMine = { ...mine };
    if (next === 0) delete updatedMine[post.id]; else updatedMine[post.id] = next;
    setMine(updatedMine);
    localStorage.setItem(STORE_KEY, JSON.stringify(updatedMine));
    setPosts((ps) => ps.map((p) => (p.id === post.id ? delta(p) : p)));
    setOpen((o) => (o && o.id === post.id ? delta(o) : o));

    try {
      const res = await fetch(REACT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ postId: post.id, deviceId: getDeviceId(), value: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      const sync = (p: FeedPost) => (p.id === post.id ? { ...p, likes: data.likes, dislikes: data.dislikes } : p);
      setPosts((ps) => ps.map(sync));
      setOpen((o) => (o ? sync(o) : o));
    } catch {
      toast({ title: "Reaction not saved", description: "You may be offline. Please try again later." });
    }
  };

  const paragraphs = (body: string) => body.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-primary">
          <Newspaper className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wider">Farm Feed</span>
        </div>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-semibold">Farming news & know-how</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Short, practical reads on crops, livestock, markets and farm technology. Fresh articles every Monday, Wednesday and Friday.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3"><Skeleton className="aspect-video w-full rounded-xl" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /></div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          The first articles are on their way. Check back soon.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpen(post)}
              onKeyDown={(e) => { if (e.key === "Enter") setOpen(post); }}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="aspect-video overflow-hidden bg-muted">
                <img src={post.image_url} alt={post.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{post.area}</Badge>
                  <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                </div>
                <h2 className="text-lg font-semibold leading-snug">{post.title}</h2>
                <p className="line-clamp-3 text-sm text-muted-foreground">{post.summary}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <Reactions post={post} mine={mine[post.id]} onReact={(v) => react(post, v)} />
                  <span className="text-sm font-medium text-primary">Read</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
          {open && (
            <>
              <img src={open.image_url} alt={open.title} className="aspect-video w-full object-cover" />
              <div className="space-y-4 p-6">
                <DialogHeader className="space-y-2 text-left">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{open.area}</Badge>
                    <time dateTime={open.created_at}>{formatDate(open.created_at)}</time>
                  </div>
                  <DialogTitle className="text-2xl leading-tight">{open.title}</DialogTitle>
                  <DialogDescription className="sr-only">{open.summary}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 leading-relaxed text-foreground/90">
                  {paragraphs(open.body).map((p, i) => <p key={i}>{p}</p>)}
                </div>
                {open.links?.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-4">
                    <p className="text-sm font-medium">Learn more</p>
                    <ul className="space-y-1">
                      {open.links.map((l) => (
                        <li key={l.url}>
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline">
                            {l.label} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="border-t border-border pt-4">
                  <Reactions post={open} mine={mine[open.id]} onReact={(v) => react(open, v)} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;
