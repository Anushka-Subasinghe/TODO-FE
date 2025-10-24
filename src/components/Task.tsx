import DOMPurify from "dompurify";
import React, { useMemo } from "react";

import "./Task.css";

const Task = ({
  title,
  description,
  priority,
  dueDate,
  done,
  onToggleDone,
  onLeftClick,
  onRightClick,
}: {
  title: string;
  description: string;
  priority: "low" | "med" | "high";
  dueDate: Date;
  done: boolean;
  onToggleDone: () => void;
  onLeftClick: () => void;
  onRightClick: () => void;
}) => {
  const safeDescription = useMemo(
    () => DOMPurify.sanitize(description),
    [description]
  );

  return (
    <div className={`task-card ${done ? "done" : ""}`}>
      <button className="arrow-button left" onClick={onLeftClick}>
        &#8592;
      </button>

      <div className="task-content">
        <h3 className="task-title">{title}</h3>
        <div
          className="task-desc safe-html"
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        ></div>

        <p className={`task-priority ${priority}`}>Priority: {priority}</p>
        <p className="task-date">
          Due:{" "}
          {dueDate ? new Date(dueDate).toLocaleDateString() : "No due date"}
        </p>

        <label className="done-checkbox">
          <input type="checkbox" checked={done} onChange={onToggleDone} />
          Mark as done
        </label>
      </div>

      <button className="arrow-button right" onClick={onRightClick}>
        &#8594;
      </button>
    </div>
  );
};

export default React.memo(Task);
