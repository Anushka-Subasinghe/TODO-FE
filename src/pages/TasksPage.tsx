import { useCallback, useMemo, type SetStateAction } from "react";
import Task from "../components/Task";
import type { TaskType } from "../types/TaskType";
import api from "../api/api";
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
          key={index}
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
    <div className="task-container">
      {taskList}
      <div className="status-toggle">
        <input
          type="checkbox"
          id="status"
          name="Status"
          onClick={() => setStatus((s) => !s)}
        />
        <label htmlFor="status">Finished Tasks</label>
      </div>
    </div>
  );
};

export default TasksPage;
