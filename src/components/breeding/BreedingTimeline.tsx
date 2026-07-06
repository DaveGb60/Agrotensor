import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FarmAnimal, BreedingProjectDetails, FarmProject } from '@/lib/db';
import { format, parse } from 'date-fns';
import { formatCurrency } from '@/lib/breedingFinance';
import { Heart, Baby, Stethoscope, Skull, DollarSign, PawPrint, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreedingTimelineProps {
  project: FarmProject;
  animals: FarmAnimal[];
  details: BreedingProjectDetails;
}

interface TimelineEvent {
  id: string;
  date: string;
  type: 'mating' | 'pregnancy' | 'birth' | 'treatment' | 'sale' | 'death';
  description: string;
  animalId: string;
  amount?: number;
}

const eventConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  mating: { icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200', label: 'Mating' },
  pregnancy: { icon: Baby, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200', label: 'Pregnancy' },
  birth: { icon: PawPrint, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', label: 'Birth' },
  treatment: { icon: Stethoscope, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200', label: 'Treatment' },
  sale: { icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', label: 'Sale' },
  death: { icon: Skull, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', label: 'Death' },
};

export function BreedingTimeline({ project, animals, details }: BreedingTimelineProps) {
  const [filter, setFilter] = useState<'all' | string>('all');

  const events: TimelineEvent[] = useMemo(() => {
    const evts: TimelineEvent[] = [];

    for (const a of animals) {
      for (const m of a.matingHistory) {
        const mate = animals.find((am) => am.id === m.mateId);
        evts.push({
          id: `${m.id}`,
          date: m.date,
          type: 'mating',
          description: `Mated with ${mate ? mate.animalId : m.mateId}`,
          animalId: a.animalId,
        });
      }
      for (const p of a.pregnancyHistory) {
        evts.push({
          id: p.id,
          date: p.startDate,
          type: 'pregnancy',
          description: `Status: ${p.status.replace('_', ' ')}${p.expectedDeliveryDate ? ` | Expected: ${format(parse(p.expectedDeliveryDate, 'yyyy-MM-dd', new Date()), 'MMM d')}` : ''}`,
          animalId: a.animalId,
        });
      }
      for (const b of a.birthRecords) {
        evts.push({
          id: b.id,
          date: b.birthDate,
          type: 'birth',
          description: `${b.offspringIds.length} offspring born`,
          animalId: a.animalId,
        });
      }
      for (const t of a.treatmentHistory) {
        evts.push({
          id: t.id,
          date: t.date,
          type: 'treatment',
          description: t.treatment || 'Treatment recorded',
          animalId: a.animalId,
          amount: t.cost,
        });
      }
      for (const s of a.saleRecords) {
        evts.push({
          id: s.id,
          date: s.saleDate,
          type: 'sale',
          description: s.buyer || 'Sold',
          animalId: a.animalId,
          amount: s.price,
        });
      }
      for (const d of a.deathRecords) {
        evts.push({
          id: d.id,
          date: d.deathDate,
          type: 'death',
          description: d.cause || 'Deceased',
          animalId: a.animalId,
        });
      }
    }

    return evts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [animals]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((e) => e.type === filter);
  }, [events, filter]);

  const eventTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.type));
    return Array.from(types);
  }, [events]);

  if (animals.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CalendarIcon className="h-5 w-5" />
            Breeding Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>No animals added yet.</p>
          <p className="text-sm">Add animals to see their breeding timeline.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-primary">
            <CalendarIcon className="h-5 w-5" />
            Breeding Timeline
          </CardTitle>
          {eventTypes.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              <Button
                variant={filter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              {eventTypes.map((type) => {
                const config = eventConfig[type];
                return (
                  <Button
                    key={type}
                    variant={filter === type ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn("h-7 px-2 text-xs gap-1", filter === type && config.bgColor)}
                    onClick={() => setFilter(type)}
                  >
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">No events to display for the selected filter.</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const config = eventConfig[event.type];
                const Icon = config.icon;

                return (
                  <div key={event.id} className="relative flex gap-3">
                    {/* Timeline dot */}
                    <div className={cn("relative z-10 flex h-6 w-6 items-center justify-center rounded-full border shrink-0", config.bgColor)}>
                      <Icon className={cn("h-3 w-3", config.color)} />
                    </div>

                    {/* Event card */}
                    <div className={cn("flex-1 rounded-lg border p-3", config.bgColor)}>
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs border-0", config.color)}>
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {event.animalId}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(parse(event.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{event.description}</p>
                      {event.amount !== undefined && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.amount ? formatCurrency(event.amount) : 'No amount'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
