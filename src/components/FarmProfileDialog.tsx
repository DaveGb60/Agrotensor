import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FarmProfile, getProfile, saveProfile } from '@/lib/agroAI';

const EMPTY: FarmProfile = { location: '', farmType: '', crops: '', size: '', notes: '' };

export function FarmProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [p, setP] = useState<FarmProfile>(EMPTY);
  useEffect(() => { if (open) setP({ ...EMPTY, ...(getProfile() ?? {}) }); }, [open]);
  const set = (k: keyof FarmProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setP((x) => ({ ...x, [k]: e.target.value.slice(0, 120) }));

  const close = (save: boolean) => {
    saveProfile(save ? p : getProfile());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(false); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tell AgroTensor AI about your farm</DialogTitle>
          <DialogDescription>
            Optional. Anything you share here helps give answers that fit you. Leave blank what doesn't apply — you can change it anytime.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1"><Label>Location (county / region)</Label><Input value={p.location} onChange={set('location')} placeholder="e.g. Nakuru, Kenya" /></div>
          <div className="grid gap-1"><Label>Type of farming</Label><Input value={p.farmType} onChange={set('farmType')} placeholder="e.g. Dairy, mixed, poultry" /></div>
          <div className="grid gap-1"><Label>Crops or livestock</Label><Input value={p.crops} onChange={set('crops')} placeholder="e.g. Maize, beans, 10 cows" /></div>
          <div className="grid gap-1"><Label>Farm size</Label><Input value={p.size} onChange={set('size')} placeholder="e.g. 3 acres" /></div>
          <div className="grid gap-1"><Label>Anything else</Label><Textarea rows={2} value={p.notes} onChange={set('notes')} placeholder="e.g. Irrigation available, organic" /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => close(false)}>Skip</Button>
          <Button onClick={() => close(true)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
