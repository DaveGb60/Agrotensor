import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { FarmAnimal, FarmProject, BreedingProjectDetails } from '@/lib/db';
import { format, parse } from 'date-fns';
import { formatCurrency } from '@/lib/breedingFinance';
import { Heart, Baby, Stethoscope, DollarSign, PawPrint, Skull, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreedingCalendarProps {
  project: FarmProject;
  animals: FarmAnimal[];
  details: BreedingProjectDetails;
}

interface CalendarEvent {
  date: Date;
  type: 'mating' | 'pregnancy' | 'birth' | 'treatment' | 'sale' | 'death';
  description: string;
  animalId: string;
  amount?: number;
}

export function BreedingCalendar({ project, animals, details }: BreedingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const events: CalendarEvent[] = useMemo(() => {
    const evts: CalendarEvent[] = [];

    for (const a of animals) {
      for (const m of a.matingHistory) {
        const mate = animals.find((am) => am.id === m.mateId);
        evts.push({
          date: parse(m.date, 'yyyy-MM-dd', new Date()),
          type: 'mating',
          description: `Mated with ${mate ? mate.animalId : m.mateId}`,
          animalId: a.animalId,
        });
      }
      for (const p of a.pregnancyHistory) {
        if (p.expectedDeliveryDate) {
          evts.push({
            date: parse(p.expectedDeliveryDate, 'yyyy-MM-dd', new Date()),
            type: 'pregnancy',
            description: `Expected delivery for ${a.animalId}`,
            animalId: a.animalId,
          });
        }
        evts.push({
          date: parse(p.startDate, 'yyyy-MM-dd', new Date()),
          type: 'pregnancy',
          description: `Pregnancy started: ${p.status.replace('_', ' ')}`,
          animalId: a.animalId,
        });
      }
      for (const b of a.birthRecords) {
        evts.push({
          date: parse(b.birthDate, 'yyyy-MM-dd', new Date()),
          type: 'birth',
          description: `${b.offspringIds.length} offspring born`,
          animalId: a.animalId,
        });
      }
      for (const t of a.treatmentHistory) {
        evts.push({
          date: parse(t.date, 'yyyy-MM-dd', new Date()),
          type: 'treatment',
          description: t.treatment || 'Treatment',
          animalId: a.animalId,
          amount: t.cost,
        });
      }
      for (const s of a.saleRecords) {
        evts.push({
          date: parse(s.saleDate, 'yyyy-MM-dd', new Date()),
          type: 'sale',
          description: s.buyer || 'Sold',
          animalId: a.animalId,
          amount: s.price,
        });
      }
      for (const d of a.deathRecords) {
        evts.push({
          date: parse(d.deathDate, 'yyyy-MM-dd', new Date()),
          type: 'death',
          description: d.cause || 'Deceased',
          animalId: a.animalId,
        });
      }
    }

    return evts;
  }, [animals]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = format(e.date, 'yyyy-MM-dd');
      const existing = map.get(key) || [];
      existing.push(e);
      map.set(key, existing);
    }
    return map;
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate.get(key) || [];
  }, [selectedDate, eventsByDate]);

  const eventModifiers = useMemo(() => {
    const dates = Array.from(eventsByDate.keys()).map((key) => parse(key, 'yyyy-MM-dd', new Date()));
    return dates;
  }, [eventsByDate]);

  const eventModifiersClassNames = useMemo(() => ({
    event: 'relative',
  }), []);

  if (animals.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CalendarIcon className="h-5 w-5" />
            Breeding Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>No animals added yet.</p>
          <p className="text-sm">Add animals to see events on the calendar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <CalendarIcon className="h-5 w-5" />
          Breeding Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <div className="flex-1 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ event: eventModifiers }}
              modifiersClassNames={{
                event: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
              }}
              classNames={{
                ...Calendar,
                cell: "h-9 w-9 text-center text-sm p-0 relative",
                day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
              }}
            />
          </div>

          {/* Selected date events */}
          <div className="lg:w-72">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </h4>
            </div>

            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events on this date.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedEvents.map((event) => {
                  const eventConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
                    mating: { icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50' },
                    pregnancy: { icon: Baby, color: 'text-purple-600', bgColor: 'bg-purple-50' },
                    birth: { icon: PawPrint, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    treatment: { icon: Stethoscope, color: 'text-orange-600', bgColor: 'bg-orange-50' },
                    sale: { icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50' },
                    death: { icon: Skull, color: 'text-red-600', bgColor: 'bg-red-50' },
                  };
                  const config = eventConfig[event.type];
                  const Icon = config.icon;

                  return (
                    <div key={`${event.type}-${event.date.toISOString()}-${event.animalId}-${event.description}`} className={cn("rounded-lg border p-2.5", config.bgColor)}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={cn("h-3.5 w-3.5", config.color)} />
                        <Badge variant="outline" className={cn("text-xs border-0", config.color)}>
                          {event.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{event.animalId}</span>
                      </div>
                      <p className="text-xs">{event.description}</p>
                      {event.amount !== undefined && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.amount ? formatCurrency(event.amount) : 'No amount'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Legend</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-1.5"><Heart className="h-3 w-3 text-pink-600" /> Mating</div>
                <div className="flex items-center gap-1.5"><Baby className="h-3 w-3 text-purple-600" /> Pregnancy</div>
                <div className="flex items-center gap-1.5"><PawPrint className="h-3 w-3 text-blue-600" /> Birth</div>
                <div className="flex items-center gap-1.5"><Stethoscope className="h-3 w-3 text-orange-600" /> Treatment</div>
                <div className="flex items-center gap-1.5"><DollarSign className="h-3 w-3 text-green-600" /> Sale</div>
                <div className="flex items-center gap-1.5"><Skull className="h-3 w-3 text-red-600" /> Death</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
