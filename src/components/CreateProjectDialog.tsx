import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProjectType } from '@/lib/db';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, startDate: string, customColumns: string[], projectType: ProjectType) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSubmit }: CreateProjectDialogProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectType, setProjectType] = useState<ProjectType>('produce');

  const handleSubmit = () => {
    if (title.trim() && startDate) {
      onSubmit(title.trim(), startDate, [], projectType);
      setTitle('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setProjectType('produce');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Create New Project</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Tabs value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="produce">Produce / Crop Farm</TabsTrigger>
              <TabsTrigger value="breeding">Livestock Breeding</TabsTrigger>
            </TabsList>
            <TabsContent value="produce" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Manage crop farms, harvest records, costs, and revenues.
              </p>
            </TabsContent>
            <TabsContent value="breeding" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Manage livestock breeding, animal records, mating history, and lineage tracking.
              </p>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              placeholder={projectType === 'produce' ? "e.g., Tomato Farm 2024" : "e.g., Cattle Breeding Operation"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleSubmit} disabled={!title.trim()}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
