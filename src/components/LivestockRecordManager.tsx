import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Lock, Users, Heart } from 'lucide-react';
import {
  FarmProject,
  FarmAnimal,
  BreedingProjectDetails,
  createAnimal,
  getAnimalsByProject,
  updateAnimal,
  deleteAnimal,
  lockAnimal,
  recordBirthWithOffspring,
  OffspringInput,
} from '@/lib/db';
import { getAnimalFinancialSummary, formatCurrency } from '@/lib/breedingFinance';
import { useToast } from '@/hooks/use-toast';
import { AddAnimalDialog } from '@/components/breeding/AddAnimalDialog';
import { AnimalDetailDialog } from '@/components/breeding/AnimalDetailDialog';
import { PostCreationWizard } from '@/components/breeding/PostCreationWizard';
import { RecordDialogType } from '@/components/breeding/RecordDialog';

interface LivestockRecordManagerProps {
  project: FarmProject;
  onAnimalsChange?: () => void;
}

export function LivestockRecordManager({ project, onAnimalsChange }: LivestockRecordManagerProps) {
  const { toast } = useToast();
  const [animals, setAnimals] = useState<FarmAnimal[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<FarmAnimal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wizardAnimal, setWizardAnimal] = useState<FarmAnimal | null>(null);
  const [initialRecordType, setInitialRecordType] = useState<RecordDialogType | null>(null);

  const projectDetails = project.details as BreedingProjectDetails;

  const loadAnimals = async () => {
    const data = await getAnimalsByProject(project.id);
    setAnimals(data);
    setIsLoading(false);
    onAnimalsChange?.();
  };

  useEffect(() => {
    loadAnimals();
  }, [project.id]);

  const handleCreateAnimal = async (
    data: Omit<FarmAnimal, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'isLocked' | 'lockedAt' | 'matingHistory' | 'pregnancyHistory' | 'birthRecords' | 'deathRecords' | 'saleRecords' | 'treatmentHistory'>
  ) => {
    try {
      const created = await createAnimal(project.id, data);
      toast({ title: 'Animal added successfully' });
      setIsAddOpen(false);
      await loadAnimals();
      setWizardAnimal(created);
    } catch (error) {
      toast({
        title: 'Failed to add animal',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  };

  const handleWizardComplete = async (
    updates: Partial<FarmAnimal>,
    nextAction: 'mating' | 'pregnancy' | 'done'
  ) => {
    if (!wizardAnimal) return;
    try {
      const updated = { ...wizardAnimal, ...updates };
      await updateAnimal(updated);
      await loadAnimals();
      const refreshed = (await getAnimalsByProject(project.id)).find((a) => a.id === wizardAnimal.id) || updated;
      setSelectedAnimal(refreshed);
      setInitialRecordType(nextAction === 'done' ? null : nextAction);
      setIsViewOpen(true);
      setWizardAnimal(null);
    } catch (error) {
      toast({
        title: 'Failed to update animal',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  };

  const handleEditAnimal = async (animal: FarmAnimal) => {
    try {
      await updateAnimal(animal);
      toast({ title: 'Animal updated successfully' });
      await loadAnimals();
      const refreshed = (await getAnimalsByProject(project.id)).find((a) => a.id === animal.id);
      if (refreshed) setSelectedAnimal(refreshed);
    } catch (error) {
      toast({
        title: 'Failed to update animal',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  };

  const handleBirth = async (
    birthData: { birthDate: string; notes?: string },
    offspring: OffspringInput[],
    fatherId?: string
  ) => {
    if (!selectedAnimal) return;
    try {
      const result = await recordBirthWithOffspring(
        project.id,
        selectedAnimal.id,
        birthData,
        offspring,
        fatherId
      );
      toast({
        title: 'Birth recorded',
        description: `${result.offspring.length} offspring created and linked`,
      });
      await loadAnimals();
      setSelectedAnimal(result.updatedMother);
    } catch (error) {
      toast({
        title: 'Failed to record birth',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
      throw error;
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

  const openAnimal = (animal: FarmAnimal) => {
    setSelectedAnimal(animal);
    setInitialRecordType(null);
    setIsViewOpen(true);
  };

  const isPregnant = (animal: FarmAnimal) =>
    animal.pregnancyHistory.some((p) => p.status === 'pregnant');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-xl font-bold text-primary">Herd Management</h2>
        <Button variant="hero" onClick={() => setIsAddOpen(true)} disabled={project.isCompleted}>
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
          {animals.map((animal) => {
            const fin = getAnimalFinancialSummary(animal);
            return (
              <Card
                key={animal.id}
                className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
                onClick={() => openAnimal(animal)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-primary font-serif text-lg">{animal.animalId}</CardTitle>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">{animal.sex}</Badge>
                        <Badge variant={
                          animal.healthStatus === 'healthy' ? 'default' :
                          animal.healthStatus === 'sick' ? 'destructive' : 'outline'
                        }>
                          {animal.healthStatus}
                        </Badge>
                        {isPregnant(animal) && (
                          <Badge variant="secondary"><Heart className="w-3 h-3 mr-1" />Pregnant</Badge>
                        )}
                      </div>
                    </div>
                    {animal.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {animal.breed && <p className="text-sm text-muted-foreground">Breed: {animal.breed}</p>}
                  {fin.totalRevenue > 0 && (
                    <p className="text-sm text-green-600">Revenue: {formatCurrency(fin.totalRevenue)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Added: {new Date(animal.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddAnimalDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleCreateAnimal}
        existingAnimals={animals}
        defaultBreed={projectDetails.breed}
      />

      {wizardAnimal && (
        <PostCreationWizard
          open={!!wizardAnimal}
          onOpenChange={(open) => { if (!open) setWizardAnimal(null); }}
          animal={wizardAnimal}
          allAnimals={animals}
          onComplete={handleWizardComplete}
        />
      )}

      {selectedAnimal && (
        <AnimalDetailDialog
          open={isViewOpen}
          onOpenChange={(open) => {
            setIsViewOpen(open);
            if (!open) {
              setSelectedAnimal(null);
              setInitialRecordType(null);
            }
          }}
          animal={selectedAnimal}
          allAnimals={animals}
          onEdit={handleEditAnimal}
          onDelete={handleDeleteAnimal}
          onLock={handleLockAnimal}
          onBirth={handleBirth}
          onSelectAnimal={(a) => openAnimal(a)}
          initialRecordType={initialRecordType}
        />
      )}
    </div>
  );
}
