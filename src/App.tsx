import "./App.css";
import { Route, Routes, Navigate } from "react-router-dom";
import CreateTaskPage from "./pages/CreateTaskPage";
import TasksPage from "./pages/TasksPage";
import { useCallback, useEffect, useState, useRef } from "react";
import api from "./api/api";
import type { TaskType } from "./types/TaskType";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth.tsx";
import { Toaster, toast } from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import useAuth from "../src/hooks/useAuth";

function App() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [status, setStatus] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const { auth } = useAuth();

  useQuery({
    queryKey: ["tasks", status],
    enabled: !!auth?.accessToken,
    queryFn: async () => {
      const res = await api.get(`/tasks?status=${!status ? "open" : "done"}`);
      setTasks(sortTasks(res.data.data));
      return res.data.data;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30000,
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
    retry: 2,
    retryDelay: 1000,
  });

  const { mutateAsync: statusUpdateAsync } = useMutation({
    mutationFn: async (task: TaskType) => {
      await api.patch(`/tasks/${task.id}`, {
        done: !task.done,
      });
    },
    retry: 2,
    retryDelay: 1000,
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
    retry: 2,
    retryDelay: 1000,
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

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.log("No access token, skipping SSE connection");
      return;
    }

    console.log("Connecting to SSE...");

    const eventSource = new EventSource(
      `${import.meta.env.VITE_BACKEND_URL}/stream?token=${accessToken}`
    );

    eventSource.onopen = () => {
      console.log("SSE connected successfully");
      reconnectAttemptsRef.current = 0;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

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

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);

        console.log(
          `Reconnecting SSE in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
        );

        toast.error(
          `Connection lost. Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
          { duration: 2000 }
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, delay);
      } else {
        console.error("Max SSE reconnection attempts reached");
        toast.error("Connection lost. Please refresh the page.", {
          duration: 5000,
        });
      }
    };

    eventSourceRef.current = eventSource;
  }, [mergeAndSortTasks, sortTasks, updateTask]);

  useEffect(() => {
    if (auth?.accessToken) {
      connectSSE();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [auth?.accessToken, connectSSE]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && auth?.accessToken) {
        console.log("Window regained focus, checking SSE connection...");

        if (
          !eventSourceRef.current ||
          eventSourceRef.current.readyState === EventSource.CLOSED
        ) {
          console.log("SSE connection lost, reconnecting...");
          connectSSE();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [auth?.accessToken, connectSSE]);

  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored");
      toast.success("Connection restored", { duration: 2000 });

      if (auth?.accessToken) {
        reconnectAttemptsRef.current = 0;
        connectSSE();
      }
    };

    const handleOffline = () => {
      console.log("Network connection lost");
      toast.error("No internet connection", { duration: 3000 });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [auth?.accessToken, connectSSE]);

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
                status={status}
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
