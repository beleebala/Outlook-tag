import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Category } from "../../shared/types";
import { TagManager } from "./TagManager";

const categories: Category[] = [
  { name: "Finance", color: "preset4" },
  { name: "Legal", color: "preset10" },
  { name: "Project Apollo", color: "preset7" }
];

function renderTagManager(overrides: Partial<ComponentProps<typeof TagManager>> = {}) {
  const onBack = vi.fn();
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const onDelete = vi.fn().mockResolvedValue(undefined);
  const onEdit = vi.fn();

  render(
    <TagManager
      categories={categories}
      onBack={onBack}
      onCreate={onCreate}
      onDelete={onDelete}
      onEdit={onEdit}
      {...overrides}
    />
  );

  return { onBack, onCreate, onDelete, onEdit };
}

describe("TagManager", () => {
  it("filters the tag list by search text", () => {
    renderTagManager();

    fireEvent.change(screen.getByLabelText("Search tags"), { target: { value: "leg" } });

    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(screen.queryByText("Finance")).not.toBeInTheDocument();
    expect(screen.queryByText("Project Apollo")).not.toBeInTheDocument();
  });

  it("creates a new tag with the default color", async () => {
    const { onCreate } = renderTagManager();

    fireEvent.change(screen.getByLabelText("New tag name"), { target: { value: "Invoices" } });
    fireEvent.click(screen.getByRole("button", { name: "New Tag" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Invoices", "preset0"));
    expect(screen.getByLabelText("New tag name")).toHaveValue("");
  });

  it("shows validation instead of creating duplicate tags", async () => {
    const { onCreate } = renderTagManager();

    fireEvent.change(screen.getByLabelText("New tag name"), { target: { value: " finance " } });
    fireEvent.click(screen.getByRole("button", { name: "New Tag" }));

    expect(await screen.findByText("A tag with this name already exists.")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("opens rules editing for the selected tag", () => {
    const { onEdit } = renderTagManager();
    const row = screen.getByText("Project Apollo").closest("li") as HTMLElement;

    fireEvent.click(within(row).getByRole("button", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledWith({ name: "Project Apollo", color: "preset7" });
  });

  it("confirms deletion before deleting a tag", async () => {
    const { onDelete } = renderTagManager();
    const row = screen.getByText("Legal").closest("li") as HTMLElement;

    fireEvent.click(within(row).getByRole("button", { name: "Delete Legal" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("Legal"));
  });
});
