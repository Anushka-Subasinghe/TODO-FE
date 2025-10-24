import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import "./CreateTaskPage.css";
import api from "../api/api";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";

type TaskFormInputs = {
  title: string;
  priority: "low" | "med" | "high";
  description: string;
  dueDate: string;
};

const CreateTaskPage = ({ orderIndex }: { orderIndex: number }) => {
  const [step, setStep] = useState(1);
  const [savedData, setSavedData] = useState<Partial<TaskFormInputs>>({});

  const defaultValues = useMemo(() => savedData, [savedData]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm<TaskFormInputs>({
    defaultValues,
  });

  useEffect(() => {
    const stored = localStorage.getItem("taskWizardData");
    if (stored) {
      const parsed = JSON.parse(stored);
      setSavedData(parsed);
      Object.keys(parsed).forEach((key) => {
        setValue(key as keyof TaskFormInputs, parsed[key]);
      });
    }
  }, [setValue]);

  const saveProgress = useCallback(() => {
    const data = getValues();
    localStorage.setItem("taskWizardData", JSON.stringify(data));
  }, [getValues]);

  useEffect(() => {
    return () => saveProgress();
  }, [saveProgress]);

  const nextStep = useCallback(() => {
    saveProgress();
    setStep((prev) => prev + 1);
  }, [saveProgress]);

  const prevStep = useCallback(() => setStep((prev) => prev - 1), []);

  const onSubmit: SubmitHandler<TaskFormInputs> = async (data) => {
    const userId = localStorage.getItem("id");
    try {
      const res = await api.post("/tasks", {
        userId: userId,
        title: data.title,
        priority: data.priority,
        description: data.description,
        dueDate: data.dueDate,
        orderIndex: orderIndex,
      });

      if (res.status === 201 || res.status === 200) {
        toast.success("Task created successfully!");
        localStorage.removeItem("taskWizardData");
        reset();
        setStep(1);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create task");
    }
  };

  const sanitizedDescription = DOMPurify.sanitize(
    getValues("description") || ""
  );

  return (
    <div className="wizard-container">
      <h2>Create New Task (Step {step}/3)</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="wizard-form">
        {step === 1 && (
          <>
            <label>Create new task</label>
            <input
              {...register("title", { required: "Title is required" })}
              placeholder="Enter title"
            />
            {errors.title && (
              <span className="error">{errors.title.message}</span>
            )}

            <label>Priority</label>
            <select
              {...register("priority", { required: "Select a priority" })}
              defaultValue={savedData.priority || ""}
            >
              <option value="">Select...</option>
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </select>
            {errors.priority && (
              <span className="error">{errors.priority.message}</span>
            )}

            <div className="button-group">
              <button type="button" onClick={nextStep}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <label>Description</label>
            <textarea
              {...register("description", {
                required: "Description is required",
              })}
              placeholder="Enter description"
            />
            {errors.description && (
              <span className="error">{errors.description.message}</span>
            )}

            <label>Due Date</label>
            <input
              type="date"
              {...register("dueDate", {
                required: "Due date is required",
                validate: (v) =>
                  new Date(v) >= new Date() || "Due date cannot be in the past",
              })}
            />
            {errors.dueDate && (
              <span className="error">{errors.dueDate.message}</span>
            )}

            <div className="button-group">
              <button type="button" onClick={prevStep}>
                Back
              </button>
              <button type="button" onClick={nextStep}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Review Your Task</h3>
            <p>
              <b>Title:</b> {getValues("title")}
            </p>
            <p>
              <b>Priority:</b> {getValues("priority")}
            </p>
            <div className="preview-box">
              <h4>Preview (safe):</h4>
              <div
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              ></div>
            </div>
            <p>
              <b>Due Date:</b> {getValues("dueDate")}
            </p>

            <div className="button-group">
              <button type="button" onClick={prevStep}>
                Back
              </button>
              <button type="submit">Create Task</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default CreateTaskPage;
