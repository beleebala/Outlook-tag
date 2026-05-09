import { Button, Input } from "@fluentui/react-components";
import { Add16Regular } from "@fluentui/react-icons";
import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { Category } from "../../shared/types";

interface TagInputProps {
  allCategories: Category[];
  appliedNames: string[];
  disabled?: boolean;
  onApply: (name: string) => void;
}

export function TagInput({ allCategories, appliedNames, disabled, onApply }: TagInputProps) {
  const [query, setQuery] = useState("");
  const applied = useMemo(() => new Set(appliedNames), [appliedNames]);
  const matches = allCategories
    .filter((category) => !applied.has(category.name))
    .filter((category) => category.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 6);
  const firstMatch = matches[0]?.name ?? "";

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!firstMatch || disabled) {
      return;
    }

    onApply(firstMatch);
    setQuery("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      submit();
    }

    if (event.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <form className="tagInput" onSubmit={submit}>
      <Input
        aria-label="Apply tag"
        autoFocus
        disabled={disabled}
        list="tag-options"
        placeholder="Type an existing tag"
        value={query}
        onChange={(_, data) => setQuery(data.value)}
        onKeyDown={onKeyDown}
      />
      <datalist id="tag-options">
        {matches.map((category) => (
          <option key={category.name} value={category.name} />
        ))}
      </datalist>
      <Button
        aria-label={firstMatch ? `Apply ${firstMatch}` : "Apply tag"}
        appearance="primary"
        disabled={disabled || !firstMatch}
        icon={<Add16Regular />}
        type="submit"
      >
        Apply
      </Button>
    </form>
  );
}
