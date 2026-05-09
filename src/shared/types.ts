export interface Category {
  name: string;
  color: string;
}

export interface TagRule {
  alsoApply: string[];
  removeConflicting: string[];
}

export interface TagRulesStore {
  tagRules: Record<string, TagRule>;
}

export interface RuleExecutionPlan {
  add: string[];
  remove: string[];
}

export interface RuleExecutionResult extends RuleExecutionPlan {
  applied: string;
}

export type OfficeApiErrorCode =
  | "OfficeUnavailable"
  | "UnsupportedMailbox"
  | "NoSelectedItem"
  | "PermissionDenied"
  | "InvalidCategory"
  | "SettingsTooLarge"
  | "ApiError";

export class OfficeApiError extends Error {
  constructor(
    public readonly code: OfficeApiErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "OfficeApiError";
  }
}
