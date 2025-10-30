import DOMPurify from "dompurify";
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import "./Task.css";
import type { TaskType } from "../types/TaskType";

const Task = ({
  id,
  title,
  description,
  priority,
  dueDate,
  done,
  onToggleDone,
  onUpdateTask,
  orderIndex,
  version,
  disableAnimation = false,
}: {
  id?: string;
  title: string;
  description: string;
  priority: "low" | "med" | "high";
  dueDate: Date;
  done: boolean;
  onToggleDone: () => void;
  onUpdateTask: (task: TaskType) => void;
  orderIndex: number;
  version: number;
  disableAnimation?: boolean;
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [editPriority, setEditPriority] = useState(priority);
  const [editDate, setEditDate] = useState(
    dueDate ? new Date(dueDate).toISOString().split("T")[0] : ""
  );

  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const isActivelyEditingRef = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id || `task-${orderIndex}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const today = useMemo(() => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  }, []);

  const safeDescription = useMemo(
    () => DOMPurify.sanitize(editDescription),
    [editDescription]
  );

  useEffect(() => {
    if (!isActivelyEditingRef.current) {
      setEditTitle(title);
      setEditDescription(description);
      setEditPriority(priority);
      setEditDate(dueDate ? new Date(dueDate).toISOString().split("T")[0] : "");
    }
  }, [title, description, priority, dueDate]);

  const hasChanges = useMemo(() => {
    const originalDate = dueDate
      ? new Date(dueDate).toISOString().split("T")[0]
      : "";
    return (
      editTitle !== title ||
      editDescription !== description ||
      editPriority !== priority ||
      editDate !== originalDate
    );
  }, [
    editTitle,
    title,
    editDescription,
    description,
    editPriority,
    priority,
    editDate,
    dueDate,
  ]);

  const isEditing =
    isEditingTitle ||
    isEditingDescription ||
    isEditingPriority ||
    isEditingDate;
  const showActions = isEditing || hasChanges;

  useEffect(() => {
    isActivelyEditingRef.current = isEditing || hasChanges;
  }, [isEditing, hasChanges]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditingPriority(false);
      }
    };

    if (isEditingPriority) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingPriority]);

  const handleToggleDone = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onToggleDone();
    }, 400);
  };

  const handleSaveAll = () => {
    onUpdateTask({
      id: id,
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      dueDate: editDate ? new Date(editDate) : null,
      done: done,
    } as TaskType);

    setIsEditingTitle(false);
    setIsEditingDescription(false);
    setIsEditingPriority(false);
    setIsEditingDate(false);

    isActivelyEditingRef.current = false;
  };

  const handleCancelAll = () => {
    setEditTitle(title);
    setEditDescription(description);
    setEditPriority(priority);
    setEditDate(dueDate ? new Date(dueDate).toISOString().split("T")[0] : "");

    setIsEditingTitle(false);
    setIsEditingDescription(false);
    setIsEditingPriority(false);
    setIsEditingDate(false);

    isActivelyEditingRef.current = false;
  };

  const handlePrioritySelect = (newPriority: "low" | "med" | "high") => {
    setEditPriority(newPriority);
    setIsEditingPriority(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEditingTitle(false);
    } else if (e.key === "Escape") {
      handleCancelAll();
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancelAll();
    }
  };

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEditingDate(false);
    } else if (e.key === "Escape") {
      handleCancelAll();
    }
  };

  const handleTitleBlur = (e: React.FocusEvent) => {
    if (
      e.relatedTarget !== saveButtonRef.current &&
      e.relatedTarget !== cancelButtonRef.current
    ) {
      setIsEditingTitle(false);
    }
  };

  const handleDescriptionBlur = (e: React.FocusEvent) => {
    if (
      e.relatedTarget !== saveButtonRef.current &&
      e.relatedTarget !== cancelButtonRef.current
    ) {
      setIsEditingDescription(false);
    }
  };

  const handleDateBlur = (e: React.FocusEvent) => {
    if (
      e.relatedTarget !== saveButtonRef.current &&
      e.relatedTarget !== cancelButtonRef.current
    ) {
      setIsEditingDate(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-item ${done ? "task-done" : ""} ${
        showActions ? "task-editing" : ""
      } ${isRemoving ? "task-removing" : ""} ${
        isDragging ? "task-dragging" : ""
      } ${disableAnimation ? "task-no-animation" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="task-content-wrapper">
        <div className="task-checkbox-wrapper">
          <input
            type="checkbox"
            className="task-checkbox"
            checked={done}
            onChange={handleToggleDone}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>

        <div className="task-body">
          {isEditingTitle ? (
            <input
              type="text"
              className="task-title-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <h3
              className="task-title"
              onClick={() => setIsEditingTitle(true)}
              onPointerDown={(e) => e.stopPropagation()}
              title="Click to edit"
            >
              {editTitle}
            </h3>
          )}

          {editDescription && (
            <>
              {isEditingDescription ? (
                <textarea
                  className="task-description-textarea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  onKeyDown={handleDescriptionKeyDown}
                  onPointerDown={(e) => e.stopPropagation()}
                  autoFocus={isEditingDescription && !isEditingTitle}
                  rows={4}
                />
              ) : (
                <div
                  className="task-description"
                  onClick={() => setIsEditingDescription(true)}
                  onPointerDown={(e) => e.stopPropagation()}
                  dangerouslySetInnerHTML={{ __html: safeDescription }}
                  title="Click to edit"
                />
              )}
            </>
          )}

          <div className="task-metadata">
            {isEditingDate ? (
              <div className="date-edit-wrapper">
                <input
                  type="date"
                  className="task-date-input"
                  value={editDate}
                  min={today}
                  onChange={(e) => setEditDate(e.target.value)}
                  onBlur={handleDateBlur}
                  onKeyDown={handleDateKeyDown}
                  onPointerDown={(e) => e.stopPropagation()}
                  autoFocus={
                    isEditingDate && !isEditingTitle && !isEditingDescription
                  }
                />
              </div>
            ) : (
              editDate && (
                <span
                  className="task-due-date"
                  onClick={() => setIsEditingDate(true)}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Click to edit"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M11 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1V1h1v1h4V1h1v1zm2 3H3v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5zM4 3H3v1h10V3h-1V2H5v1H4V2z" />
                  </svg>
                  {new Date(editDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )
            )}

            <div className="priority-wrapper" ref={priorityDropdownRef}>
              <span
                className={`task-priority-badge priority-${editPriority}`}
                onClick={() => {
                  setIsEditingPriority(!isEditingPriority);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Click to edit"
              >
                {editPriority === "low" && "Low"}
                {editPriority === "med" && "Medium"}
                {editPriority === "high" && "High"}
              </span>

              {isEditingPriority && (
                <div className="priority-edit-dropdown">
                  <button
                    className="priority-option priority-low"
                    onClick={() => handlePrioritySelect("low")}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    Low
                  </button>
                  <button
                    className="priority-option priority-med"
                    onClick={() => handlePrioritySelect("med")}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    Medium
                  </button>
                  <button
                    className="priority-option priority-high"
                    onClick={() => handlePrioritySelect("high")}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    High
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showActions && (
          <div className="task-edit-actions">
            <button
              ref={saveButtonRef}
              className="task-save-btn"
              onClick={handleSaveAll}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Save Changes
            </button>
            <button
              ref={cancelButtonRef}
              className="task-cancel-btn"
              onClick={handleCancelAll}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Task);
