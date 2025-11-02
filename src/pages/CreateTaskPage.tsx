import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import Navbar from "../components/Navbar";
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

  const today = useMemo(() => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  }, []);

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
    <div className="create-task-page-wrapper">
      <Navbar />
      <div className="create-task-page">
        <div className="wizard-container">
          <div className="wizard-header">
            <div className="wizard-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 4v16m-8-8h16"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="wizard-title">Create New Task</h1>
            <div className="step-indicator">
              <div className={`step ${step >= 1 ? "active" : ""}`}>
                <div className="step-number">1</div>
                <span className="step-label">Basics</span>
              </div>
              <div className="step-divider"></div>
              <div className={`step ${step >= 2 ? "active" : ""}`}>
                <div className="step-number">2</div>
                <span className="step-label">Details</span>
              </div>
              <div className="step-divider"></div>
              <div className={`step ${step >= 3 ? "active" : ""}`}>
                <div className="step-number">3</div>
                <span className="step-label">Review</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="wizard-form">
            {step === 1 && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="title">Task Title</label>
                  <input
                    id="title"
                    {...register("title", { required: "Title is required" })}
                    placeholder="What needs to be done?"
                    className={errors.title ? "input-error" : ""}
                  />
                  {errors.title && (
                    <span className="error-message">
                      {errors.title.message}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority Level</label>
                  <select
                    id="priority"
                    {...register("priority", { required: "Select a priority" })}
                    defaultValue={savedData.priority || ""}
                    className={errors.priority ? "input-error" : ""}
                  >
                    <option value="">Select priority...</option>
                    <option value="low">🟢 Low Priority</option>
                    <option value="med">🟡 Medium Priority</option>
                    <option value="high">🔴 High Priority</option>
                  </select>
                  {errors.priority && (
                    <span className="error-message">
                      {errors.priority.message}
                    </span>
                  )}
                </div>

                <div className="button-group">
                  <button type="button" className="btn-next" onClick={nextStep}>
                    Next Step
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M6 4l4 4-4 4V4z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    {...register("description", {
                      required: "Description is required",
                    })}
                    placeholder="Add more details about this task..."
                    rows={6}
                    className={errors.description ? "input-error" : ""}
                  />
                  {errors.description && (
                    <span className="error-message">
                      {errors.description.message}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    id="dueDate"
                    type="date"
                    min={today}
                    {...register("dueDate", {
                      required: "Due date is required",
                      validate: (v) =>
                        new Date(v) >= new Date(today) ||
                        "Due date cannot be in the past",
                    })}
                    className={errors.dueDate ? "input-error" : ""}
                  />
                  {errors.dueDate && (
                    <span className="error-message">
                      {errors.dueDate.message}
                    </span>
                  )}
                </div>

                <div className="button-group">
                  <button type="button" className="btn-back" onClick={prevStep}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M10 12l-4-4 4-4v8z" />
                    </svg>
                    Back
                  </button>
                  <button type="button" className="btn-next" onClick={nextStep}>
                    Next Step
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M6 4l4 4-4 4V4z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-step">
                <div className="review-section">
                  <h3>Review Your Task</h3>

                  <div className="review-item">
                    <div className="review-label">Title</div>
                    <div className="review-value">{getValues("title")}</div>
                  </div>

                  <div className="review-item">
                    <div className="review-label">Priority</div>
                    <div className="review-value">
                      <span
                        className={`priority-badge priority-${getValues(
                          "priority"
                        )}`}
                      >
                        {getValues("priority") === "low" && "Low"}
                        {getValues("priority") === "med" && "Medium"}
                        {getValues("priority") === "high" && "High"}
                      </span>
                    </div>
                  </div>

                  <div className="review-item">
                    <div className="review-label">Description</div>
                    <div className="preview-box">
                      <div
                        className="preview-content"
                        dangerouslySetInnerHTML={{
                          __html: sanitizedDescription,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="review-item">
                    <div className="review-label">Due Date</div>
                    <div className="review-value">
                      {new Date(getValues("dueDate")).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </div>
                </div>

                <div className="button-group">
                  <button type="button" className="btn-back" onClick={prevStep}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M10 12l-4-4 4-4v8z" />
                    </svg>
                    Back
                  </button>
                  <button type="submit" className="btn-submit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Create Task
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskPage;
