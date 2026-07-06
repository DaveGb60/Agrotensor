import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ProjectType, RecordType } from '@/lib/db';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    title: string,
    startDate: string,
    customColumns: string[],
    projectType: ProjectType,
    recordType: RecordType,
  ) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSubmit }: CreateProjectDialogProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectType, setProjectType] = useState<ProjectType>('produce');
  const [recordType, setRecordType] = useState<RecordType>('standard');

  const handleSubmit = () => {
    if (title.trim() && startDate) {
      const finalRecordType: RecordType = projectType === 'produce' ? recordType : 'standard';
      onSubmit(title.trim(), startDate, [], projectType, finalRecordType);
      setTitle('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setProjectType('produce');
      setRecordType('standard');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto">
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
              placeholder={projectType === 'produce' ? 'e.g., Tomato Farm 2024' : 'e.g., Cattle Breeding Operation'}
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

          {projectType === 'produce' && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <Label className="text-sm font-semibold">Record Type</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose how sales and revenue are recorded for this project. You can change this later.
                </p>
              </div>
              <RadioGroup
                value={recordType}
                onValueChange={(v) => setRecordType(v as RecordType)}
                className="space-y-2"
              >
                <label
                  htmlFor="rt-standard"
                  className={`flex gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                    recordType === 'standard' ? 'border-primary bg-accent/40' : 'border-border hover:bg-accent/20'
                  }`}
                >
                  <RadioGroupItem value="standard" id="rt-standard" className="mt-1" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Standard</div>
                    <p className="text-xs text-muted-foreground">
                      Record production and sales together on the same day. Best when harvested produce is sold immediately (e.g., fresh vegetables, milk delivered daily).
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="rt-delayed"
                  className={`flex gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                    recordType === 'delayed_revenue' ? 'border-primary bg-accent/40' : 'border-border hover:bg-accent/20'
                  }`}
                >
                  <RadioGroupItem value="delayed_revenue" id="rt-delayed" className="mt-1" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Delayed Revenue (Batch Sales)</div>
                    <p className="text-xs text-muted-foreground">
                      Track quantities collected/harvested first, then log batch sales when the produce is actually sold (e.g., eggs, stored grains). Unsold stock is carried forward automatically.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}
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
