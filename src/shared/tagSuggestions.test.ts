import { describe, expect, it } from "vitest";
import { suggestTagsForMail } from "./tagSuggestions";
import { Category, MailContext } from "./types";

const categories: Category[] = [
  { name: "Finance", color: "preset0" },
  { name: "Contoso", color: "preset1" },
  { name: "Personal", color: "preset2" },
  { name: "Project Apollo", color: "preset3" },
  { name: "Legal Review", color: "preset4" }
];

describe("suggestTagsForMail", () => {
  it("suggests tags that match subject and sender context", () => {
    const context: MailContext = {
      subject: "Project Apollo budget review",
      senderName: "Contoso Finance",
      senderEmail: "updates@contoso.com"
    };

    expect(suggestTagsForMail(categories, context).map((category) => category.name)).toEqual([
      "Project Apollo",
      "Finance",
      "Contoso"
    ]);
  });

  it("does not suggest tags already applied to the message", () => {
    const context: MailContext = {
      subject: "Legal review for Project Apollo",
      senderName: "Legal Team",
      senderEmail: "legal@example.com"
    };

    expect(suggestTagsForMail(categories, context, ["Legal Review"]).map((category) => category.name)).toEqual(["Project Apollo"]);
  });

  it("ignores short and generic tokens", () => {
    const context: MailContext = {
      subject: "The email from the org",
      senderName: "Mail",
      senderEmail: "team@example.org"
    };

    expect(suggestTagsForMail(categories, context)).toEqual([]);
  });
});
