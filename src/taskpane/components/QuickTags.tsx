import { Button, Tooltip } from "@fluentui/react-components";
import { Add16Regular, Star16Filled, Star16Regular } from "@fluentui/react-icons";
import { getColorMeta } from "../categoryColors";
import { Category, TagPreferences } from "../../shared/types";

interface QuickTagsProps {
  appliedNames: string[];
  categories: Category[];
  disabled?: boolean;
  preferences: TagPreferences;
  onApply: (name: string) => void;
  onToggleFavorite: (name: string) => void;
}

export function QuickTags({ appliedNames, categories, disabled, preferences, onApply, onToggleFavorite }: QuickTagsProps) {
  const byName = new Map(categories.map((category) => [category.name, category]));
  const applied = new Set(appliedNames);
  const favorites = preferences.favoriteTags.map((name) => byName.get(name)).filter((category): category is Category => Boolean(category));
  const recent = preferences.recentTags
    .filter((name) => !preferences.favoriteTags.includes(name))
    .map((name) => byName.get(name))
    .filter((category): category is Category => Boolean(category));
  const allPreview = categories.slice(0, 10);

  return (
    <section className="quickTags" aria-label="Quick tags">
      <QuickTagGroup
        applied={applied}
        categories={favorites}
        disabled={disabled}
        emptyText="Star tags below to make favorites."
        favoriteNames={preferences.favoriteTags}
        title="Favorites"
        onApply={onApply}
        onToggleFavorite={onToggleFavorite}
      />
      <QuickTagGroup
        applied={applied}
        categories={recent}
        disabled={disabled}
        emptyText="Recently used tags will appear here."
        favoriteNames={preferences.favoriteTags}
        title="Recent"
        onApply={onApply}
        onToggleFavorite={onToggleFavorite}
      />
      <QuickTagGroup
        applied={applied}
        categories={allPreview}
        disabled={disabled}
        favoriteNames={preferences.favoriteTags}
        title="All Tags"
        onApply={onApply}
        onToggleFavorite={onToggleFavorite}
      />
    </section>
  );
}

function QuickTagGroup({
  applied,
  categories,
  disabled,
  emptyText,
  favoriteNames,
  title,
  onApply,
  onToggleFavorite
}: {
  applied: Set<string>;
  categories: Category[];
  disabled?: boolean;
  emptyText?: string;
  favoriteNames: string[];
  title: string;
  onApply: (name: string) => void;
  onToggleFavorite: (name: string) => void;
}) {
  return (
    <div className="quickTagGroup">
      <h2>{title}</h2>
      {categories.length ? (
        <div className="quickTagGrid">
          {categories.map((category) => {
            const color = getColorMeta(category.color);
            const isFavorite = favoriteNames.includes(category.name);
            const isApplied = applied.has(category.name);

            return (
              <div className="quickTagRow" key={`${title}-${category.name}`}>
                <span className="quickTagName">
                  <span className="swatch" style={{ backgroundColor: color.swatch }} aria-hidden="true" />
                  <span>{category.name}</span>
                </span>
                <span className="quickTagActions">
                  <Tooltip content={isFavorite ? `Remove ${category.name} from favorites` : `Add ${category.name} to favorites`} relationship="label">
                    <Button
                      aria-label={isFavorite ? `Remove ${category.name} from favorites` : `Add ${category.name} to favorites`}
                      appearance="subtle"
                      disabled={disabled}
                      icon={isFavorite ? <Star16Filled /> : <Star16Regular />}
                      size="small"
                      onClick={() => onToggleFavorite(category.name)}
                    />
                  </Tooltip>
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
