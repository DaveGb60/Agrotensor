import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileJson, ClipboardPaste, Loader2 } from 'lucide-react';
import { importAnyBackup } from '@/lib/fileSync';
import { useToast } from '@/hooks/use-toast';

interface ImportProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export const ImportProjectDialog = ({ open, onOpenChange, onImported }: ImportProjectDialogProps) => {
  const [pasted, setPasted] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const runImport = async (payload: string) => {
    setIsImporting(true);
    try {
      const result = await importAnyBackup(payload);
      toast({
        title: 'Project imported',
        description: `${result.projects} project(s), ${result.records} record(s)${result.animals ? `, ${result.animals} animal(s)` : ''} restored${result.failed ? ` — ${result.failed} skipped` : ''}.`,
      });
      setPasted('');
      setFileName(null);
      onImported();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Could not read that file.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    await runImport(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            Import project
          </DialogTitle>
          <DialogDescription>
            Bring in a project shared as a JSON file, or paste the JSON code directly. Works offline.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">
              <Upload className="h-4 w-4 mr-2" /> File
            </TabsTrigger>
            <TabsTrigger value="paste">
              <ClipboardPaste className="h-4 w-4 mr-2" /> Paste JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-3 pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-muted/40 disabled:opacity-60"
            >
              {isImporting ? (
                <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
              ) : (
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              )}
              <span className="block text-sm font-medium">
                {fileName ?? 'Choose a shared project file'}
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                Accepts AgroTensor and older FarmDeck exports
              </span>
            </button>
          </TabsContent>

          <TabsContent value="paste" className="space-y-3 pt-4">
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder='{"type":"agrotensor-sync", ...}'
              className="min-h-[180px] font-mono text-xs"
            />
            <DialogFooter>
              <Button
                onClick={() => runImport(pasted)}
                disabled={!pasted.trim() || isImporting}
                variant="hero"
              >
                {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import project
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
