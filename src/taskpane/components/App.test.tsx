import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

const mocks = vi.hoisted(() => ({
  applyTagWithRules: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getAllCategories: vi.fn(),
  getMailCategories: vi.fn(),
  getRoamingSettings: vi.fn(),
  getSelectedMailContext: vi.fn(),
  onSelectedItemChanged: vi.fn(),
  removeMailCategory: vi.fn(),
  saveRoamingSettings: vi.fn(),
  waitForOfficeReady: vi.fn()
}));

vi.mock("../../shared/officeApi", () => ({
  createCategory: mocks.createCategory,
  deleteCategory: mocks.deleteCategory,
  getAllCategories: mocks.getAllCategories,
  getMailCategories: mocks.getMailCategories,
  getRoamingSettings: mocks.getRoamingSettings,
  getSelectedMailContext: mocks.getSelectedMailContext,
  onSelectedItemChanged: mocks.onSelectedItemChanged,
  removeMailCategory: mocks.removeMailCategory,
  saveRoamingSettings: mocks.saveRoamingSettings,
  waitForOfficeReady: mocks.waitForOfficeReady,
  OfficeApiError: class OfficeApiError extends Error {}
}));

vi.mock("../../shared/tagActions", () => ({
  applyTagWithRules: mocks.applyTagWithRules
}));

const categories = [
  { name: "Finance", color: "preset4" },
  { name: "Project Apollo", color: "preset7" },
  { name: "Contoso", color: "preset8" }
];

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.waitForOfficeReady.mockResolvedValue(undefined);
    mocks.getAllCategories.mockResolvedValue(categories);
    mocks.getMailCategories.mockResolvedValue([]);
    mocks.getRoamingSettings.mockReturnValue({ tagRules: {} });
    mocks.getSelectedMailContext.mockReturnValue({
      subject: "Project Apollo launch",
      senderName: "Contoso",
      senderEmail: "updates@contoso.com"
    });
    mocks.onSelectedItemChanged.mockResolvedValue(vi.fn());
    mocks.applyTagWithRules.mockResolvedValue({ applied: "Project Apollo", add: [], remove: [] });
    mocks.saveRoamingSettings.mockResolvedValue(undefined);
  });

  it("loads Outlook data into the tag pane", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Tag Email" })).toBeInTheDocument();
    expect(within(group("Suggested")).getByText("Project Apollo")).toBeInTheDocument();
    expect(within(group("Suggested")).getByText("Contoso")).toBeInTheDocument();
    expect(within(group("All Tags")).getByText("Finance")).toBeInTheDocument();
    expect(mocks.saveRoamingSettings).not.toHaveBeenCalled();
  });

  it("saves pruned rules only when stale rules were removed during refresh", async () => {
    mocks.getRoamingSettings.mockReturnValue({
      tagRules: {
        Finance: {
          alsoApply: ["Missing"],
          removeConflicting: ["Contoso"]
        },
        Deleted: {
          alsoApply: ["Finance"],
          removeConflicting: []
        }
      }
    });

    render(<App />);

    await screen.findByRole("heading", { name: "Tag Email" });
    expect(mocks.saveRoamingSettings).toHaveBeenCalledWith({
      tagRules: {
        Finance: {
          alsoApply: [],
          removeConflicting: ["Contoso"]
        }
      }
    });
  });

  it("applies a suggested tag through the App mutation path", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "Tag Email" });
    fireEvent.click(await within(group("Suggested")).findByRole("button", { name: "Apply Project Apollo" }));

    expect(mocks.applyTagWithRules).toHaveBeenCalledWith("Project Apollo", { tagRules: {} });
    expect(await screen.findByText("Applied Project Apollo.")).toBeInTheDocument();
  });

  it("navigates to tag manager from the header", async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Manage" }));

    expect(await screen.findByRole("heading", { name: "Tag Manager" })).toBeInTheDocument();
  });

  it("ignores stale selected-email refresh results that finish out of order", async () => {
    const oldCategories = [{ name: "Old Email Tag", color: "preset1" }];
    const newCategories = [{ name: "New Email Tag", color: "preset2" }];
    const oldMaster = deferred<typeof oldCategories>();
    const oldMail = deferred<typeof oldCategories>();
    const newMaster = deferred<typeof newCategories>();
    const newMail = deferred<typeof newCategories>();
    let itemChanged = () => undefined;

    mocks.getAllCategories
      .mockResolvedValueOnce(categories)
      .mockReturnValueOnce(oldMaster.promise)
      .mockReturnValueOnce(newMaster.promise);
    mocks.getMailCategories.mockResolvedValueOnce([]).mockReturnValueOnce(oldMail.promise).mockReturnValueOnce(newMail.promise);
    mocks.getSelectedMailContext.mockReturnValue({ subject: "", senderName: "", senderEmail: "" });
    mocks.onSelectedItemChanged.mockImplementation(async (handler) => {
      itemChanged = handler;
      return vi.fn();
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Tag Email" });

    act(() => itemChanged());
    act(() => itemChanged());

    await act(async () => {
      newMaster.resolve(newCategories);
      newMail.resolve([]);
    });
    expect(await screen.findByText("New Email Tag")).toBeInTheDocument();

    await act(async () => {
      oldMaster.resolve(oldCategories);
      oldMail.resolve([]);
    });

    await waitFor(() => expect(screen.queryByText("Old Email Tag")).not.toBeInTheDocument());
    expect(screen.getByText("New Email Tag")).toBeInTheDocument();
  });
});

function group(name: string) {
  return screen.getByRole("heading", { name }).closest(".quickTagGroup") as HTMLElement;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}
