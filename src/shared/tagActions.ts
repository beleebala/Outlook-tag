import { addMailCategory, getMailCategories, removeMailCategory } from "./officeApi";
import { planRuleExecution } from "./rules";
import { RuleExecutionResult, TagRulesStore } from "./types";

export async function applyTagWithRules(triggerTag: string, rulesStore: TagRulesStore): Promise<RuleExecutionResult> {
  const currentCategories = new Set((await getMailCategories()).map((category) => category.name));
  const plan = planRuleExecution(triggerTag, rulesStore.tagRules[triggerTag]);

  if (!currentCategories.has(triggerTag)) {
    await addMailCategory(triggerTag);
    currentCategories.add(triggerTag);
  }

  for (const name of plan.add) {
    if (!currentCategories.has(name)) {
      await addMailCategory(name);
      currentCategories.add(name);
    }
  }

  for (const name of plan.remove) {
    if (currentCategories.has(name)) {
      await removeMailCategory(name);
      currentCategories.delete(name);
    }
  }

  return {
    applied: triggerTag,
    add: plan.add,
    remove: plan.remove
  };
}
