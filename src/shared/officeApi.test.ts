import { afterEach, describe, expect, it, vi } from "vitest";
import { getSelectedMailContext, onSelectedItemChanged, waitForOfficeReady } from "./officeApi";
import { OfficeApiError } from "./types";

describe("waitForOfficeReady", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws a clear error when the page is opened outside Outlook", async () => {
    vi.stubGlobal("Office", {
      onReady: vi.fn().mockResolvedValue({}),
      context: {}
    });

    await expect(waitForOfficeReady()).rejects.toMatchObject({
      code: "OfficeUnavailable",
      message: expect.stringContaining("Open this add-in from Outlook")
    } satisfies Partial<OfficeApiError>);
  });

  it("throws a clear error when Mailbox 1.8 is unsupported", async () => {
    vi.stubGlobal("Office", {
      onReady: vi.fn().mockResolvedValue({}),
      context: {
        mailbox: {},
        requirements: {
          isSetSupported: vi.fn().mockReturnValue(false)
        }
      }
    });

    await expect(waitForOfficeReady()).rejects.toMatchObject({
      code: "UnsupportedMailbox"
    } satisfies Partial<OfficeApiError>);
  });

  it("resolves when Outlook Mailbox 1.8 is available", async () => {
    vi.stubGlobal("Office", {
      onReady: vi.fn().mockResolvedValue({}),
      context: {
        mailbox: {},
        requirements: {
          isSetSupported: vi.fn().mockReturnValue(true)
        }
      }
    });

    await expect(waitForOfficeReady()).resolves.toBeUndefined();
  });

  it("reads selected message context for local suggestions", () => {
    vi.stubGlobal("Office", {
      context: {
        mailbox: {
          item: {
            subject: "Project Apollo budget review",
            from: {
              displayName: "Contoso Finance",
              emailAddress: "finance@contoso.com"
            }
          }
        }
      }
    });

    expect(getSelectedMailContext()).toEqual({
      subject: "Project Apollo budget review",
      senderName: "Contoso Finance",
      senderEmail: "finance@contoso.com"
    });
  });

  it("subscribes and unsubscribes from selected item changes when supported", async () => {
    const addHandlerAsync = vi.fn((eventType, handler, callback) => callback({ status: "succeeded" }));
    const removeHandlerAsync = vi.fn((eventType, options, callback) => callback({ status: "succeeded" }));
    const handler = vi.fn();

    vi.stubGlobal("Office", {
      AsyncResultStatus: {
        Succeeded: "succeeded"
      },
      EventType: {
        ItemChanged: "itemChanged"
      },
      context: {
        mailbox: {
          addHandlerAsync,
          removeHandlerAsync
        }
      }
    });

    const unsubscribe = await onSelectedItemChanged(handler);
    await unsubscribe();

    expect(addHandlerAsync).toHaveBeenCalledWith("itemChanged", handler, expect.any(Function));
    expect(removeHandlerAsync).toHaveBeenCalledWith("itemChanged", { handler }, expect.any(Function));
  });

  it("uses a no-op item change unsubscribe when the event API is missing", async () => {
    vi.stubGlobal("Office", {
      context: {
        mailbox: {}
      }
    });

    await expect(onSelectedItemChanged(vi.fn())).resolves.toEqual(expect.any(Function));
  });
});
