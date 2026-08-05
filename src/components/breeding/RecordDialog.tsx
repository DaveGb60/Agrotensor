import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  FarmAnimal,
  AnimalSex,
  PregnancyStatus,
  MatingRecord,
  PregnancyRecord,
  BirthRecord,
  DeathRecord,
  SaleRecord,
  TreatmentRecord,
  OffspringInput,
  generateId,
} from '@/lib/db';
import { Plus, Trash2 } from 'lucide-react';

export type RecordDialogType = 'mating' | 'pregnancy' | 'birth' | 'death' | 'sale' | 'treatment';

interface RecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: RecordDialogType;
  animal: FarmAnimal;
  allAnimals: FarmAnimal[];
  onSubmit: (record: MatingRecord | PregnancyRecord | BirthRecord | DeathRecord | SaleRecord | TreatmentRecord) => void;
  onSubmitBirth?: (birthData: { birthDate: string; notes?: string }, offspring: OffspringInput[], fatherId?: string) => void;
}

function getDateInput() {
  return new Date().toISOString().split('T')[0];
}

export function RecordDialog({
  open,
  onOpenChange,
  type,
  animal,
  allAnimals,
  onSubmit,
  onSubmitBirth,
}: RecordDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [offspringRows, setOffspringRows] = useState<OffspringInput[]>([{ animalId: '', sex: 'female' as AnimalSex }]);

  const lastMating = animal.matingHistory[animal.matingHistory.length - 1];
  const defaultFatherId = lastMating?.mateId;

  useEffect(() => {
    if (open) {
      setFormData({});
      setOffspringRows([{ animalId: '', sex: 'female' }]);
    }
  }, [open, type]);

  const mates = allAnimals.filter((a) => a.id !== animal.id);
  const males = mates.filter((a) => a.sex === 'male');
  const females = mates.filter((a) => a.sex === 'female');

  const handleSubmit = () => {
    if (type === 'birth' && onSubmitBirth) {
      const fatherId = (formData.fatherId as string) || defaultFatherId;
      const validOffspring = offspringRows.filter((o) => o.animalId.trim());
      if (validOffspring.length === 0) return;
      onSubmitBirth(
        {
          birthDate: (formData.birthDate as string) || getDateInput(),
          notes: formData.notes as string | undefined,
        },
        validOffspring,
        fatherId || undefined
      );
      onOpenChange(false);
      return;
    }

    const base = { id: generateId(), isLocked: false, animalId: animal.id };

    switch (type) {
      case 'mating':
        onSubmit({
          ...base,
          mateId: formData.mateId as string,
          date: (formData.date as string) || getDateInput(),
          notes: formData.notes as string | undefined,
        } as MatingRecord);
        break;
      case 'pregnancy':
        onSubmit({
          ...base,
          startDate: (formData.startDate as string) || getDateInput(),
          status: (formData.status as PregnancyStatus) || 'pregnant',
          expectedDeliveryDate: formData.expectedDeliveryDate as string | undefined,
          actualDeliveryDate: formData.actualDeliveryDate as string | undefined,
          notes: formData.notes as string | undefined,
        } as PregnancyRecord);
        break;
      case 'death':
        onSubmit({
          ...base,
          deathDate: (formData.deathDate as string) || getDateInput(),
          cause: formData.cause as string | undefined,
          notes: formData.notes as string | undefined,
        } as DeathRecord);
        break;
      case 'sale':
        onSubmit({
          ...base,
          saleDate: (formData.saleDate as string) || getDateInput(),
          price: formData.price ? parseFloat(String(formData.price)) : undefined,
          buyer: formData.buyer as string | undefined,
          notes: formData.notes as string | undefined,
        } as SaleRecord);
        break;
      case 'treatment':
        onSubmit({
          ...base,
          date: (formData.date as string) || getDateInput(),
          treatment: formData.treatment as string | undefined,
          veterinarian: formData.veterinarian as string | undefined,
          cost: formData.cost ? parseFloat(String(formData.cost)) : undefined,
          notes: formData.notes as string | undefined,
        } as TreatmentRecord);
        break;
    }
    onOpenChange(false);
  };

  const titles: Record<RecordDialogType, string> = {
    mating: 'Add Mating Record',
    pregnancy: 'Add Pregnancy Record',
    birth: 'Record Birth',
    death: 'Add Death Record',
    sale: 'Add Sale Record',
    treatment: 'Add Treatment Record',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{titles[type]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {type === 'mating' && (
            <>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={(formData.date as string) || getDateInput()} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Mate</Label>
                <Select value={(formData.mateId as string) || ''} onValueChange={(v) => setFormData({ ...formData, mateId: v })}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select mate" /></SelectTrigger>
                  <SelectContent>
                    {(animal.sex === 'female' ? males : females).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.animalId} ({a.sex})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {type === 'pregnancy' && (
            <>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={(formData.startDate as string) || getDateInput()} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={(formData.status as string) || 'pregnant'} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_pregnant">Not Pregnant</SelectItem>
                    <SelectItem value="pregnant">Pregnant</SelectItem>
                    <SelectItem value="calved">Calved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input type="date" value={(formData.expectedDeliveryDate as string) || ''} onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })} className="bg-background" />
              </div>
            </>
          )}

          {type === 'birth' && (
            <>
              <div className="space-y-2">
                <Label>Birth Date</Label>
                <Input type="date" value={(formData.birthDate as string) || getDateInput()} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Sire (Father)</Label>
                <Select value={(formData.fatherId as string) || defaultFatherId || ''} onValueChange={(v) => setFormData({ ...formData, fatherId: v })}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select sire" /></SelectTrigger>
                  <SelectContent>
                    {males.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Offspring</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOffspringRows([...offspringRows, { animalId: '', sex: 'female' }])}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {offspringRows.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Tag ID</Label>
                      <Input value={row.animalId} onChange={(e) => {
                        const next = [...offspringRows];
                        next[idx] = { ...next[idx], animalId: e.target.value };
                        setOffspringRows(next);
                      }} placeholder="Calf-001" className="bg-background" />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Sex</Label>
                      <Select value={row.sex} onValueChange={(v) => {
                        const next = [...offspringRows];
                        next[idx] = { ...next[idx], sex: v as AnimalSex };
                        setOffspringRows(next);
                      }}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {offspringRows.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setOffspringRows(offspringRows.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Offspring animals will be created and linked automatically.</p>
              </div>
            </>
          )}

          {type === 'death' && (
            <>
              <div className="space-y-2">
                <Label>Death Date</Label>
                <Input type="date" value={(formData.deathDate as string) || getDateInput()} onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Cause</Label>
                <Input value={(formData.cause as string) || ''} onChange={(e) => setFormData({ ...formData, cause: e.target.value })} className="bg-background" />
              </div>
            </>
          )}

          {type === 'sale' && (
            <>
              <div className="space-y-2">
                <Label>Sale Date</Label>
                <Input type="date" value={(formData.saleDate as string) || getDateInput()} onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Sale Price</Label>
                <Input type="number" value={(formData.price as string) || ''} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Buyer</Label>
                <Input value={(formData.buyer as string) || ''} onChange={(e) => setFormData({ ...formData, buyer: e.target.value })} className="bg-background" />
              </div>
            </>
          )}

          {type === 'treatment' && (
            <>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={(formData.date as string) || getDateInput()} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Treatment</Label>
                <Input value={(formData.treatment as string) || ''} onChange={(e) => setFormData({ ...formData, treatment: e.target.value })} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Cost</Label>
                <Input type="number" value={(formData.cost as string) || ''} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="0.00" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Veterinarian</Label>
                <Input value={(formData.veterinarian as string) || ''} onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })} className="bg-background" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={(formData.notes as string) || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-background" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="hero" onClick={handleSubmit}>Save Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
