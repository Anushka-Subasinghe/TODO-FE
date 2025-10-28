import { useCallback, useMemo, type SetStateAction } from "react";
import Task from "../components/Task";
import type { TaskType } from "../types/TaskType";
import Navbar from "../components/Navbar";
import "./TasksPage.css";

const TasksPage = ({
  tasks,
  setStatus,
  reOrder,
  onToggleDone,
}: {
  tasks: TaskType[];
  setStatus: React.Dispatch<SetStateAction<boolean>>;
  reOrder: (swappedTasks: TaskType[]) => Promise<void>;
  onToggleDone: (task: TaskType) => Promise<void>;
}) => {
  const onLeftClick = useCallback(
    (i: number) => {
      const arr = [...tasks];
      if (i > 0) {
        const current = arr[i];
        const left = arr[i - 1];

        const tempOrder = current.orderIndex;
        current.orderIndex = left.orderIndex;
        left.orderIndex = tempOrder;

        const swapped = [current, left];

        reOrder(swapped);
      }
    },
    [tasks, reOrder]
  );

  const onRightClick = useCallback(
    (i: number) => {
      const arr = [...tasks];
      if (i < arr.length - 1) {
        const current = arr[i];
        const right = arr[i + 1];

        const tempOrder = current.orderIndex;
        current.orderIndex = right.orderIndex;
        right.orderIndex = tempOrder;

        const swapped = [current, right];

        reOrder(swapped);
      }
      return [];
    },
    [tasks, reOrder]
  );

  const taskList = useMemo(
    () =>
      tasks.map((t, index) => (
        <Task
          key={t.id || `task-${t.orderIndex}-${index}`}
          title={t.title}
          description={t.description}
          priority={t.priority}
          dueDate={t.dueDate}
          done={t.done}
          onLeftClick={() => onLeftClick(index)}
          onRightClick={() => onRightClick(index)}
          onToggleDone={() => onToggleDone(t)}
        />
      )),
    [tasks, onLeftClick, onRightClick, onToggleDone]
  );

  return (
    <div className="tasks-page-wrapper">
      <Navbar />
      <div className="tasks-page">
        <div className="tasks-header">
          <h1 className="tasks-title">My Tasks</h1>
          <div className="tasks-count">{tasks.length} tasks</div>
        </div>

        <div className="task-list">{taskList}</div>

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
