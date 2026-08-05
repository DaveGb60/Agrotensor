import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FarmProject, FarmAnimal, BreedingProjectDetails } from '@/lib/db';
import { generateBreedingPDF } from '@/lib/breedingPDFExport';
import { FileText, Download, Users, CalendarDays, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreedingPDFExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: FarmProject;
  animals: FarmAnimal[];
  details: BreedingProjectDetails;
}

export function BreedingPDFExportDialog({
  open,
  onOpenChange,
  project,
  animals,
  details,
}: BreedingPDFExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: 'full' | 'animals' | 'events' | 'financial') => {
    setIsExporting(true);
    try {
      generateBreedingPDF({ project, animals, details, type });
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Export Breeding Report
          </DialogTitle>
          <DialogDescription>
            Download a professionally formatted PDF report for {project.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <button
            onClick={() => handleExport('full')}
            disabled={isExporting}
            className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Full Breeding Report</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Complete report with animals, events, and finances
                </p>
                <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>{animals.length} animals</span>
                  <span>•</span>
                  <span>All records</span>
                </div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleExport('animals')}
            disabled={isExporting}
            className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Animals Report</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Detailed list of all animals with status and costs
                </p>
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleExport('events')}
            disabled={isExporting}
            className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Event Log Report</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Chronological log of matings, births, treatments, and sales
                </p>
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleExport('financial')}
            disabled={isExporting}
            className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Financial Report</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Project costs, revenues, and net profit breakdown
                </p>
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
