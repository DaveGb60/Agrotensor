import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FarmAnimal } from '@/lib/db';
import { PawPrint, Heart, Check } from 'lucide-react';

interface PostCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: FarmAnimal;
  allAnimals: FarmAnimal[];
  onComplete: (updates: Partial<FarmAnimal>, nextAction: 'mating' | 'pregnancy' | 'done') => void;
}

export function PostCreationWizard({
  open,
  onOpenChange,
  animal,
  allAnimals,
  onComplete,
}: PostCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [motherId, setMotherId] = useState<string | undefined>(animal.motherId);
  const [fatherId, setFatherId] = useState<string | undefined>(animal.fatherId);

  const females = allAnimals.filter((a) => a.sex === 'female' && a.id !== animal.id);
  const males = allAnimals.filter((a) => a.sex === 'male' && a.id !== animal.id);

  const handleFinish = (nextAction: 'mating' | 'pregnancy' | 'done') => {
    onComplete({ motherId, fatherId }, nextAction);
    setStep(1);
    onOpenChange(false);
  };

  const handleSkip = () => {
    handleFinish('done');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {step === 1 ? 'Animal Created!' : 'What\'s Next?'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{animal.animalId}</strong> was added successfully. Link parents to enable pedigree tracking.
            </p>
            <div className="flex gap-1 mb-2">
              <div className="h-1 flex-1 rounded bg-primary" />
              <div className="h-1 flex-1 rounded bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dam (Mother)</Label>
                <Select value={motherId || ''} onValueChange={(v) => setMotherId(v || undefined)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {females.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sire (Father)</Label>
                <Select value={fatherId || ''} onValueChange={(v) => setFatherId(v || undefined)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {males.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button variant="ghost" onClick={handleSkip}>Skip for now</Button>
              <Button variant="hero" onClick={() => setStep(2)}>Continue</Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex gap-1 mb-2">
              <div className="h-1 flex-1 rounded bg-primary" />
              <div className="h-1 flex-1 rounded bg-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Choose your next action for this animal.</p>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start h-auto py-3" onClick={() => handleFinish('mating')}>
                <PawPrint className="w-4 h-4 mr-2 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Log Mating</div>
                  <div className="text-xs text-muted-foreground">Record a breeding event</div>
                </div>
              </Button>
              {animal.sex === 'female' && (
                <Button variant="outline" className="justify-start h-auto py-3" onClick={() => handleFinish('pregnancy')}>
                  <Heart className="w-4 h-4 mr-2 shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Track Pregnancy</div>
                    <div className="text-xs text-muted-foreground">Set pregnancy status and due date</div>
                  </div>
                </Button>
              )}
              <Button variant="secondary" className="justify-start h-auto py-3" onClick={() => handleFinish('done')}>
                <Check className="w-4 h-4 mr-2 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Done for now</div>
                  <div className="text-xs text-muted-foreground">Open animal details</div>
                </div>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
