import { fireEvent, render, screen, within } from "@testing-library/react";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Category } from "../../shared/types";
import { QuickTags } from "./QuickTags";

const categories: Category[] = [
  { name: "Project Apollo", color: "preset7" },
  { name: "Finance", color: "preset4" },
  { name: "Contoso", color: "preset8" },
  { name: "Personal", color: "preset9" },
  { name: "Legal", color: "preset10" }
];

function renderQuickTags(overrides: Partial<ComponentProps<typeof QuickTags>> = {}) {
  const onApply = vi.fn();

  render(
    <QuickTags
      appliedNames={[]}
      categories={categories}
      suggestedCategories={[categories[0]]}
      onApply={onApply}
      {...overrides}
    />
  );

  return { onApply };
}

function group(name: string) {
  return screen.getByRole("heading", { name }).closest(".quickTagGroup") as HTMLElement;
}

describe("QuickTags", () => {
  it("renders suggested tags ahead of all tags", () => {
    renderQuickTags();

    expect(within(group("Suggested")).getByText("Project Apollo")).toBeInTheDocument();
    expect(within(group("Suggested")).getByText("1")).toHaveClass("quickTagCount");
    expect(screen.queryByRole("heading", { name: "Favorites" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recent" })).not.toBeInTheDocument();
    expect(within(group("All Tags")).queryByText("Project Apollo")).not.toBeInTheDocument();
    expect(within(group("All Tags")).getByText("Finance")).toBeInTheDocument();
  });

  it("does not repeat suggested tags in all tags", () => {
    renderQuickTags();

    expect(within(group("Suggested")).getByText("Project Apollo")).toBeInTheDocument();
    expect(within(group("All Tags")).queryByText("Project Apollo")).not.toBeInTheDocument();
  });

  it("calls apply for the selected quick tag", () => {
    const { onApply } = renderQuickTags();

    fireEvent.click(within(group("Suggested")).getByRole("button", { name: "Apply Project Apollo" }));

    expect(onApply).toHaveBeenCalledWith("Project Apollo");
  });

  it("disables apply for tags already on the selected email", () => {
    renderQuickTags({ appliedNames: ["Project Apollo"] });

    expect(within(group("Suggested")).queryByText("Project Apollo")).not.toBeInTheDocument();
    expect(within(group("All Tags")).queryByText("Project Apollo")).not.toBeInTheDocument();
  });

  it("shows empty guidance when no suggested tags are available", () => {
    renderQuickTags({ suggestedCategories: [] });

    expect(within(group("Suggested")).getByText("Suggestions appear when a tag matches the sender or subject.")).toBeInTheDocument();
  });
});
