import {
  useCallback,
  useMemo,
  useState,
  type SetStateAction,
  type Dispatch,
} from "react";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import Task from "../components/Task";
import type { TaskType } from "../types/TaskType";
import Navbar from "../components/Navbar";
import "./TasksPage.css";
import toast from "react-hot-toast";

const TasksPage = ({
  tasks,
  setTasks,
  setStatus,
  reOrder,
  onToggleDone,
  onUpdateTask,
}: {
  tasks: TaskType[];
  setTasks: Dispatch<SetStateAction<TaskType[]>>;
  setStatus: React.Dispatch<SetStateAction<boolean>>;
  reOrder: (swappedTasks: TaskType[]) => Promise<void>;
  onToggleDone: (task: TaskType) => Promise<void>;
  onUpdateTask: (task: TaskType) => Promise<void>;
}) => {
  const [hasReordered, setHasReordered] = useState(false);

  const taskIds = useMemo(
    () => tasks.map((t) => t.id || `task-${t.orderIndex}`),
    [tasks]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = tasks.findIndex(
        (t) => (t.id || `task-${t.orderIndex}`) === active.id
      );
      const newIndex = tasks.findIndex(
        (t) => (t.id || `task-${t.orderIndex}`) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const originalTasks = [...tasks];

        setHasReordered(true);

        const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
        const updatedTasks = reorderedTasks.map((task, index) => ({
          ...task,
          orderIndex: index,
        }));

        setTasks(updatedTasks);

        try {
          await reOrder(updatedTasks);
        } catch (error) {
          console.error("Failed to reorder tasks:", error);

          setTasks(originalTasks);

          toast.error("Failed to reorder tasks. Please try again.");
        }
      }
    },
    [tasks, reOrder, setTasks]
  );

  const taskList = useMemo(
    () =>
      tasks.map((t, index) => (
        <Task
          key={t.id || `task-${t.orderIndex}-${index}`}
          id={t.id}
          title={t.title}
          description={t.description}
          priority={t.priority}
          dueDate={t.dueDate}
          done={t.done}
          onToggleDone={() => onToggleDone(t)}
          onUpdateTask={onUpdateTask}
          orderIndex={t.orderIndex}
          version={t.version}
          disableAnimation={hasReordered}
        />
      )),
    [tasks, onToggleDone, onUpdateTask, hasReordered]
  );

  return (
    <div className="tasks-page-wrapper">
      <Navbar />
      <div className="tasks-page">
        <div className="tasks-header">
          <h1 className="tasks-title">My Tasks</h1>
          <div className="tasks-count">{tasks.length} tasks</div>
        </div>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={taskIds} strategy={rectSortingStrategy}>
            <div className="task-list">{taskList}</div>
          </SortableContext>
        </DndContext>

        <div className="status-toggle">
          <input
            type="checkbox"
            id="status"
            name="Status"
            onChange={() => setStatus((s) => !s)}
          />
          <label htmlFor="status">Show completed tasks</label>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
