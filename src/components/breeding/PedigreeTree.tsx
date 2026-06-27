import { FarmAnimal } from '@/lib/db';
import { buildPedigreeNode, getDescendants } from '@/lib/breedingPedigree';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PedigreeTreeProps {
  animal: FarmAnimal;
  allAnimals: FarmAnimal[];
  onSelectAnimal?: (animal: FarmAnimal) => void;
  maxGenerationsUp?: number;
}

function PedigreeNodeCard({
  node,
  highlight,
  onClick,
}: {
  node: { id: string; animalId: string; sex: FarmAnimal['sex']; breed?: string };
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'min-w-[100px] rounded-lg border px-3 py-2 text-center transition-colors',
        highlight ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:bg-muted/50',
        onClick ? 'cursor-pointer' : 'cursor-default'
      )}
    >
      <div className="font-medium text-sm">{node.animalId}</div>
      <div className="flex items-center justify-center gap-1 mt-1">
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {node.sex === 'female' ? '♀' : '♂'}
        </Badge>
        {node.breed && <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{node.breed}</span>}
      </div>
    </button>
  );
}

function AncestorBranch({
  node,
  subjectId,
  allAnimals,
  onSelectAnimal,
  depth = 0,
  maxDepth = 3,
}: {
  node: ReturnType<typeof buildPedigreeNode>;
  subjectId: string;
  allAnimals: FarmAnimal[];
  onSelectAnimal?: (animal: FarmAnimal) => void;
  depth?: number;
  maxDepth?: number;
}) {
  if (!node || depth > maxDepth) return null;

  const handleClick = () => {
    const animal = allAnimals.find((a) => a.id === node.id);
    if (animal && onSelectAnimal) onSelectAnimal(animal);
  };

  const hasParents = node.mother || node.father;

  return (
    <div className="flex flex-col items-center gap-3">
      {hasParents && (
        <>
          <div className="flex items-start justify-center gap-6 flex-wrap">
            {node.mother && (
              <AncestorBranch
                node={node.mother}
                subjectId={subjectId}
                allAnimals={allAnimals}
                onSelectAnimal={onSelectAnimal}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            )}
            {node.father && (
              <AncestorBranch
                node={node.father}
                subjectId={subjectId}
                allAnimals={allAnimals}
                onSelectAnimal={onSelectAnimal}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            )}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex gap-8">
            {node.mother && <div className="h-4 w-16 border-t border-border -mt-4" />}
            {node.father && <div className="h-4 w-16 border-t border-border -mt-4" />}
          </div>
        </>
      )}
      <PedigreeNodeCard
        node={node}
        highlight={node.id === subjectId}
        onClick={node.id !== subjectId ? handleClick : undefined}
      />
    </div>
  );
}

export function PedigreeTree({
  animal,
  allAnimals,
  onSelectAnimal,
  maxGenerationsUp = 3,
}: PedigreeTreeProps) {
  const animalMap = new Map(allAnimals.map((a) => [a.id, a]));
  const pedigreeRoot = buildPedigreeNode(animal.id, animalMap, maxGenerationsUp);
  const descendants = getDescendants(animal.id, allAnimals, 2);

  const hasParents = !!(animal.motherId || animal.fatherId);
  const hasDescendants = descendants.length > 0;

  if (!hasParents && !hasDescendants) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">No pedigree data yet</p>
          <p className="text-xs text-muted-foreground">
            Set parents when adding an animal, or record a birth to create linked offspring.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm overflow-x-auto">
        <CardHeader>
          <CardTitle className="text-sm">Pedigree Chart</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 min-w-[320px]">
          {pedigreeRoot ? (
            <div className="flex justify-center">
              <AncestorBranch
                node={pedigreeRoot}
                subjectId={animal.id}
                allAnimals={allAnimals}
                onSelectAnimal={onSelectAnimal}
                maxDepth={maxGenerationsUp}
              />
            </div>
          ) : (
            <PedigreeNodeCard node={animal} highlight />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Descendants ({descendants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {descendants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No offspring linked to this animal</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {descendants.map((d) => (
                <PedigreeNodeCard
                  key={d.id}
                  node={d}
                  onClick={onSelectAnimal ? () => onSelectAnimal(d) : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
