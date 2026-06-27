import {
  BreedingProjectDetails,
  FarmAnimal,
  getMonthFromDate,
  MonthlyAggregation,
} from './db';

export interface BreedingFinancialSummary {
  projectId: string;
  capitalInvestment: number;
  operationalCosts: number;
  treatmentCosts: number;
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  animalCount: number;
  activeCount: number;
  soldCount: number;
  deceasedCount: number;
  pregnantCount: number;
}

export interface AnimalFinancialSummary {
  animalInternalId: string;
  animalTag: string;
  totalRevenue: number;
  totalCosts: number;
  netValue: number;
}

export function getAnimalFinancialSummary(animal: FarmAnimal): AnimalFinancialSummary {
  const totalRevenue = animal.saleRecords.reduce((sum, r) => sum + (r.price || 0), 0);
  const treatmentCosts = animal.treatmentHistory.reduce((sum, r) => sum + (r.cost || 0), 0);
  const totalCosts = treatmentCosts + (animal.acquisitionCost || 0);
  return {
    animalInternalId: animal.id,
    animalTag: animal.animalId,
    totalRevenue,
    totalCosts,
    netValue: totalRevenue - totalCosts,
  };
}

export function calculateBreedingFinancialSummary(
  projectId: string,
  details: BreedingProjectDetails,
  animals: FarmAnimal[]
): BreedingFinancialSummary {
  const capitalInvestment = details.capitalInvestment || 0;
  const projectOperationalCosts =
    (details.totalCosts || 0) +
    (details.operationalCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0);

  let treatmentCosts = 0;
  let totalRevenue = 0;

  for (const animal of animals) {
    treatmentCosts += animal.treatmentHistory.reduce((sum, r) => sum + (r.cost || 0), 0);
    totalRevenue += animal.saleRecords.reduce((sum, r) => sum + (r.price || 0), 0);
  }

  const operationalCosts = projectOperationalCosts + treatmentCosts;
  const grossProfit = totalRevenue;
  const netProfit = totalRevenue - operationalCosts - capitalInvestment;

  const activeCount = animals.filter((a) => a.currentStatus === 'active').length;
  const soldCount = animals.filter((a) => a.currentStatus === 'sold').length;
  const deceasedCount = animals.filter(
    (a) => a.currentStatus === 'deceased' || a.healthStatus === 'deceased'
  ).length;
  const pregnantCount = animals.filter((a) =>
    a.pregnancyHistory.some((p) => p.status === 'pregnant')
  ).length;

  return {
    projectId,
    capitalInvestment,
    operationalCosts,
    treatmentCosts,
    totalRevenue,
    grossProfit,
    netProfit,
    animalCount: animals.length,
    activeCount,
    soldCount,
    deceasedCount,
    pregnantCount,
  };
}

export function getBreedingMonthlyAggregation(
  projectId: string,
  details: BreedingProjectDetails,
  animals: FarmAnimal[]
): MonthlyAggregation[] {
  const monthlyData: Record<string, MonthlyAggregation> = {};

  const ensureMonth = (month: string) => {
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        projectId,
        totalInputCost: 0,
        totalProduceAmount: 0,
        totalRevenue: 0,
        grossProfit: 0,
        netProfit: 0,
        recordCount: 0,
      };
    }
    return monthlyData[month];
  };

  if (details.capitalInvestment && details.capitalInvestment > 0) {
    const month = details.breedingSeasonStart
      ? getMonthFromDate(details.breedingSeasonStart)
      : getMonthFromDate(new Date().toISOString().split('T')[0]);
    ensureMonth(month).totalInputCost += details.capitalInvestment;
  }

  if (details.totalCosts && details.totalCosts > 0) {
    const month = details.breedingSeasonStart
      ? getMonthFromDate(details.breedingSeasonStart)
      : getMonthFromDate(new Date().toISOString().split('T')[0]);
    ensureMonth(month).totalInputCost += details.totalCosts;
  }

  for (const cost of details.operationalCosts || []) {
    if (cost.amount <= 0) continue;
    const month = cost.date
      ? getMonthFromDate(cost.date)
      : getMonthFromDate(new Date().toISOString().split('T')[0]);
    ensureMonth(month).totalInputCost += cost.amount;
  }

  for (const animal of animals) {
    for (const sale of animal.saleRecords) {
      const month = getMonthFromDate(sale.saleDate);
      const data = ensureMonth(month);
      data.totalRevenue += sale.price || 0;
      data.recordCount += 1;
    }
    for (const treatment of animal.treatmentHistory) {
      if (!treatment.cost) continue;
      const month = getMonthFromDate(treatment.date);
      const data = ensureMonth(month);
      data.totalInputCost += treatment.cost;
      data.recordCount += 1;
    }
  }

  for (const month of Object.keys(monthlyData)) {
    const data = monthlyData[month];
    data.grossProfit = data.totalRevenue;
    data.netProfit = data.totalRevenue - data.totalInputCost;
  }

  return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
