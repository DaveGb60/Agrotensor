import { useMemo, useState } from 'react';
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format, isBefore, isToday, startOfDay } from 'date-fns';
import {
  CalendarDays,
  Check,
  Circle,
  Clock3,
  GripVertical,
  ListTodo,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type TaskStatus = 'todo' | 'in-progress' | 'done';
type TaskPriority = 'low' | 'normal' | 'high';

interface Task {
  id: string;
  title: string;
  notes: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

interface TaskDraft {
  title: string;
  notes: string;
  dueDate: string;
  priority: TaskPriority;
}

const TASKS_STORAGE_KEY = 'agrotensor-tasks-v1';
const STATUSES: { id: TaskStatus; label: string; icon: typeof Circle }[] = [
  { id: 'todo', label: 'To do', icon: Circle },
  { id: 'in-progress', label: 'In progress', icon: Clock3 },
  { id: 'done', label: 'Done', icon: Check },
];

const emptyDraft: TaskDraft = { title: '', notes: '', dueDate: '', priority: 'normal' };

function newTaskId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getDueDateState(dueDate: string, status: TaskStatus) {
  if (!dueDate || status === 'done') return 'default';
  const date = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'default';
  if (isBefore(date, startOfDay(new Date()))) return 'overdue';
  if (isToday(date)) return 'today';
  return 'default';
}

function formatDueDate(dueDate: string) {
  const date = new Date(`${dueDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dueDate : format(date, 'EEE, MMM d');
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  onMove,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const dueState = getDueDateState(task.dueDate, task.status);
  const PriorityIcon = task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Normal';

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        'group rounded-md border border-border/80 bg-card p-3 shadow-sm transition-[box-shadow,opacity] duration-150 hover:shadow-card',
        isDragging && 'z-10 opacity-45 shadow-elevated',
        task.status === 'done' && 'bg-muted/50',
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className="mt-0.5 inline-flex h-7 w-6 shrink-0 touch-none items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Drag ${task.title}`}
          title="Drag to move"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Edit task: ${task.title}`}
        >
          <span className={cn('block break-words text-sm font-semibold leading-5', task.status === 'done' && 'text-muted-foreground line-through')}>
            {task.title}
          </span>
          {task.notes && (
            <span className="mt-1.5 line-clamp-2 block whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
              {task.notes}
            </span>
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-1 -mt-1 h-8 w-8 shrink-0" aria-label={`Options for ${task.title}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(task)}>Edit task</DropdownMenuItem>
            <DropdownMenuSeparator />
            {STATUSES.filter((status) => status.id !== task.status).map((status) => (
              <DropdownMenuItem key={status.id} onSelect={() => onMove(task.id, status.id)}>
                Move to {status.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(task.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 pl-7">
        <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="h-5 px-1.5 text-[10px] font-medium">
          <span className="sr-only">Priority: </span>{PriorityIcon}
        </Badge>
        {task.dueDate && (
          <span className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium',
            dueState === 'overdue' && 'text-destructive',
            dueState === 'today' && 'text-warning-foreground',
            dueState === 'default' && 'text-muted-foreground',
          )}>
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDueDate(task.dueDate)}
            {dueState === 'overdue' && <span>(overdue)</span>}
            {dueState === 'today' && <span>(today)</span>}
          </span>
        )}
      </div>
    </article>
  );
}

function TaskLane({
  status,
  tasks,
  onAdd,
  onEdit,
  onDelete,
  onMove,
}: {
  status: (typeof STATUSES)[number];
  tasks: Task[];
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  const StatusIcon = status.icon;

  return (
    <section
      ref={setNodeRef}
      aria-label={`${status.label}, ${tasks.length} tasks`}
      className={cn(
        'flex min-h-[18rem] min-w-0 flex-col rounded-md border border-border/70 bg-muted/25 p-2.5 transition-colors sm:p-3',
        isOver && 'border-primary/60 bg-primary/5',
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2 px-0.5">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <StatusIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{status.label}</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </h2>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onAdd} aria-label={`Add task to ${status.label}`}>
          <Plus className="h-4 w-4" />
        </Button>
      </header>
      <div className="flex flex-1 flex-col gap-2.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
        ))}
        {tasks.length === 0 && (
          <button
            type="button"
            onClick={onAdd}
            className="flex min-h-24 flex-1 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/80 px-3 text-center text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-background/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" />
            Drop a task here or add one
          </button>
        )}
      </div>
    </section>
  );
}

export default function Tasks() {
  usePageTitle('Tasks');
  const [storedTasks, setStoredTasks] = useLocalStorage<Task[]>(TASKS_STORAGE_KEY, []);
  const tasks = Array.isArray(storedTasks) ? storedTasks : [];
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>('todo');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !query || `${task.title} ${task.notes}`.toLocaleLowerCase().includes(query);
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [priorityFilter, search, tasks]);

  const tasksByStatus = useMemo(() => Object.fromEntries(
    STATUSES.map((status) => [status.id, filteredTasks.filter((task) => task.status === status.id)]),
  ) as Record<TaskStatus, Task[]>, [filteredTasks]);

  const overdueCount = tasks.filter((task) => getDueDateState(task.dueDate, task.status) === 'overdue').length;
  const dueTodayCount = tasks.filter((task) => getDueDateState(task.dueDate, task.status) === 'today').length;
  const completedCount = tasks.filter((task) => task.status === 'done').length;

  const openNewTask = (status: TaskStatus = 'todo') => {
    setEditingTask(null);
    setDraft(emptyDraft);
    setMobileStatus(status);
    setDialogOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setDraft({ title: task.title, notes: task.notes, dueDate: task.dueDate, priority: task.priority });
    setDialogOpen(true);
  };

  const saveTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    const now = new Date().toISOString();

    if (editingTask) {
      setStoredTasks((current) => (Array.isArray(current) ? current : []).map((task) => task.id === editingTask.id
        ? { ...task, ...draft, title, notes: draft.notes.trim(), updatedAt: now }
        : task));
    } else {
      const newTask: Task = {
        id: newTaskId(),
        ...draft,
        title,
        notes: draft.notes.trim(),
        status: mobileStatus,
        createdAt: now,
        updatedAt: now,
      };
      setStoredTasks((current) => [...(Array.isArray(current) ? current : []), newTask]);
    }
    setDialogOpen(false);
  };

  const moveTask = (taskId: string, status: TaskStatus) => {
    setStoredTasks((current) => (Array.isArray(current) ? current : []).map((task) => task.id === taskId
      ? { ...task, status, updatedAt: new Date().toISOString() }
      : task));
  };

  const deleteTask = (taskId: string) => {
    setStoredTasks((current) => (Array.isArray(current) ? current : []).filter((task) => task.id !== taskId));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const target = STATUSES.find((status) => status.id === over.id);
    if (target) moveTask(String(active.id), target.id);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-7 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <ListTodo className="h-4 w-4" />
            <span>Plan and track</span>
          </div>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep your next steps moving.</p>
        </div>
        <Button onClick={() => openNewTask()} className="w-full shrink-0 sm:w-auto">
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-card">
        <div className="min-w-0 px-3 py-3 sm:px-4">
          <p className="text-xs text-muted-foreground">Due today</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{dueTodayCount}</p>
        </div>
        <div className="min-w-0 px-3 py-3 sm:px-4">
          <p className="text-xs text-muted-foreground">Overdue</p>
          <p className={cn('mt-1 text-xl font-semibold tabular-nums', overdueCount > 0 && 'text-destructive')}>{overdueCount}</p>
        </div>
        <div className="min-w-0 px-3 py-3 sm:px-4">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{completedCount}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" className="pl-9" />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by priority">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High priority</SelectItem>
            <SelectItem value="normal">Normal priority</SelectItem>
            <SelectItem value="low">Low priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1 rounded-md bg-muted p-1 md:hidden" role="tablist" aria-label="Task status">
        {STATUSES.map((status) => {
          const selected = mobileStatus === status.id;
          return (
            <button
              key={status.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setMobileStatus(status.id)}
              className={cn(
                'flex min-w-0 items-center justify-center gap-1.5 rounded px-1.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="truncate">{status.label}</span>
              <span className="tabular-nums">{tasksByStatus[status.id].length}</span>
            </button>
          );
        })}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {STATUSES.map((status) => (
            <div key={status.id} className={cn(status.id !== mobileStatus && 'hidden md:block')}>
              <TaskLane
                status={status}
                tasks={tasksByStatus[status.id]}
                onAdd={() => openNewTask(status.id)}
                onEdit={openEditTask}
                onDelete={deleteTask}
                onMove={moveTask}
              />
            </div>
          ))}
        </div>
      </DndContext>

      {tasks.length === 0 && (
        <div className="pointer-events-none mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          <span>Your task list is ready when you are.</span>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit task' : 'Add a task'}</DialogTitle>
            <DialogDescription>{editingTask ? 'Update the task details and schedule.' : 'Add a clear next step and, if useful, a due date.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task</Label>
              <Input
                id="task-title"
                autoFocus
                required
                maxLength={160}
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. Check irrigation lines"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="task-notes"
                rows={3}
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Add useful details"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due date <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={draft.priority} onValueChange={(priority: TaskPriority) => setDraft((current) => ({ ...current, priority }))}>
                  <SelectTrigger id="task-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingTask ? 'Save changes' : 'Add task'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}