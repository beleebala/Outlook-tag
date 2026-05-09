import { afterEach, describe, expect, it, vi } from "vitest";
import { waitForOfficeReady } from "./officeApi";
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
});
