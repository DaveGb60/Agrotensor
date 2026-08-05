import { FarmAnimal } from './db';

export interface PedigreeNode {
  id: string;
  animalId: string;
  sex: FarmAnimal['sex'];
  breed?: string;
  mother?: PedigreeNode;
  father?: PedigreeNode;
}

export function buildAnimalMap(animals: FarmAnimal[]): Map<string, FarmAnimal> {
  return new Map(animals.map((a) => [a.id, a]));
}

export function buildPedigreeNode(
  id: string,
  animalMap: Map<string, FarmAnimal>,
  maxDepth: number,
  visited: Set<string> = new Set()
): PedigreeNode | null {
  if (maxDepth < 0 || visited.has(id)) return null;
  const animal = animalMap.get(id);
  if (!animal) return null;

  visited.add(id);
  const node: PedigreeNode = {
    id: animal.id,
    animalId: animal.animalId,
    sex: animal.sex,
    breed: animal.breed,
  };

  if (animal.motherId && maxDepth > 0) {
    node.mother = buildPedigreeNode(animal.motherId, animalMap, maxDepth - 1, visited) ?? undefined;
  }
  if (animal.fatherId && maxDepth > 0) {
    node.father = buildPedigreeNode(animal.fatherId, animalMap, maxDepth - 1, visited) ?? undefined;
  }

  return node;
}

export function getDescendants(
  id: string,
  animals: FarmAnimal[],
  maxDepth = 2
): FarmAnimal[] {
  const result: FarmAnimal[] = [];
  const collect = (parentId: string, depth: number) => {
    if (depth > maxDepth) return;
    const children = animals.filter(
      (a) => a.motherId === parentId || a.fatherId === parentId
    );
    for (const child of children) {
      result.push(child);
      collect(child.id, depth + 1);
    }
  };
  collect(id, 1);
  return result;
}

export function getProjectScopedLineage(
  animalId: string,
  projectAnimals: FarmAnimal[]
): { ancestors: FarmAnimal[]; descendants: FarmAnimal[] } {
  const animalMap = buildAnimalMap(projectAnimals);
  const ancestors: FarmAnimal[] = [];
  const seen = new Set<string>();

  const walkUp = (id: string) => {
    const animal = animalMap.get(id);
    if (!animal) return;
    for (const parentId of [animal.motherId, animal.fatherId]) {
      if (!parentId || seen.has(parentId)) continue;
      const parent = animalMap.get(parentId);
      if (parent) {
        seen.add(parentId);
        ancestors.push(parent);
        walkUp(parentId);
      }
    }
  };

  walkUp(animalId);
  return {
    ancestors,
    descendants: getDescendants(animalId, projectAnimals, 10),
  };
}

export function collectPedigreeLevels(
  node: PedigreeNode,
  levels: (PedigreeNode | null)[][] = [],
  depth = 0
): (PedigreeNode | null)[][] {
  while (levels.length <= depth) levels.push([]);
  levels[depth].push(node);

  const nextDepth = depth + 1;
  if (node.mother) collectPedigreeLevels(node.mother, levels, nextDepth);
  if (node.father) collectPedigreeLevels(node.father, levels, nextDepth);

  return levels;
}
