export type TaskType = {
  id: string;
  userId: string;
  title: string;
  priority: "low" | "med" | "high";
  description: string;
  dueDate: Date;
  done: boolean;
  orderIndex: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};
