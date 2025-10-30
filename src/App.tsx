import "./App.css";
import { Route, Routes, Navigate } from "react-router-dom";
import CreateTaskPage from "./pages/CreateTaskPage";
import TasksPage from "./pages/TasksPage";
import { useCallback, useEffect, useState } from "react";
import api from "./api/api";
import type { TaskType } from "./types/TaskType";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth";
import { Toaster } from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

function App() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [status, setStatus] = useState<boolean>(false);

  useQuery({
    queryKey: ["tasks", status],
    queryFn: async () => {
      const res = await api.get(`/tasks?status=${!status ? "open" : "done"}`);
      setTasks(sortTasks(res.data.data));
      return res.data.data;
    },
  });

  const { mutateAsync: reOrder } = useMutation({
    mutationFn: async (reorderedTasks: TaskType[]) => {
      await api.patch("/tasks/reorder", {
        items: reorderedTasks.map((t) => ({
          id: t.id,
          orderIndex: t.orderIndex,
          version: t.version,
        })),
      });
    },
  });

  const { mutateAsync: statusUpdateAsync } = useMutation({
    mutationFn: async (task: TaskType) => {
      await api.patch(`/tasks/${task.id}`, {
        done: !task.done,
      });
    },
  });

  const { mutateAsync: updateTaskAsync } = useMutation({
    mutationFn: async (task: TaskType) => {
      await api.patch(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
      });
    },
  });

  const sortTasks = useCallback(
    (t: TaskType[]) => t.sort((a, b) => a.orderIndex - b.orderIndex),
    []
  );

  const updateTask = useCallback(
    (oldTasks: TaskType[], updatedTask: TaskType) => {
      const updatedTasks = oldTasks
        .map((t) => (t.id === updatedTask.id ? updatedTask : t))
        .filter((task) => task.done == status);

      return sortTasks(updatedTasks);
    },
    [status, sortTasks]
  );

  const mergeAndSortTasks = useCallback(
    (oldTasks: TaskType[], updatedTasks: TaskType[]) => {
      const updatedIds = updatedTasks.map((t) => t.id);
      const merged = oldTasks
        .filter((t) => !updatedIds.includes(t.id))
        .concat(updatedTasks);

      return sortTasks(merged);
    },
    [sortTasks]
  );

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3000/stream");

    eventSource.addEventListener("task_created", (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      console.log("New task added:", data);
      setTasks((t) => sortTasks([...t, data]));
    });

    eventSource.addEventListener("task_reordered", (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      console.log("Tasks reordered:", data);
      setTasks((prev) => mergeAndSortTasks(prev, data));
    });

    eventSource.addEventListener("task_updated", (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      console.log("Task updated:", data);
      setTasks((prev) => updateTask(prev, data));
    });

    return () => eventSource.close();
  }, [mergeAndSortTasks, sortTasks, updateTask]);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route
            path="create"
            element={<CreateTaskPage orderIndex={tasks.length} />}
          />
          <Route
            path="tasks"
            element={
              <TasksPage
                tasks={tasks}
                setTasks={setTasks}
                setStatus={setStatus}
                reOrder={reOrder}
                onToggleDone={statusUpdateAsync}
                onUpdateTask={updateTaskAsync}
              />
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
