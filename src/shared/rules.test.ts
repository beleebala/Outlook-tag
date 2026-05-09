import { describe, expect, it } from "vitest";
import { planRuleExecution, pruneRulesForExistingCategories } from "./rules";

describe("planRuleExecution", () => {
  it("deduplicates operations and does not cascade or remove the trigger tag", () => {
    expect(
      planRuleExecution("Finance", {
        alsoApply: ["Q3", "Accounting", "Q3", "Finance"],
        removeConflicting: ["Personal", "Finance", "Personal"]
      })
    ).toEqual({
      add: ["Accounting", "Q3"],
      remove: ["Personal"]
    });
  });

  it("lets remove-conflicting win when a tag appears in both action lists", () => {
    expect(
      planRuleExecution("Finance", {
        alsoApply: ["Personal", "Accounting"],
        removeConflicting: ["Personal"]
      })
    ).toEqual({
      add: ["Accounting"],
      remove: ["Personal"]
    });
  });
});

describe("pruneRulesForExistingCategories", () => {
  it("removes orphaned trigger rules and orphaned action tags", () => {
    expect(
      pruneRulesForExistingCategories(
        {
          tagRules: {
            Finance: {
              alsoApply: ["Q3", "Missing"],
              removeConflicting: ["Personal", "Gone"]
            },
            Deleted: {
              alsoApply: ["Finance"],
              removeConflicting: []
            }
          }
        },
        ["Finance", "Q3", "Personal"]
      )
    ).toEqual({
      tagRules: {
        Finance: {
          alsoApply: ["Q3"],
          removeConflicting: ["Personal"]
        }
      }
    });
  });
});
