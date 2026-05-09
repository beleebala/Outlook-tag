import { Button, Tooltip } from "@fluentui/react-components";
import { Dismiss16Regular } from "@fluentui/react-icons";
import { getColorMeta } from "../categoryColors";
import { Category } from "../../shared/types";

interface TagListProps {
  categories: Category[];
  disabled?: boolean;
  onRemove: (name: string) => void;
}

export function TagList({ categories, disabled, onRemove }: TagListProps) {
  if (categories.length === 0) {
    return <p className="muted">No tags on this email.</p>;
  }

  return (
    <div className="chipList" aria-label="Tags on selected email">
      {categories.map((category) => {
        const color = getColorMeta(category.color);

        return (
          <Tooltip key={category.name} content={`${category.name}, ${color.label}`} relationship="label">
            <span className="tagChip">
              <span className="swatch" style={{ backgroundColor: color.swatch }} aria-hidden="true" />
              <span className="chipText">{category.name}</span>
              <Button
                aria-label={`Remove ${category.name}`}
                appearance="subtle"
                disabled={disabled}
                icon={<Dismiss16Regular />}
                size="small"
                onClick={() => onRemove(category.name)}
              />
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}
