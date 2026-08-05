import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BreedingProjectDetails as BreedingDetailsType, FarmProject, updateProject } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface BreedingProjectDetailsProps {
  project: FarmProject;
  onUpdate: () => void;
}

export function BreedingProjectDetails({ project, onUpdate }: BreedingProjectDetailsProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [details, setDetails] = useState<BreedingDetailsType>(
    project.details as BreedingDetailsType
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedProject = {
        ...project,
        details,
      };
      await updateProject(updatedProject);
      setIsEditing(false);
      toast({ title: 'Project details saved successfully' });
      onUpdate();
    } catch (error) {
      toast({ title: 'Failed to save project details', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-primary font-serif">Breeding Project Details</CardTitle>
          {!project.isCompleted && (
            <Button
              variant={isEditing ? "hero" : "default"}
              size="sm"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isSaving}
            >
              {isEditing ? <><Save className="w-4 h-4 mr-2" /> Save</> : 'Edit'}
            </Button>
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
                value={details.herdSize || ''}
                onChange={(e) => setDetails({ ...details, herdSize: Number(e.target.value) || undefined })}
                placeholder="0"
                className="bg-background"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{details.herdSize || 'Not set'}</p>
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
                value={details.capitalInvestment || ''}
                onChange={(e) => setDetails({ ...details, capitalInvestment: Number(e.target.value) || undefined })}
                placeholder="0"
                className="bg-background"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{details.capitalInvestment || 'Not set'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCosts">Total Costs</Label>
            {isEditing ? (
              <Input
                id="totalCosts"
                type="number"
                value={details.totalCosts || ''}
                onChange={(e) => setDetails({ ...details, totalCosts: Number(e.target.value) || undefined })}
                placeholder="0"
                className="bg-background"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{details.totalCosts || 'Not set'}</p>
            )}
          </div>
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
              value={details.estimatedRevenue || ''}
              onChange={(e) => setDetails({ ...details, estimatedRevenue: Number(e.target.value) || undefined })}
              placeholder="0"
              className="bg-background"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{details.estimatedRevenue || 'Not set'}</p>
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
