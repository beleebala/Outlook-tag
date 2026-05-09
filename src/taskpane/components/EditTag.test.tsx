import { fireEvent, render, screen, within } from "@testing-library/react";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Category } from "../../shared/types";
import { EditTag } from "./EditTag";

const categories: Category[] = [
  { name: "Finance", color: "preset4" },
  { name: "Legal", color: "preset10" },
  { name: "Project Apollo", color: "preset7" }
];

function renderEditTag(overrides: Partial<ComponentProps<typeof EditTag>> = {}) {
  const onBack = vi.fn();
  const onCancel = vi.fn();
  const onSave = vi.fn().mockResolvedValue(undefined);

  render(
    <EditTag
      category={categories[0]}
      categories={categories}
      initialRule={{ alsoApply: ["Project Apollo"], removeConflicting: [] }}
      onBack={onBack}
      onCancel={onCancel}
      onSave={onSave}
      {...overrides}
    />
  );

  return { onBack, onCancel, onSave };
}

function section(name: string) {
  return screen.getByRole("heading", { name }).closest(".ruleSection") as HTMLElement;
}

describe("EditTag", () => {
  it("shows the edited tag as read-only and excludes it from rule choices", () => {
    renderEditTag();

    expect(screen.getByRole("heading", { name: "Finance Rules" })).toBeInTheDocument();
    expect(within(section("Also Apply")).queryByRole("checkbox", { name: "Finance" })).not.toBeInTheDocument();
    expect(within(section("Also Apply")).getByRole("checkbox", { name: "Project Apollo" })).toBeChecked();
  });

  it("saves selected also-apply and remove-conflicting rules", () => {
    const { onSave } = renderEditTag();

    fireEvent.click(within(section("Also Apply")).getByRole("checkbox", { name: "Legal" }));
    fireEvent.click(within(section("Remove Conflicting")).getByRole("checkbox", { name: "Project Apollo" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith({
      alsoApply: ["Project Apollo", "Legal"],
      removeConflicting: ["Project Apollo"]
    });
  });

  it("uses cancel and back callbacks", () => {
    const { onBack, onCancel } = renderEditTag();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when there are no other tags", () => {
    renderEditTag({ categories: [categories[0]] });

    expect(screen.getAllByText("No other tags available.")).toHaveLength(2);
  });
});
