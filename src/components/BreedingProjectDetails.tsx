import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BreedingProjectDetails as BreedingDetailsType,
  BreedingCostItem,
  FarmProject,
  generateId,
  updateProject,
} from '@/lib/db';
import { formatCurrency } from '@/lib/breedingFinance';
import { useToast } from '@/hooks/use-toast';
import { friendlyError } from '@/lib/errorMessages';
import { Save, Plus, Trash2 } from 'lucide-react';

interface BreedingProjectDetailsProps {
  project: FarmProject;
  onUpdate: () => void;
}

/** Keeps 0 as a real value; only an empty field becomes undefined. */
const toNumber = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const numberValue = (value: number | undefined) => (value === undefined ? '' : String(value));

export function BreedingProjectDetails({ project, onUpdate }: BreedingProjectDetailsProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [details, setDetails] = useState<BreedingDetailsType>(
    (project.details as BreedingDetailsType) || {}
  );
  const [isSaving, setIsSaving] = useState(false);

  // Keep the form in sync when the project changes elsewhere (sync, import, reload).
  useEffect(() => {
    if (!isEditing) {
      setDetails((project.details as BreedingDetailsType) || {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, project.details, project.updatedAt]);

  const readOnly = project.isCompleted;
  const costs: BreedingCostItem[] = details.operationalCosts || [];

  const setCosts = (next: BreedingCostItem[]) => setDetails({ ...details, operationalCosts: next });

  const handleSave = async () => {
    if (readOnly) return;
    setIsSaving(true);
    try {
      await updateProject({ ...project, details });
      setIsEditing(false);
      toast({ title: 'Project details saved' });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Could not save project details',
        description: friendlyError(error),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDetails((project.details as BreedingDetailsType) || {});
    setIsEditing(false);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex justify-between items-center gap-2">
          <CardTitle className="text-primary font-serif">Breeding Project Details</CardTitle>
          {!readOnly && (
            <div className="flex gap-2">
              {isEditing && (
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              )}
              <Button
                variant={isEditing ? 'hero' : 'default'}
                size="sm"
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={isSaving}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving…' : 'Save'}
                  </>
                ) : (
                  'Edit'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="breed">Breed</Label>
            {isEditing ? (
              <Input
                id="breed"
                value={details.breed || ''}
                onChange={(e) => setDetails({ ...details, breed: e.target.value })}
                placeholder="e.g., Holstein, Angus"
                className="bg-background"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{details.breed || 'Not set'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="herdSize">Herd Size</Label>
            {isEditing ? (
              <Input
                id="herdSize"
                type="number"
                value={numberValue(details.herdSize)}
                onChange={(e) => setDetails({ ...details, herdSize: toNumber(e.target.value) })}
                placeholder="0"
                className="bg-background"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{numberValue(details.herdSize) || 'Not set'}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seasonStart">Breeding Season Start</Label>
            {isEditing ? (
              <Input
                id="seasonStart"
                type="date"
                value={details.breedingSeasonStart || ''}
                onChange={(e) => setDetails({ ...details, breedingSeasonStart: e.target.value || undefined })}
                className="bg-background"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{details.breedingSeasonStart || 'Not set'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seasonEnd">Breeding Season End</Label>
            {isEditing ? (
              <Input
                id="seasonEnd"
                type="date"
                value={details.breedingSeasonEnd || ''}
                onChange={(e) => setDetails({ ...details, breedingSeasonEnd: e.target.value || undefined })}
                className="bg-background"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{details.breedingSeasonEnd || 'Not set'}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="breedingGoal">Breeding Goal</Label>
          {isEditing ? (
            <Textarea
              id="breedingGoal"
              value={details.breedingGoal || ''}
              onChange={(e) => setDetails({ ...details, breedingGoal: e.target.value })}
              placeholder="e.g., Milk production, Beef production, Genetic improvement"
              className="bg-background"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{details.breedingGoal || 'Not set'}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="capitalInvestment">Capital Investment</Label>
            {isEditing ? (
              <Input
                id="capitalInvestment"
                type="number"
                value={numberValue(details.capitalInvestment)}
                onChange={(e) => setDetails({ ...details, capitalInvestment: toNumber(e.target.value) })}
                placeholder="0"
                className="bg-background"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {details.capitalInvestment === undefined ? 'Not set' : formatCurrency(details.capitalInvestment)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCosts">Total Costs</Label>
            {isEditing ? (
              <Input
                id="totalCosts"
                type="number"
                value={numberValue(details.totalCosts)}
                onChange={(e) => setDetails({ ...details, totalCosts: toNumber(e.target.value) })}
                placeholder="0"
                className="bg-background"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {details.totalCosts === undefined ? 'Not set' : formatCurrency(details.totalCosts)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Operational Costs</Label>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCosts([
                    ...costs,
                    {
                      id: generateId(),
                      label: '',
                      amount: 0,
                      date: new Date().toISOString().split('T')[0],
                      category: 'feed',
                    } as BreedingCostItem,
                  ])
                }
              >
                <Plus className="w-3 h-3 mr-1" /> Add cost
              </Button>
            )}
          </div>
          {costs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No operational costs recorded</p>
          ) : (
            <div className="space-y-2">
              {costs.map((cost, idx) =>
                isEditing ? (
                  <div key={cost.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_150px_130px_auto] gap-2 items-end">
                    <Input
                      value={cost.label || ''}
                      placeholder="Description"
                      className="bg-background"
                      onChange={(e) => {
                        const next = [...costs];
                        next[idx] = { ...cost, label: e.target.value };
                        setCosts(next);
                      }}
                    />
                    <Input
                      type="number"
                      value={numberValue(cost.amount)}
                      placeholder="0"
                      className="bg-background"
                      onChange={(e) => {
                        const next = [...costs];
                        next[idx] = { ...cost, amount: toNumber(e.target.value) ?? 0 };
                        setCosts(next);
                      }}
                    />
                    <Input
                      type="date"
                      value={cost.date || ''}
                      className="bg-background"
                      onChange={(e) => {
                        const next = [...costs];
                        next[idx] = { ...cost, date: e.target.value || undefined };
                        setCosts(next);
                      }}
                    />
                    <Select
                      value={cost.category || 'other'}
                      onValueChange={(v) => {
                        const next = [...costs];
                        next[idx] = { ...cost, category: v as BreedingCostItem['category'] };
                        setCosts(next);
                      }}
                    >
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feed">Feed</SelectItem>
                        <SelectItem value="veterinary">Veterinary</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCosts(costs.filter((c) => c.id !== cost.id))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div key={cost.id} className="flex justify-between text-sm border-b pb-1">
                    <span>
                      {cost.label || 'Cost'}{' '}
                      <span className="text-muted-foreground">
                        ({cost.category}{cost.date ? ` · ${cost.date}` : ''})
                      </span>
                    </span>
                    <span>{formatCurrency(cost.amount || 0)}</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="requiredInputs">Required Inputs</Label>
          {isEditing ? (
            <Textarea
              id="requiredInputs"
              value={details.requiredInputs || ''}
              onChange={(e) => setDetails({ ...details, requiredInputs: e.target.value })}
              placeholder="e.g., Feed, Veterinary supplies, Equipment"
              className="bg-background"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{details.requiredInputs || 'Not set'}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="operationalChallenges">Operational Challenges</Label>
          {isEditing ? (
            <Textarea
              id="operationalChallenges"
              value={details.operationalChallenges || ''}
              onChange={(e) => setDetails({ ...details, operationalChallenges: e.target.value })}
              placeholder="Describe any operational challenges"
              className="bg-background"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{details.operationalChallenges || 'Not set'}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedRevenue">Estimated Revenue</Label>
          {isEditing ? (
            <Input
              id="estimatedRevenue"
              type="number"
              value={numberValue(details.estimatedRevenue)}
              onChange={(e) => setDetails({ ...details, estimatedRevenue: toNumber(e.target.value) })}
              placeholder="0"
              className="bg-background"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {details.estimatedRevenue === undefined ? 'Not set' : formatCurrency(details.estimatedRevenue)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          {isEditing ? (
            <Textarea
              id="notes"
              value={details.notes || ''}
              onChange={(e) => setDetails({ ...details, notes: e.target.value })}
              placeholder="Additional notes"
              className="bg-background"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{details.notes || 'Not set'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
