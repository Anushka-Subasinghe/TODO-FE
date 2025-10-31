import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/api";
import toast from "react-hot-toast";

interface ExportJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  error?: string;
}

export const useExport = (currentStatus: boolean) => {
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!exportJob) return;

    if (!eventSourceRef.current) {
      eventSourceRef.current = new EventSource(
        `${import.meta.env.VITE_BACKEND_URL}/stream`
      );
    }

    const eventSource = eventSourceRef.current;

    const handleExportUpdate = (event: MessageEvent) => {
      if (event.type !== "export_update") {
        return;
      }

      const data = JSON.parse(event.data);

      if (data.jobId !== exportJob.jobId) {
        return;
      }

      console.log("Export update via SSE:", data);

      setExportJob((prev) => {
        if (!prev || prev.jobId !== data.jobId) return prev;

        return {
          ...prev,
          status: data.status,
          error: data.error,
        };
      });

      if (data.status === "completed") {
        setIsExporting(false);

        fetchExportStatus(data.jobId);

        toast.success("Export completed! You can now download your CSV.");

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (data.status === "failed") {
        setIsExporting(false);
        toast.error(data.error || "Export failed. Please try again.");

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    eventSource.addEventListener("export_update", handleExportUpdate);

    return () => {
      eventSource.removeEventListener("export_update", handleExportUpdate);
    };
  }, [exportJob?.jobId]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const fetchExportStatus = useCallback(async (jobId: string) => {
    try {
      const response = await api.get(`/exports/csv/${jobId}`);
      const data = response.data;

      setExportJob((prev) => ({
        jobId: prev?.jobId || jobId,
        status: data.status,
        downloadUrl: data.downloadUrl,
        error: data.error,
      }));
    } catch (error) {
      console.error("Error fetching export status:", error);
    }
  }, []);

  const pollExportStatus = useCallback(async (jobId: string) => {
    try {
      const response = await api.get(`/exports/csv/${jobId}`);
      const data = response.data;

      setExportJob((prev) => ({
        jobId: prev?.jobId || jobId,
        status: data.status,
        downloadUrl: data.downloadUrl,
        error: data.error,
      }));

      if (data.status === "completed") {
        setIsExporting(false);
        toast.success("Export completed! You can now download your CSV.");

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (data.status === "failed") {
        setIsExporting(false);
        toast.error(data.error || "Export failed. Please try again.");

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error("Error polling export status:", error);
    }
  }, []);

  const startExport = useCallback(async () => {
    try {
      setIsExporting(true);

      const userId = localStorage.getItem("id");

      const response = await api.post(`/exports/csv/${userId}`, {
        scope: {
          status: currentStatus ? "done" : "open",
        },
      });

      const { jobId } = response.data;

      setExportJob({
        jobId,
        status: "pending",
      });

      toast.success("Export started");
      pollingIntervalRef.current = setInterval(() => {
        pollExportStatus(jobId);
      }, 3000);
    } catch (error) {
      console.error("Error starting export:", error);
      setIsExporting(false);
      toast.error("Failed to start export");
    }
  }, [currentStatus, pollExportStatus]);

  const downloadCSV = useCallback(async () => {
    if (!exportJob || exportJob.status !== "completed") {
      toast.error("Export is not ready yet");
      return;
    }

    try {
      const userId = localStorage.getItem("id");
      const response = await api.get(
        `/exports/csv/${exportJob.jobId}/${userId}/file`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `tasks_export_${exportJob.jobId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("CSV downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast.error("Failed to download CSV");
    }
  }, [exportJob]);

  return {
    startExport,
    downloadCSV,
    exportJob,
    isExporting,
  };
};
