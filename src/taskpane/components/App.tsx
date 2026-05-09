import { Button, Spinner } from "@fluentui/react-components";
import { ArrowClockwise16Regular, Settings16Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getMailCategories,
  getSelectedMailContext,
  getRoamingSettings,
  onSelectedItemChanged,
  removeMailCategory,
  saveRoamingSettings,
  waitForOfficeReady
} from "../../shared/officeApi";
import { areRuleStoresEqual, pruneRulesForExistingCategories, normalizeRule } from "../../shared/rules";
import { applyTagWithRules } from "../../shared/tagActions";
import { suggestTagsForMail } from "../../shared/tagSuggestions";
import { Category, OfficeApiError, TagRule, TagRulesStore } from "../../shared/types";
import { EditTag } from "./EditTag";
import { QuickTags } from "./QuickTags";
import { TagInput } from "./TagInput";
import { TagList } from "./TagList";
import { TagManager } from "./TagManager";

type View = "tag" | "manage" | "rules";

export function App() {
  const [view, setView] = useState<View>("tag");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [mailCategories, setMailCategories] = useState<Category[]>([]);
  const [rulesStore, setRulesStore] = useState<TagRulesStore>({ tagRules: {} });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [liveMessage, setLiveMessage] = useState("");
  const dataRequestId = useRef(0);

  const appliedNames = useMemo(() => mailCategories.map((category) => category.name), [mailCategories]);
  const suggestedCategories = useMemo(() => {
    try {
      return suggestTagsForMail(allCategories, getSelectedMailContext(), appliedNames);
    } catch {
      return [];
    }
  }, [allCategories, appliedNames]);

  const refresh = useCallback(async () => {
    const requestId = ++dataRequestId.current;
    setError("");
    setStatus("");
    setLoading(true);

    try {
      await waitForOfficeReady();
      const [masterCategories, selectedItemCategories] = await Promise.all([getAllCategories(), getMailCategories()]);
      const storedRules = getRoamingSettings();
      const currentRules = pruneRulesForExistingCategories(storedRules, masterCategories.map((category) => category.name));
      if (requestId !== dataRequestId.current) {
        return;
      }
      setAllCategories(masterCategories);
      setMailCategories(selectedItemCategories);
      setRulesStore(currentRules);
      if (!areRuleStoresEqual(storedRules, currentRules)) {
        await saveRoamingSettings(currentRules);
      }
    } catch (caught) {
      if (requestId === dataRequestId.current) {
        setError(readableError(caught));
      }
    } finally {
      if (requestId === dataRequestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => Promise<void>) | undefined;

    onSelectedItemChanged(() => {
      if (!disposed) {
        refresh();
      }
    })
      .then((cleanup) => {
        unsubscribe = cleanup;
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      void unsubscribe?.();
    };
  }, [refresh]);

  async function runMutation(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      const requestId = ++dataRequestId.current;
      const [masterCategories, selectedItemCategories] = await Promise.all([getAllCategories(), getMailCategories()]);
      if (requestId === dataRequestId.current) {
        setAllCategories(masterCategories);
        setMailCategories(selectedItemCategories);
      }
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  }

  function applyTag(name: string) {
    runMutation(async () => {
      const result = await applyTagWithRules(name, rulesStore);
      const parts = [`Applied ${result.applied}`];
      if (result.add.length) {
        parts.push(`added ${result.add.join(", ")}`);
      }
      if (result.remove.length) {
        parts.push(`removed ${result.remove.join(", ")}`);
      }
      setStatus(`${parts.join(", ")}.`);
    });
  }

  function removeTag(name: string) {
    runMutation(async () => {
      await removeMailCategory(name);
      setLiveMessage(`Removed ${name}`);
      setStatus(`Removed ${name}.`);
    });
  }

  async function createTag(name: string, color: string) {
    await runMutation(async () => {
      await createCategory(name, color);
      setStatus(`Created ${name}.`);
    });
  }

  async function deleteTag(name: string) {
    await runMutation(async () => {
      await deleteCategory(name);
      const nextRules = { tagRules: { ...rulesStore.tagRules } };
      delete nextRules.tagRules[name];
      setRulesStore(nextRules);
      await saveRoamingSettings(nextRules);
      setStatus(`Deleted ${name}.`);
    });
  }

  async function saveRule(rule: TagRule) {
    if (!selectedCategory) {
      return;
    }

    await runMutation(async () => {
      const nextRules = {
        tagRules: {
          ...rulesStore.tagRules,
          [selectedCategory.name]: normalizeRule(rule)
        }
      };
      setRulesStore(nextRules);
      await saveRoamingSettings(nextRules);
      setStatus(`Saved rules for ${selectedCategory.name}.`);
      setView("manage");
    });
  }

  if (loading) {
    return (
      <div className="appShell centered">
        <Spinner label="Loading Outlook tags" />
      </div>
    );
  }

  if (view === "manage") {
    return (
      <div className="appShell">
        <TagManager
          busy={busy}
          categories={allCategories}
          error={error}
          onBack={() => setView("tag")}
          onCreate={createTag}
          onDelete={deleteTag}
          onEdit={(category) => {
            setSelectedCategory(category);
            setView("rules");
          }}
        />
        <StatusBar status={status} busy={busy} />
      </div>
    );
  }

  if (view === "rules" && selectedCategory) {
    return (
      <div className="appShell">
        <EditTag
          busy={busy}
          categories={allCategories}
          category={selectedCategory}
          initialRule={normalizeRule(rulesStore.tagRules[selectedCategory.name])}
          onBack={() => setView("manage")}
          onCancel={() => setView("manage")}
          onSave={saveRule}
        />
        <StatusBar status={status || error} busy={busy} />
      </div>
    );
  }

  return (
    <div className="appShell">
      <header className="viewHeader">
        <div>
          <h1>Tag Email</h1>
          <p className="muted">Apply existing Outlook categories.</p>
        </div>
        <div className="headerActions">
          <Button appearance="subtle" aria-label="Refresh selected email tags" icon={<ArrowClockwise16Regular />} onClick={refresh} />
          <Button appearance="subtle" icon={<Settings16Regular />} onClick={() => setView("manage")}>
            Manage
          </Button>
        </div>
      </header>
      <main className="viewBody">
        {error ? (
          <div className="errorBox">
            <p>{error}</p>
            <Button onClick={refresh}>Retry</Button>
          </div>
        ) : null}
        <QuickTags
          appliedNames={appliedNames}
          categories={allCategories}
          disabled={busy || Boolean(error)}
          suggestedCategories={suggestedCategories}
          onApply={applyTag}
        />
        <TagInput allCategories={allCategories} appliedNames={appliedNames} disabled={busy || Boolean(error)} onApply={applyTag} />
        <TagList categories={mailCategories} disabled={busy || Boolean(error)} onRemove={removeTag} />
      </main>
      <div className="srOnly" aria-live="polite">
        {liveMessage}
      </div>
      <StatusBar status={status} busy={busy} />
    </div>
  );
}

function StatusBar({ busy, status }: { busy?: boolean; status?: string }) {
  if (!busy && !status) {
    return null;
  }

  return <footer className="statusBar">{busy ? "Working..." : status}</footer>;
}

function readableError(error: unknown): string {
  if (error instanceof OfficeApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while communicating with Outlook.";
}
