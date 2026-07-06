import { BreedingFinancialSummary, formatCurrency } from '@/lib/breedingFinance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Users, Baby, Heart, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreedingFinancialSummaryProps {
  summary: BreedingFinancialSummary;
}

export function BreedingFinancialSummaryPanel({ summary }: BreedingFinancialSummaryProps) {
  const isProfitable = summary.netProfit >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Herd
            </div>
            <div className="text-2xl font-semibold">{summary.activeCount}</div>
            <div className="text-xs text-muted-foreground">{summary.animalCount} total</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Heart className="w-3.5 h-3.5" /> Pregnant
            </div>
            <div className="text-2xl font-semibold">{summary.pregnantCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Baby className="w-3.5 h-3.5" /> Sold
            </div>
            <div className="text-2xl font-semibold">{summary.soldCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Revenue
            </div>
            <div className="text-2xl font-semibold">{formatCurrency(summary.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif text-primary">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capital Investment</span>
            <span>{formatCurrency(summary.capitalInvestment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Operational Costs</span>
            <span>{formatCurrency(summary.operationalCosts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Treatment Costs</span>
            <span>{formatCurrency(summary.treatmentCosts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sales Revenue</span>
            <span className="text-green-600">{formatCurrency(summary.totalRevenue)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span className="flex items-center gap-1">
              {isProfitable ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              Net Profit
            </span>
            <span className={cn(isProfitable ? 'text-green-600' : 'text-destructive')}>
              {formatCurrency(summary.netProfit)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
