import { useEffect, useState } from 'react';
import { FarmProject, BreedingProjectDetails, getAnimalsByProject } from '@/lib/db';
import { getBreedingMonthlyAggregation } from '@/lib/breedingFinance';
import { MonthlySummary } from '@/components/MonthlySummary';

interface BreedingMonthlySummaryProps {
  project: FarmProject;
  refreshKey?: number;
}

export function BreedingMonthlySummary({ project, refreshKey = 0 }: BreedingMonthlySummaryProps) {
  const [aggregations, setAggregations] = useState<Awaited<ReturnType<typeof getBreedingMonthlyAggregation>>>([]);

  useEffect(() => {
    const load = async () => {
      const animals = await getAnimalsByProject(project.id);
      const aggs = getBreedingMonthlyAggregation(
        project.id,
        project.details as BreedingProjectDetails,
        animals
      );
      setAggregations(aggs);
    };
    load();
  }, [project.id, project.details, refreshKey]);

  if (aggregations.length === 0) return null;

  return (
    <MonthlySummary
      aggregations={aggregations}
      projectDetails={{
        capital: (project.details as BreedingProjectDetails).capitalInvestment || 0,
        totalItemCount: 0,
        costs: (project.details as BreedingProjectDetails).totalCosts || 0,
        estimatedRevenue: (project.details as BreedingProjectDetails).estimatedRevenue || 0,
        inputs: [],
        challengesSummary: '',
        customDetails: {},
      }}
      isCompleted={project.isCompleted}
    />
  );
}
