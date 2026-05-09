import { RuleExecutionPlan, TagRule, TagRulesStore } from "./types";

export const emptyRulesStore = (): TagRulesStore => ({ tagRules: {} });

export function normalizeRule(rule?: Partial<TagRule>): TagRule {
  return {
    alsoApply: uniqueSorted(rule?.alsoApply ?? []),
    removeConflicting: uniqueSorted(rule?.removeConflicting ?? [])
  };
}

export function planRuleExecution(triggerTag: string, rule?: TagRule): RuleExecutionPlan {
  const normalized = normalizeRule(rule);
  const remove = new Set(normalized.removeConflicting.filter((name) => name !== triggerTag));
  const add = normalized.alsoApply.filter((name) => name !== triggerTag && !remove.has(name));

  return {
    add: uniqueSorted(add),
    remove: uniqueSorted([...remove])
  };
}

export function pruneRulesForExistingCategories(store: TagRulesStore, categoryNames: string[]): TagRulesStore {
  const existing = new Set(categoryNames);
  const tagRules = Object.fromEntries(
    Object.entries(store.tagRules)
      .filter(([tag]) => existing.has(tag))
      .map(([tag, rule]) => [
        tag,
        {
          alsoApply: normalizeRule(rule).alsoApply.filter((name) => existing.has(name) && name !== tag),
          removeConflicting: normalizeRule(rule).removeConflicting.filter((name) => existing.has(name) && name !== tag)
        }
      ])
  );

  return { tagRules };
}

export function areRuleStoresEqual(left: TagRulesStore, right: TagRulesStore): boolean {
  const leftEntries = Object.entries(left.tagRules);
  const rightEntries = Object.entries(right.tagRules);

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return leftEntries.every(([tag, rule]) => {
    const rightRule = right.tagRules[tag];
    return Boolean(rightRule) && arraysEqual(normalizeRule(rule).alsoApply, normalizeRule(rightRule).alsoApply) && arraysEqual(
      normalizeRule(rule).removeConflicting,
      normalizeRule(rightRule).removeConflicting
    );
  });
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
