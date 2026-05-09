import { emptyRulesStore } from "./rules";
import { Category, MailContext, OfficeApiError, TagRulesStore } from "./types";

const TAG_RULES_KEY = "tagRules";

type AsyncResult<T> = Office.AsyncResult<T>;

function getOffice(): typeof Office {
  if (typeof Office === "undefined") {
    throw new OfficeApiError(
      "OfficeUnavailable",
      "Office.js did not load. Check that the task pane is running inside Outlook and that office.js is reachable."
    );
  }

  return Office;
}

function getMailboxItem(): Office.MessageRead {
  const office = getOffice();
  const item = office.context?.mailbox?.item;

  if (!item) {
    throw new OfficeApiError("NoSelectedItem", "Select an email to get started.");
  }

  return item as Office.MessageRead;
}

function getMasterCategories(): Office.MasterCategories {
  const masterCategories = getOffice().context?.mailbox?.masterCategories;

  if (!masterCategories) {
    throw new OfficeApiError(
      "UnsupportedMailbox",
      "This Outlook client does not support Mailbox requirement set 1.8 categories APIs."
    );
  }

  return masterCategories;
}

function asPromise<T>(run: (callback: (result: AsyncResult<T>) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      run((result) => {
        if (result.status === getOffice().AsyncResultStatus.Succeeded) {
          resolve(result.value);
          return;
        }

        reject(normalizeOfficeError(result.error));
      });
    } catch (error) {
      reject(normalizeOfficeError(error));
    }
  });
}

function normalizeOfficeError(error: unknown): OfficeApiError {
  if (error instanceof OfficeApiError) {
    return error;
  }

  const officeError = error as Partial<Office.Error>;
  const code = String(officeError?.code ?? "");
  const message = officeError?.message || "An Outlook API call failed.";

  if (/permission/i.test(code) || /permission/i.test(message)) {
    return new OfficeApiError("PermissionDenied", `${message} Confirm manifest permission ReadWriteMailbox is granted.`, error);
  }

  if (/category/i.test(code) || /category/i.test(message)) {
    return new OfficeApiError("InvalidCategory", `${message} The tag may have been deleted outside this add-in.`, error);
  }

  if (/size|quota|roaming/i.test(code) || /size|quota/i.test(message)) {
    return new OfficeApiError("SettingsTooLarge", `${message} Roaming Settings are limited to 32KB per add-in.`, error);
  }

  return new OfficeApiError("ApiError", message, error);
}

function toCategory(category: Office.CategoryDetails): Category {
  return {
    name: category.displayName,
    color: String(category.color)
  };
}

export async function waitForOfficeReady(): Promise<void> {
  const office = getOffice();
  await office.onReady();
  const requirements = office.context?.requirements;

  if (!office.context?.mailbox || !requirements) {
    throw new OfficeApiError(
      "OfficeUnavailable",
      "Open this add-in from Outlook after sideloading the manifest. The localhost page can load in a browser, but Outlook APIs are only available inside Outlook."
    );
  }

  if (!requirements.isSetSupported("Mailbox", "1.8")) {
    throw new OfficeApiError(
      "UnsupportedMailbox",
      "This Outlook client does not support Mailbox requirement set 1.8 categories APIs."
    );
  }
}

export async function onSelectedItemChanged(handler: () => void): Promise<() => Promise<void>> {
  const office = getOffice();
  const mailbox = office.context?.mailbox as
    | {
        addHandlerAsync?: (
          eventType: Office.EventType,
          handler: () => void,
          callback: (result: AsyncResult<void>) => void
        ) => void;
        removeHandlerAsync?: (
          eventType: Office.EventType,
          options: { handler: () => void },
          callback: (result: AsyncResult<void>) => void
        ) => void;
      }
    | undefined;

  if (!mailbox?.addHandlerAsync || !mailbox.removeHandlerAsync || !office.EventType?.ItemChanged) {
    return async () => undefined;
  }

  await asPromise<void>((callback) => mailbox.addHandlerAsync?.(office.EventType.ItemChanged, handler, callback));

  return async () => {
    await asPromise<void>((callback) => mailbox.removeHandlerAsync?.(office.EventType.ItemChanged, { handler }, callback));
  };
}

export async function getMailCategories(): Promise<Category[]> {
  const item = getMailboxItem();
  const categories = await asPromise<Office.CategoryDetails[]>((callback) => item.categories.getAsync(callback));
  return categories.map(toCategory);
}

export function getSelectedMailContext(): MailContext {
  const item = getMailboxItem();
  const from = item.from as Partial<Office.EmailAddressDetails> | undefined;

  return {
    subject: item.subject || "",
    senderName: from?.displayName || "",
    senderEmail: from?.emailAddress || ""
  };
}

export async function addMailCategory(name: string): Promise<void> {
  const item = getMailboxItem();
  await asPromise<void>((callback) => item.categories.addAsync([name], callback));
}

export async function removeMailCategory(name: string): Promise<void> {
  const item = getMailboxItem();
  await asPromise<void>((callback) => item.categories.removeAsync([name], callback));
}

export async function getAllCategories(): Promise<Category[]> {
  const categories = await asPromise<Office.CategoryDetails[]>((callback) => getMasterCategories().getAsync(callback));
  return categories.map(toCategory).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function createCategory(name: string, color: string): Promise<void> {
  await asPromise<void>((callback) => getMasterCategories().addAsync([{ displayName: name, color }], callback));
}

export async function deleteCategory(name: string): Promise<void> {
  await asPromise<void>((callback) => getMasterCategories().removeAsync([name], callback));
}

export function getRoamingSettings(): TagRulesStore {
  const rawRules = getOffice().context.roamingSettings.get(TAG_RULES_KEY);

  if (!rawRules || typeof rawRules !== "object") {
    return emptyRulesStore();
  }

  return {
    tagRules: rawRules as TagRulesStore["tagRules"]
  };
}

export async function saveRoamingSettings(data: TagRulesStore): Promise<void> {
  const settings = getOffice().context.roamingSettings;
  settings.set(TAG_RULES_KEY, data.tagRules);
  await asPromise<void>((callback) => settings.saveAsync(callback));
}
