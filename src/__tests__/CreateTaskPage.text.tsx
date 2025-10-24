import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import CreateTaskPage from "../pages/CreateTaskPage";
import api from "../api/api";
import toast from "react-hot-toast";
import { describe, beforeEach, it, expect } from "vitest";

vi.mock("../api/api");
vi.mock("react-hot-toast");

describe("CreateTaskPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows validation errors when form is empty", async () => {
    render(<CreateTaskPage orderIndex={0} />);
    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);
    expect(await screen.findByText(/Title is required/i)).toBeCalled();
  });

  it("submits successfully when valid data is entered", async () => {
    (api.post as any).mockResolvedValue({ status: 201 });

    render(<CreateTaskPage orderIndex={0} />);

    fireEvent.change(screen.getByPlaceholderText(/Enter title/i), {
      target: { value: "My New Task" },
    });

    fireEvent.change(screen.getByDisplayValue(""), {
      target: { value: "high" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() => {
      expect(localStorage.getItem("taskWizardData")).toContain("My New Task");
    });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    fireEvent.click(screen.getByRole("button", { name: /Create Task/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Task created successfully!");
    });
  });
});
