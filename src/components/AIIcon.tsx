import { cn } from "@/lib/utils";

/** AgroTensor AI mark: a faceted spark with orbiting nodes (no leaves). */
export function AIIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4", className)} aria-hidden="true">
      <path d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9z" fill="currentColor" fillOpacity={0.18} />
      <path d="M18.5 15.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z" />
      <circle cx="5" cy="18" r="1.4" />
      <path d="M6.2 17.2 9 14.6" strokeOpacity={0.6} />
      <circle cx="19" cy="4.5" r="1" fill="currentColor" />
    </svg>
  );
}
