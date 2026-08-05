import { useEffect, useState } from 'react';
import { BreedingProjectDetails, FarmAnimal, FarmProject, getAnimalsByProject } from '@/lib/db';
import { calculateBreedingFinancialSummary } from '@/lib/breedingFinance';
import { BreedingFinancialSummaryPanel } from './BreedingFinancialSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

interface BreedingDashboardProps {
  project: FarmProject;
}

function SetupChecklist({ details, animals }: { details: BreedingProjectDetails; animals: FarmAnimal[] }) {
  const hasGoal = !!details.breedingGoal?.trim();
  const hasAnimals = animals.length > 0;
  const hasParents = animals.some((a) => a.motherId || a.fatherId);
  const hasBirth = animals.some((a) => a.birthRecords.length > 0);
  const hasSales = animals.some((a) => a.saleRecords.length > 0);

  const items = [
    { label: 'Set breeding goal', done: hasGoal },
    { label: 'Add first animal', done: hasAnimals },
    { label: 'Link parent relationships', done: hasParents },
    { label: 'Record a birth', done: hasBirth },
    { label: 'Log a sale', done: hasSales },
  ];

  const completed = items.filter((i) => i.done).length;
  if (completed === items.length) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Setup Progress — {completed} of {items.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BreedingDashboard({ project, refreshKey = 0 }: BreedingDashboardProps & { refreshKey?: number }) {
  const [animals, setAnimals] = useState<FarmAnimal[]>([]);

  useEffect(() => {
    getAnimalsByProject(project.id).then(setAnimals);
  }, [project.id, refreshKey]);

  const details = project.details as BreedingProjectDetails;
  const summary = calculateBreedingFinancialSummary(project.id, details, animals);

  return (
    <div className="space-y-4">
      <BreedingFinancialSummaryPanel summary={summary} />
      <SetupChecklist details={details} animals={animals} />
    </div>
  );
}
