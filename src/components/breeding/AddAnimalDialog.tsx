import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FarmAnimal, AnimalSex, HealthStatus } from '@/lib/db';

interface AddAnimalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<FarmAnimal, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'isLocked' | 'lockedAt' | 'matingHistory' | 'pregnancyHistory' | 'birthRecords' | 'deathRecords' | 'saleRecords' | 'treatmentHistory'>) => void;
  existingAnimals: FarmAnimal[];
  defaultBreed?: string;
}

export function AddAnimalDialog({ open, onOpenChange, onSubmit, existingAnimals, defaultBreed }: AddAnimalDialogProps) {
  const [animalId, setAnimalId] = useState('');
  const [sex, setSex] = useState<AnimalSex>('female');
  const [age, setAge] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [breed, setBreed] = useState(defaultBreed || '');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('healthy');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [notes, setNotes] = useState('');
  const [motherId, setMotherId] = useState<string | undefined>();
  const [fatherId, setFatherId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAnimalId('');
      setSex('female');
      setAge('');
      setBirthDate('');
      setBreed(defaultBreed || '');
      setHealthStatus('healthy');
      setAcquisitionCost('');
      setNotes('');
      setMotherId(undefined);
      setFatherId(undefined);
      setError(null);
    }
  }, [open, defaultBreed]);

  const handleSubmit = () => {
    if (!animalId.trim()) return;
    const taken = existingAnimals.some(
      (a) => a.animalId.trim().toLowerCase() === animalId.trim().toLowerCase()
    );
    if (taken) {
      setError('An animal with this ID already exists.');
      return;
    }
    setError(null);
    onSubmit({
      animalId: animalId.trim(),
      sex,
      age: age || undefined,
      birthDate: birthDate || undefined,
      breed: breed || undefined,
      healthStatus,
      currentStatus: 'active',
      acquisitionCost: acquisitionCost.trim() === '' ? undefined : Number(acquisitionCost),
      notes: notes.trim() || undefined,
      motherId,
      fatherId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Add Animal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="animalId">Animal ID *</Label>
            <Input id="animalId" value={animalId} onChange={(e) => setAnimalId(e.target.value)} placeholder="Unique tag, e.g. Cow-001" className="bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sex</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as AnimalSex)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select value={healthStatus} onValueChange={(v) => setHealthStatus(v as HealthStatus)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="under_treatment">Under Treatment</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Angus" className="bg-background" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acqCost">Purchase Cost</Label>
              <Input id="acqCost" type="number" min="0" step="0.01" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} placeholder="0.00" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="animalNotes">Notes</Label>
              <Input id="animalNotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="bg-background" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dam (Mother)</Label>
              <Select value={motherId || '__none__'} onValueChange={(v) => setMotherId(v === '__none__' ? undefined : v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {existingAnimals.filter((a) => a.sex === 'female').map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sire (Father)</Label>
              <Select value={fatherId || '__none__'} onValueChange={(v) => setFatherId(v === '__none__' ? undefined : v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {existingAnimals.filter((a) => a.sex === 'male').map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="hero" onClick={handleSubmit} disabled={!animalId.trim()}>Add Animal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
