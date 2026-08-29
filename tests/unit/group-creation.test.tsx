import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { GroupCreationForm } from "@/components/groups/group-creation-form";
import { parseGroupCreationInput } from "@/modules/groups/group-creation";

const formStatus = vi.hoisted(() => ({ pending: false }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useActionState: () => [null, vi.fn(), formStatus.pending],
  };
});

beforeEach(() => {
  formStatus.pending = false;
});

it("stores a recurring rhythm and accepts men-only participation", () => {
  const formData = new FormData();
  formData.set("name", "Friday Football");
  formData.set("sport", "Football");
  formData.set("city", "Stockholm");
  formData.set("participation", "MEN_ONLY");
  formData.set("description", "A welcoming weekly five-a-side group.");
  formData.set("recurring", "on");
  formData.set("rhythm", "Every Friday at 18:30");

  expect(parseGroupCreationInput(formData)).toMatchObject({
    participation: "MEN_ONLY",
    schedule: "Every Friday at 18:30",
  });
});

it("uses a flexible schedule when recurring is not selected", () => {
  const formData = new FormData();
  formData.set("name", "Weekend Runners");
  formData.set("sport", "Running");
  formData.set("city", "Uppsala");
  formData.set("participation", "OPEN");
  formData.set("description", "Runs arranged around the group each week.");

  expect(parseGroupCreationInput(formData)).toMatchObject({
    schedule: "Flexible or one-time schedule",
  });
});

it("rejects a recurring group without a rhythm", () => {
  const formData = new FormData();
  formData.set("name", "Weekend Runners");
  formData.set("sport", "Running");
  formData.set("city", "Uppsala");
  formData.set("participation", "OPEN");
  formData.set("description", "Runs arranged around the group each week.");
  formData.set("recurring", "on");

  expect(parseGroupCreationInput(formData)).toBeNull();
});

it("reveals a required rhythm only when recurring is selected", () => {
  render(<GroupCreationForm action={vi.fn()} />);

  expect(screen.getByRole("option", { name: "Men only" })).toBeInTheDocument();
  expect(screen.queryByLabelText(/schedule rhythm/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("checkbox", { name: /recurring schedule/i }));

  expect(screen.getByLabelText(/schedule rhythm/i)).toBeRequired();
});

it("shows the shared indeterminate state while group creation is pending", () => {
  formStatus.pending = true;

  render(<GroupCreationForm action={vi.fn()} />);

  expect(screen.getByRole("form")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("progressbar", { name: "Creating group" })).not.toHaveAttribute("aria-valuenow");
  expect(screen.getByRole("button", { name: "Create group" })).toBeDisabled();
});
