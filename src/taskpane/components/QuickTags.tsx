import { Button } from "@fluentui/react-components";
import { Add16Regular } from "@fluentui/react-icons";
import { getColorMeta } from "../categoryColors";
import { Category } from "../../shared/types";

interface QuickTagsProps {
  appliedNames: string[];
  categories: Category[];
  disabled?: boolean;
  suggestedCategories: Category[];
  onApply: (name: string) => void;
}

export function QuickTags({
  appliedNames,
  categories,
  disabled,
  suggestedCategories,
  onApply
}: QuickTagsProps) {
  const applied = new Set(appliedNames);
  const visibleSuggestions = suggestedCategories.filter((category) => !applied.has(category.name));
  const suggestedNames = new Set(visibleSuggestions.map((category) => category.name));
  const quickNames = new Set([...applied, ...suggestedNames]);
  const allPreview = categories.filter((category) => !quickNames.has(category.name)).slice(0, 10);

  return (
    <section className="quickTags" aria-label="Quick tags">
      <QuickTagGroup
        applied={applied}
        categories={visibleSuggestions}
        disabled={disabled}
        emptyText="Suggestions appear when a tag matches the sender or subject."
        title="Suggested"
        onApply={onApply}
      />
      <QuickTagGroup
        applied={applied}
        categories={allPreview}
        disabled={disabled}
        title="All Tags"
        onApply={onApply}
      />
    </section>
  );
}

function QuickTagGroup({
  applied,
  categories,
  disabled,
  emptyText,
  title,
  onApply
}: {
  applied: Set<string>;
  categories: Category[];
  disabled?: boolean;
  emptyText?: string;
  title: string;
  onApply: (name: string) => void;
}) {
  return (
    <div className="quickTagGroup">
      <h2>
        <span>{title}</span>
        <span className="quickTagCount" aria-hidden="true">
          {categories.length}
        </span>
      </h2>
      {categories.length ? (
        <div className="quickTagGrid">
          {categories.map((category) => {
            const color = getColorMeta(category.color);
            const isApplied = applied.has(category.name);

            return (
              <div className="quickTagRow" key={`${title}-${category.name}`}>
                <span className="quickTagName">
                  <span className="swatch" style={{ backgroundColor: color.swatch }} aria-hidden="true" />
                  <span>{category.name}</span>
                </span>
                <span className="quickTagActions">
                  <Button
                    aria-label={isApplied ? `${category.name} is already applied` : `Apply ${category.name}`}
                    appearance="subtle"
                    disabled={disabled || isApplied}
                    icon={<Add16Regular />}
                    size="small"
                    onClick={() => onApply(category.name)}
                  >
                    {isApplied ? "Applied" : "Apply"}
                  </Button>
                </span>
              </div>
            );
          })}
        </div>
      ) : emptyText ? (
        <p className="muted">{emptyText}</p>
      ) : null}
    </div>
  );
}
