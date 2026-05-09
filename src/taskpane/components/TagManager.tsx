import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger, Dropdown, Input, Option } from "@fluentui/react-components";
import { Add16Regular, Delete16Regular, Edit16Regular } from "@fluentui/react-icons";
import { useMemo, useState } from "react";
import { categoryColors, getColorMeta } from "../categoryColors";
import { Category } from "../../shared/types";

interface TagManagerProps {
  categories: Category[];
  busy?: boolean;
  error?: string;
  onBack: () => void;
  onCreate: (name: string, color: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
  onEdit: (category: Category) => void;
}

export function TagManager({ categories, busy, error, onBack, onCreate, onDelete, onEdit }: TagManagerProps) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(categoryColors[0].value);
  const [createError, setCreateError] = useState("");
  const sortedCategories = useMemo(
    () =>
      categories
        .filter((category) => category.name.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [categories, query]
  );

  async function createTag() {
    const trimmedName = newName.trim();
    setCreateError("");

    if (!trimmedName) {
      setCreateError("Enter a tag name.");
      return;
    }

    if (categories.some((category) => category.name.toLowerCase() === trimmedName.toLowerCase())) {
      setCreateError("A tag with this name already exists.");
      return;
    }

    await onCreate(trimmedName, newColor);
    setNewName("");
    setNewColor(categoryColors[0].value);
  }

  return (
    <>
      <header className="viewHeader">
        <Button appearance="subtle" onClick={onBack}>
          Back
        </Button>
        <div>
          <h1>Tag Manager</h1>
          <p className="muted">{categories.length} total</p>
        </div>
      </header>
      <main className="viewBody">
        {error ? <div className="errorBox">{error}</div> : null}
        <Input aria-label="Search tags" placeholder="Search tags" value={query} onChange={(_, data) => setQuery(data.value)} />

        <section className="newTagPanel" aria-label="Create tag">
          <Input
            aria-label="New tag name"
            disabled={busy}
            placeholder="New tag name"
            value={newName}
            onChange={(_, data) => setNewName(data.value)}
          />
          <Dropdown
            aria-label="New tag color"
            disabled={busy}
            selectedOptions={[newColor]}
            value={getColorMeta(newColor).label}
            onOptionSelect={(_, data) => setNewColor(data.optionValue ?? categoryColors[0].value)}
          >
            {categoryColors.map((color) => (
              <Option key={color.value} value={color.value} text={color.label}>
                <span className="optionSwatch" style={{ backgroundColor: color.swatch }} aria-hidden="true" />
                {color.label}
              </Option>
            ))}
          </Dropdown>
          <Button appearance="primary" disabled={busy} icon={<Add16Regular />} onClick={createTag}>
            New Tag
          </Button>
          {createError ? <p className="inlineError">{createError}</p> : null}
        </section>

        {sortedCategories.length === 0 ? (
          <div className="emptyState">
            <p>No tags yet</p>
            <Button appearance="primary" icon={<Add16Regular />} onClick={createTag}>
              New Tag
            </Button>
          </div>
        ) : (
          <ul className="tagRows">
            {sortedCategories.map((category) => (
              <li key={category.name}>
                <span className="rowIdentity">
                  <span className="swatch" style={{ backgroundColor: getColorMeta(category.color).swatch }} aria-hidden="true" />
                  <span>
                    <strong>{category.name}</strong>
                    <span className="muted"> {getColorMeta(category.color).label}</span>
                  </span>
                </span>
                <span className="rowActions">
                  <Button appearance="subtle" icon={<Edit16Regular />} onClick={() => onEdit(category)}>
                    Edit
                  </Button>
                  <DeleteDialog disabled={busy} name={category.name} onDelete={() => onDelete(category.name)} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function DeleteDialog({ disabled, name, onDelete }: { disabled?: boolean; name: string; onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);

  async function confirmDelete() {
    await onDelete();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="subtle" aria-label={`Delete ${name}`} disabled={disabled} icon={<Delete16Regular />} />
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogContent>
            Existing emails keep the text label, but the master category and color behavior are removed.
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" className="destructiveButton" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
