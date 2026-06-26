import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Lock, 
  Users, 
  Cog, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Heart,
  Stethoscope
} from 'lucide-react';
import { 
  FarmProject, 
  FarmAnimal, 
  AnimalSex, 
  HealthStatus, 
  createAnimal, 
  getAnimalsByProject, 
  updateAnimal, 
  deleteAnimal, 
  lockAnimal,
  getAnimalLineage,
  generateId
} from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

interface LivestockRecordManagerProps {
  project: FarmProject;
}

export function LivestockRecordManager({ project }: LivestockRecordManagerProps) {
  const { toast } = useToast();
  const [animals, setAnimals] = useState<FarmAnimal[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<FarmAnimal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnimals = async () => {
    const data = await getAnimalsByProject(project.id);
    setAnimals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAnimals();
  }, [project.id]);

  const handleCreateAnimal = async (data: Omit<FarmAnimal, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'isLocked' | 'lockedAt'>) => {
    try {
      await createAnimal(project.id, data);
      toast({ title: 'Animal added successfully' });
      setIsAddOpen(false);
      loadAnimals();
    } catch (error) {
      toast({ title: 'Failed to add animal', variant: 'destructive' });
    }
  };

  const handleEditAnimal = async (animal: FarmAnimal) => {
    try {
      await updateAnimal(animal);
      toast({ title: 'Animal updated successfully' });
      setIsViewOpen(false);
      setSelectedAnimal(null);
      loadAnimals();
    } catch (error) {
      toast({ title: 'Failed to update animal', variant: 'destructive' });
    }
  };

  const handleDeleteAnimal = async (id: string) => {
    try {
      await deleteAnimal(id);
      toast({ title: 'Animal deleted successfully' });
      setIsViewOpen(false);
      setSelectedAnimal(null);
      loadAnimals();
    } catch (error) {
      toast({ title: 'Failed to delete animal', variant: 'destructive' });
    }
  };

  const handleLockAnimal = async (id: string) => {
    try {
      await lockAnimal(id);
      toast({ title: 'Animal locked successfully' });
      loadAnimals();
    } catch (error) {
      toast({ title: 'Failed to lock animal', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-xl font-bold text-primary">Livestock Management</h2>
        <Button variant="hero" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Animal
        </Button>
      </div>

      {isLoading ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading animals...</p>
          </CardContent>
        </Card>
      ) : animals.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No animals added yet</p>
            <Button variant="hero" onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Your First Animal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animals.map((animal) => (
            <Card 
              key={animal.id} 
              className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
              onClick={() => { setSelectedAnimal(animal); setIsViewOpen(true); }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-primary font-serif text-lg">{animal.animalId}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{animal.sex}</Badge>
                      <Badge variant={
                        animal.healthStatus === 'healthy' ? 'default' : 
                        animal.healthStatus === 'sick' ? 'destructive' : 
                        'outline'
                      }>
                        {animal.healthStatus}
                      </Badge>
                    </div>
                  </div>
                  {animal.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {animal.breed && <p className="text-sm text-muted-foreground">Breed: {animal.breed}</p>}
                {animal.age && <p className="text-sm text-muted-foreground">Age: {animal.age}</p>}
                <p className="text-xs text-muted-foreground">
                  Added: {new Date(animal.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Animal Dialog */}
      <AddAnimalDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        onSubmit={handleCreateAnimal} 
      />

      {/* View/Edit Animal Dialog */}
      {selectedAnimal && (
        <ViewEditAnimalDialog
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          animal={selectedAnimal}
          onEdit={handleEditAnimal}
          onDelete={handleDeleteAnimal}
          onLock={handleLockAnimal}
        />
      )}
    </div>
  );
}

// Add Animal Dialog
interface AddAnimalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<FarmAnimal, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'isLocked' | 'lockedAt'>) => void;
}

function AddAnimalDialog({ open, onOpenChange, onSubmit }: AddAnimalDialogProps) {
  const [animalId, setAnimalId] = useState('');
  const [sex, setSex] = useState<AnimalSex>('female');
  const [age, setAge] = useState('');
  const [breed, setBreed] = useState('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('healthy');
  const [motherId, setMotherId] = useState('');
  const [fatherId, setFatherId] = useState('');

  const handleSubmit = () => {
    if (!animalId) return;
    onSubmit({
      animalId,
      sex,
      age: age || undefined,
      breed: breed || undefined,
      healthStatus,
      motherId: motherId || undefined,
      fatherId: fatherId || undefined,
    });
    setAnimalId('');
    setSex('female');
    setAge('');
    setBreed('');
    setHealthStatus('healthy');
    setMotherId('');
    setFatherId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Add Animal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="animalId">Animal ID</Label>
            <Input
              id="animalId"
              value={animalId}
              onChange={(e) => setAnimalId(e.target.value)}
              placeholder="Unique identifier for animal"
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sex</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as AnimalSex)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select value={healthStatus} onValueChange={(v) => setHealthStatus(v as HealthStatus)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="under_treatment">Under Treatment</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 2 years, 6 months"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g., Holstein"
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motherId">Mother ID (optional)</Label>
              <Input
                id="motherId"
                value={motherId}
                onChange={(e) => setMotherId(e.target.value)}
                placeholder="Animal ID"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherId">Father ID (optional)</Label>
              <Input
                id="fatherId"
                value={fatherId}
                onChange={(e) => setFatherId(e.target.value)}
                placeholder="Animal ID"
                className="bg-background"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="hero" onClick={handleSubmit} disabled={!animalId}>Add Animal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// View/Edit Animal Dialog
interface ViewEditAnimalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: FarmAnimal;
  onEdit: (animal: FarmAnimal) => void;
  onDelete: (id: string) => void;
  onLock: (id: string) => void;
}

function ViewEditAnimalDialog({ open, onOpenChange, animal, onEdit, onDelete, onLock }: ViewEditAnimalDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnimal, setEditedAnimal] = useState(animal);
  const [activeTab, setActiveTab] = useState('details');
  const [lineage, setLineage] = useState<{ ancestors: FarmAnimal[], descendants: FarmAnimal[] } | null>(null);

  const loadLineage = async () => {
    const data = await getAnimalLineage(animal.id);
    setLineage(data);
  };

  useEffect(() => {
    if (open && activeTab === 'lineage') {
      loadLineage();
    }
  }, [open, activeTab, animal.id]);

  const handleSave = () => {
    onEdit(editedAnimal);
    setIsEditing(false);
  };

  const healthIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return <Heart className="w-4 h-4" />;
      case 'sick': return <AlertCircle className="w-4 h-4" />;
      case 'under_treatment': return <Stethoscope className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            {healthIcon(editedAnimal.healthStatus)}
            {editedAnimal.animalId}
            {editedAnimal.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
          </DialogTitle>
          <div className="flex gap-2">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details"><Cog className="w-4 h-4 mr-2" /> Details</TabsTrigger>
            <TabsTrigger value="history"><Activity className="w-4 h-4 mr-2" /> History</TabsTrigger>
            <TabsTrigger value="lineage"><Users className="w-4 h-4 mr-2" /> Lineage</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Animal ID</Label>
                {isEditing ? (
                  <Input
                    value={editedAnimal.animalId}
                    onChange={(e) => setEditedAnimal({ ...editedAnimal, animalId: e.target.value })}
                    className="bg-background"
                  />
                ) : <p className="text-sm">{editedAnimal.animalId}</p>}
              </div>

              <div className="space-y-2">
                <Label>Sex</Label>
                {isEditing ? (
                  <Select 
                    value={editedAnimal.sex} 
                    onValueChange={(v) => setEditedAnimal({ ...editedAnimal, sex: v as AnimalSex })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                ) : <Badge>{editedAnimal.sex}</Badge>}
              </div>

              <div className="space-y-2">
                <Label>Age</Label>
                {isEditing ? (
                  <Input
                    value={editedAnimal.age || ''}
                    onChange={(e) => setEditedAnimal({ ...editedAnimal, age: e.target.value || undefined })}
                    className="bg-background"
                  />
                ) : <p className="text-sm">{editedAnimal.age || 'Not set'}</p>}
              </div>

              <div className="space-y-2">
                <Label>Breed</Label>
                {isEditing ? (
                  <Input
                    value={editedAnimal.breed || ''}
                    onChange={(e) => setEditedAnimal({ ...editedAnimal, breed: e.target.value || undefined })}
                    className="bg-background"
                  />
                ) : <p className="text-sm">{editedAnimal.breed || 'Not set'}</p>}
              </div>

              <div className="space-y-2">
                <Label>Health Status</Label>
                {isEditing ? (
                  <Select 
                    value={editedAnimal.healthStatus} 
                    onValueChange={(v) => setEditedAnimal({ ...editedAnimal, healthStatus: v as HealthStatus })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="under_treatment">Under Treatment</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                ) : <Badge variant={
                  editedAnimal.healthStatus === 'healthy' ? 'default' : 
                  editedAnimal.healthStatus === 'sick' ? 'destructive' : 
                  'outline'
                }>{editedAnimal.healthStatus}</Badge>}
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditedAnimal(animal); }}>Cancel</Button>
                <Button variant="hero" onClick={handleSave}>Save Changes</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-sm">Mating History</CardTitle></CardHeader>
                <CardContent>
                  {editedAnimal.matingHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No records</p>
                  ) : (
                    <ul className="space-y-2">
                      {editedAnimal.matingHistory.map(record => (
                        <li key={record.id} className="text-sm">
                          <Calendar className="w-3 h-3 inline mr-1" /> {new Date(record.date).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-sm">Veterinary Treatments</CardTitle></CardHeader>
                <CardContent>
                  {editedAnimal.treatmentHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No records</p>
                  ) : (
                    <ul className="space-y-2">
                      {editedAnimal.treatmentHistory.map(record => (
                        <li key={record.id} className="text-sm">
                          <Stethoscope className="w-3 h-3 inline mr-1" /> {new Date(record.date).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="lineage" className="space-y-4 pt-4">
            {!lineage ? (
              <p className="text-sm text-muted-foreground">Loading lineage...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Ancestors ({lineage.ancestors.length})</h4>
                  {lineage.ancestors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ancestors recorded</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {lineage.ancestors.map(a => (
                        <Badge key={a.id} variant="outline">{a.animalId}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Descendants ({lineage.descendants.length})</h4>
                  {lineage.descendants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No descendants recorded</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {lineage.descendants.map(a => (
                        <Badge key={a.id} variant="outline">{a.animalId}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          {!editedAnimal.isLocked && (
            <Button 
              variant="destructive" 
              onClick={() => {
                if (confirm('Are you sure you want to delete this animal?')) {
                  onDelete(editedAnimal.id);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
