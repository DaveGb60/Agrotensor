import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Edit, Trash2, Lock, Users, Cog, Activity, AlertCircle, Calendar,
  Heart, Stethoscope, Baby, Skull, DollarSign, PawPrint, CheckCircle2, Circle,
} from 'lucide-react';
import {
  FarmAnimal, AnimalSex, HealthStatus,
  MatingRecord, PregnancyRecord, BirthRecord, DeathRecord, SaleRecord, TreatmentRecord,
  OffspringInput,
} from '@/lib/db';
import { getAnimalFinancialSummary, formatCurrency } from '@/lib/breedingFinance';
import { PedigreeTree } from './PedigreeTree';
import { RecordDialog, RecordDialogType } from './RecordDialog';

interface AnimalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: FarmAnimal;
  allAnimals: FarmAnimal[];
  onEdit: (animal: FarmAnimal) => void;
  onDelete: (id: string) => void;
  onLock: (id: string) => void;
  onBirth: (birthData: { birthDate: string; notes?: string }, offspring: OffspringInput[], fatherId?: string) => Promise<void>;
  onSelectAnimal?: (animal: FarmAnimal) => void;
  initialRecordType?: RecordDialogType | null;
}

export function AnimalDetailDialog({
  open,
  onOpenChange,
  animal,
  allAnimals,
  onEdit,
  onDelete,
  onLock,
  onBirth,
  onSelectAnimal,
  initialRecordType,
}: AnimalDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnimal, setEditedAnimal] = useState(animal);
  const [activeTab, setActiveTab] = useState('details');
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordDialogType, setRecordDialogType] = useState<RecordDialogType | null>(null);

  useEffect(() => {
    setEditedAnimal(animal);
    setIsEditing(false);
  }, [animal]);

  useEffect(() => {
    if (open && initialRecordType) {
      setRecordDialogType(initialRecordType);
      setRecordDialogOpen(true);
      setActiveTab('history');
    }
  }, [open, initialRecordType]);

  const getTag = (id: string | undefined) => {
    if (!id) return '';
    return allAnimals.find((a) => a.id === id)?.animalId || id;
  };

  const financials = getAnimalFinancialSummary(editedAnimal);

  const checklist = [
    { label: 'Identity set', done: !!editedAnimal.animalId },
    { label: 'Parents linked', done: !!(editedAnimal.motherId || editedAnimal.fatherId) },
    { label: 'Mating logged', done: editedAnimal.matingHistory.length > 0 },
    { label: 'Pregnancy tracked', done: editedAnimal.pregnancyHistory.length > 0 },
    { label: 'Birth recorded', done: editedAnimal.birthRecords.length > 0 },
  ];

  const addRecord = (record: MatingRecord | PregnancyRecord | BirthRecord | DeathRecord | SaleRecord | TreatmentRecord) => {
    let updated = { ...editedAnimal };
    switch (recordDialogType) {
      case 'mating':
        updated.matingHistory = [...updated.matingHistory, record as MatingRecord];
        break;
      case 'pregnancy':
        updated.pregnancyHistory = [...updated.pregnancyHistory, record as PregnancyRecord];
        break;
      case 'death':
        updated.deathRecords = [...updated.deathRecords, record as DeathRecord];
        updated.healthStatus = 'deceased';
        updated.currentStatus = 'deceased';
        break;
      case 'sale':
        updated.saleRecords = [...updated.saleRecords, record as SaleRecord];
        updated.currentStatus = 'sold';
        break;
      case 'treatment':
        updated.treatmentHistory = [...updated.treatmentHistory, record as TreatmentRecord];
        break;
    }
    setEditedAnimal(updated);
    onEdit(updated);
  };

  const handleBirth = async (birthData: { birthDate: string; notes?: string }, offspring: OffspringInput[], fatherId?: string) => {
    await onBirth(birthData, offspring, fatherId);
  };

  const deleteRecord = (type: string, recordId: string) => {
    let updated = { ...editedAnimal };
    switch (type) {
      case 'mating': updated.matingHistory = updated.matingHistory.filter((r) => r.id !== recordId); break;
      case 'pregnancy': updated.pregnancyHistory = updated.pregnancyHistory.filter((r) => r.id !== recordId); break;
      case 'birth': updated.birthRecords = updated.birthRecords.filter((r) => r.id !== recordId); break;
      case 'death': updated.deathRecords = updated.deathRecords.filter((r) => r.id !== recordId); break;
      case 'sale': updated.saleRecords = updated.saleRecords.filter((r) => r.id !== recordId); break;
      case 'treatment': updated.treatmentHistory = updated.treatmentHistory.filter((r) => r.id !== recordId); break;
    }
    setEditedAnimal(updated);
    onEdit(updated);
  };

  const healthIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return <Heart className="w-4 h-4" />;
      case 'sick': return <AlertCircle className="w-4 h-4" />;
      case 'under_treatment': return <Stethoscope className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const openRecord = (type: RecordDialogType) => {
    setRecordDialogType(type);
    setRecordDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-start gap-4">
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              {healthIcon(editedAnimal.healthStatus)}
              {editedAnimal.animalId}
              {editedAnimal.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
            </DialogTitle>
            <div className="flex gap-2 shrink-0">
              {!editedAnimal.isLocked && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : <><Edit className="w-4 h-4 mr-2" /> Edit</>}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onLock(editedAnimal.id)}>
                    <Lock className="w-4 h-4 mr-2" /> Lock
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="lg:col-span-1 shadow-sm h-fit">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Next Steps</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    {item.done ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
                  </div>
                ))}
                {!editedAnimal.isLocked && editedAnimal.sex === 'female' && (
                  <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => openRecord('birth')}>
                    <Baby className="w-3 h-3 mr-1" /> Record Birth
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details"><Cog className="w-4 h-4 mr-1" /> Details</TabsTrigger>
                  <TabsTrigger value="history"><Activity className="w-4 h-4 mr-1" /> History</TabsTrigger>
                  <TabsTrigger value="pedigree"><Users className="w-4 h-4 mr-1" /> Pedigree</TabsTrigger>
                  <TabsTrigger value="financial"><DollarSign className="w-4 h-4 mr-1" /> Financial</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Animal ID</Label>
                      {isEditing ? (
                        <Input value={editedAnimal.animalId} onChange={(e) => setEditedAnimal({ ...editedAnimal, animalId: e.target.value })} className="bg-background" />
                      ) : <p className="text-sm">{editedAnimal.animalId}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      {isEditing ? (
                        <Select value={editedAnimal.sex} onValueChange={(v) => setEditedAnimal({ ...editedAnimal, sex: v as AnimalSex })}>
                          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : <Badge>{editedAnimal.sex}</Badge>}
                    </div>
                    <div className="space-y-2">
                      <Label>Birth Date</Label>
                      {isEditing ? (
                        <Input type="date" value={editedAnimal.birthDate || ''} onChange={(e) => setEditedAnimal({ ...editedAnimal, birthDate: e.target.value || undefined })} className="bg-background" />
                      ) : <p className="text-sm">{editedAnimal.birthDate || 'Not set'}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Breed</Label>
                      {isEditing ? (
                        <Input value={editedAnimal.breed || ''} onChange={(e) => setEditedAnimal({ ...editedAnimal, breed: e.target.value || undefined })} className="bg-background" />
                      ) : <p className="text-sm">{editedAnimal.breed || 'Not set'}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Health</Label>
                      {isEditing ? (
                        <Select value={editedAnimal.healthStatus} onValueChange={(v) => setEditedAnimal({ ...editedAnimal, healthStatus: v as HealthStatus })}>
                          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="healthy">Healthy</SelectItem>
                            <SelectItem value="sick">Sick</SelectItem>
                            <SelectItem value="under_treatment">Under Treatment</SelectItem>
                            <SelectItem value="deceased">Deceased</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : <Badge>{editedAnimal.healthStatus}</Badge>}
                    </div>
                    <div className="space-y-2">
                      <Label>Mother</Label>
                      {isEditing ? (
                        <Select value={editedAnimal.motherId || ''} onValueChange={(v) => setEditedAnimal({ ...editedAnimal, motherId: v || undefined })}>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {allAnimals.filter((a) => a.sex === 'female' && a.id !== editedAnimal.id).map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : <p className="text-sm">{getTag(editedAnimal.motherId) || 'Not set'}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Father</Label>
                      {isEditing ? (
                        <Select value={editedAnimal.fatherId || ''} onValueChange={(v) => setEditedAnimal({ ...editedAnimal, fatherId: v || undefined })}>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {allAnimals.filter((a) => a.sex === 'male' && a.id !== editedAnimal.id).map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : <p className="text-sm">{getTag(editedAnimal.fatherId) || 'Not set'}</p>}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => { setIsEditing(false); setEditedAnimal(animal); }}>Cancel</Button>
                      <Button variant="hero" onClick={() => { onEdit(editedAnimal); setIsEditing(false); }}>Save</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 pt-4">
                  {!animal.isLocked && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openRecord('mating')}><PawPrint className="w-4 h-4 mr-1" /> Mating</Button>
                      {animal.sex === 'female' && <Button variant="secondary" size="sm" onClick={() => openRecord('pregnancy')}><Heart className="w-4 h-4 mr-1" /> Pregnancy</Button>}
                      {animal.sex === 'female' && <Button variant="secondary" size="sm" onClick={() => openRecord('birth')}><Baby className="w-4 h-4 mr-1" /> Birth</Button>}
                      <Button variant="secondary" size="sm" onClick={() => openRecord('treatment')}><Stethoscope className="w-4 h-4 mr-1" /> Treatment</Button>
                      <Button variant="secondary" size="sm" onClick={() => openRecord('sale')}><DollarSign className="w-4 h-4 mr-1" /> Sale</Button>
                      <Button variant="secondary" size="sm" onClick={() => openRecord('death')}><Skull className="w-4 h-4 mr-1" /> Death</Button>
                    </div>
                  )}

                  <HistorySection title="Mating History" empty="No mating records" items={editedAnimal.matingHistory.map((r) => ({
                    id: r.id, type: 'mating', text: `${new Date(r.date).toLocaleDateString()} — Mate: ${getTag(r.mateId)}`,
                  }))} onDelete={deleteRecord} locked={animal.isLocked} />

                  {animal.sex === 'female' && (
                    <HistorySection title="Pregnancy History" empty="No pregnancy records" items={editedAnimal.pregnancyHistory.map((r) => ({
                      id: r.id, type: 'pregnancy', text: `${new Date(r.startDate).toLocaleDateString()} — ${r.status}${r.expectedDeliveryDate ? ` (due ${new Date(r.expectedDeliveryDate).toLocaleDateString()})` : ''}`,
                    }))} onDelete={deleteRecord} locked={animal.isLocked} />
                  )}

                  {animal.sex === 'female' && (
                    <HistorySection title="Birth Records" empty="No birth records" items={editedAnimal.birthRecords.map((r) => ({
                      id: r.id, type: 'birth', text: `${new Date(r.birthDate).toLocaleDateString()} — Offspring: ${r.offspringIds?.join(', ') || 'N/A'}`,
                    }))} onDelete={deleteRecord} locked={animal.isLocked} />
                  )}

                  <HistorySection title="Treatments" empty="No treatments" items={editedAnimal.treatmentHistory.map((r) => ({
                    id: r.id, type: 'treatment', text: `${new Date(r.date).toLocaleDateString()}${r.treatment ? ` — ${r.treatment}` : ''}${r.cost ? ` (${formatCurrency(r.cost)})` : ''}`,
                  }))} onDelete={deleteRecord} locked={animal.isLocked} />

                  <HistorySection title="Sales" empty="No sales" items={editedAnimal.saleRecords.map((r) => ({
                    id: r.id, type: 'sale', text: `${new Date(r.saleDate).toLocaleDateString()}${r.price ? ` — ${formatCurrency(r.price)}` : ''}`,
                  }))} onDelete={deleteRecord} locked={animal.isLocked} />

                  <HistorySection title="Death Records" empty="No death records" items={editedAnimal.deathRecords.map((r) => ({
                    id: r.id, type: 'death', text: `${new Date(r.deathDate).toLocaleDateString()}${r.cause ? ` — ${r.cause}` : ''}`,
                  }))} onDelete={deleteRecord} locked={animal.isLocked} />
                </TabsContent>

                <TabsContent value="pedigree" className="pt-4">
                  <PedigreeTree
                    animal={editedAnimal}
                    allAnimals={allAnimals}
                    onSelectAnimal={(a) => onSelectAnimal?.(a)}
                  />
                </TabsContent>

                <TabsContent value="financial" className="pt-4">
                  <Card className="shadow-sm">
                    <CardContent className="pt-6 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="text-green-600">{formatCurrency(financials.totalRevenue)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Costs</span><span>{formatCurrency(financials.totalCosts)}</span></div>
                      <div className="border-t pt-2 flex justify-between font-semibold"><span>Net Value</span><span>{formatCurrency(financials.netValue)}</span></div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {!editedAnimal.isLocked && (
              <Button variant="destructive" onClick={() => { if (confirm('Delete this animal?')) onDelete(editedAnimal.id); }}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {recordDialogType && (
        <RecordDialog
          open={recordDialogOpen}
          onOpenChange={setRecordDialogOpen}
          type={recordDialogType}
          animal={editedAnimal}
          allAnimals={allAnimals}
          onSubmit={addRecord}
          onSubmitBirth={recordDialogType === 'birth' ? handleBirth : undefined}
        />
      )}
    </>
  );
}

function HistorySection({
  title, empty, items, onDelete, locked,
}: {
  title: string;
  empty: string;
  items: { id: string; type: string; text: string }[];
  onDelete: (type: string, id: string) => void;
  locked: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="text-sm flex justify-between items-center border-b pb-2">
                <span><Calendar className="w-3 h-3 inline mr-1" />{item.text}</span>
                {!locked && <Button variant="ghost" size="sm" onClick={() => onDelete(item.type, item.id)}><Trash2 className="w-3 h-3" /></Button>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
