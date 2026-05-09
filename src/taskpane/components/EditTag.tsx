import { Button, Checkbox } from "@fluentui/react-components";
import { Save16Regular } from "@fluentui/react-icons";
import { useMemo, useState } from "react";
import { getColorMeta } from "../categoryColors";
import { Category, TagRule } from "../../shared/types";

interface EditTagProps {
  category: Category;
  categories: Category[];
  initialRule: TagRule;
  busy?: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSave: (rule: TagRule) => Promise<void>;
}

export function EditTag({ category, categories, initialRule, busy, onBack, onCancel, onSave }: EditTagProps) {
  const availableTags = useMemo(() => categories.filter((entry) => entry.name !== category.name), [categories, category.name]);
  const [alsoApply, setAlsoApply] = useState(new Set(initialRule.alsoApply));
  const [removeConflicting, setRemoveConflicting] = useState(new Set(initialRule.removeConflicting));
  const color = getColorMeta(category.color);

  function toggle(setter: (next: Set<string>) => void, current: Set<string>, name: string, checked: boolean) {
    const next = new Set(current);
    if (checked) {
      next.add(name);
    } else {
      next.delete(name);
    }
    setter(next);
  }

  async function save() {
    await onSave({
      alsoApply: [...alsoApply],
      removeConflicting: [...removeConflicting]
    });
  }

  return (
    <>
      <header className="viewHeader">
        <Button appearance="subtle" onClick={onBack}>
          Back
        </Button>
        <div>
          <h1>{category.name} Rules</h1>
          <p className="muted">Name and color are read-only in v1.</p>
        </div>
      </header>
      <main className="viewBody">
        <section className="readonlyTag">
          <span className="swatch largeSwatch" style={{ backgroundColor: color.swatch }} aria-hidden="true" />
          <div>
            <strong>{category.name}</strong>
            <p className="muted">{color.label}</p>
          </div>
        </section>

        <section className="ruleSection">
          <h2>Also Apply</h2>
          <TagCheckboxes
            categories={availableTags}
            disabled={busy}
            selected={alsoApply}
            onToggle={(name, checked) => toggle(setAlsoApply, alsoApply, name, checked)}
          />
        </section>

        <section className="ruleSection">
          <h2>Remove Conflicting</h2>
          <TagCheckboxes
            categories={availableTags}
            disabled={busy}
            selected={removeConflicting}
            onToggle={(name, checked) => toggle(setRemoveConflicting, removeConflicting, name, checked)}
          />
        </section>

        <footer className="footerActions">
          <Button appearance="secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button appearance="primary" disabled={busy} icon={<Save16Regular />} onClick={save}>
            Save
          </Button>
        </footer>
      </main>
    </>
  );
}

function TagCheckboxes({
  categories,
  disabled,
  selected,
  onToggle
}: {
  categories: Category[];
  disabled?: boolean;
  selected: Set<string>;
  onToggle: (name: string, checked: boolean) => void;
}) {
  if (categories.length === 0) {
    return <p className="muted">No other tags available.</p>;
  }

  return (
    <div className="checkboxList">
      {categories.map((category) => (
        <Checkbox
          key={category.name}
          checked={selected.has(category.name)}
          disabled={disabled}
          label={category.name}
          onChange={(_, data) => onToggle(category.name, Boolean(data.checked))}
        />
      ))}
    </div>
  );
}
