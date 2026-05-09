import { Category, TagPreferences } from "./types";

export const emptyTagPreferences = (): TagPreferences => ({
  favoriteTags: [],
  recentTags: []
});

export function normalizeTagPreferences(input: unknown, validNames: string[]): TagPreferences {
  const valid = new Set(validNames);
  const raw = input as Partial<TagPreferences> | null | undefined;

  return {
    favoriteTags: normalizeTagList(raw?.favoriteTags, valid, 12),
    recentTags: normalizeTagList(raw?.recentTags, valid, 8)
  };
}

export function recordRecentTag(preferences: TagPreferences, name: string, categories: Category[]): TagPreferences {
  const exists = categories.some((category) => category.name === name);

  if (!exists) {
    return preferences;
  }

  return {
    ...preferences,
    recentTags: [name, ...preferences.recentTags.filter((tagName) => tagName !== name)].slice(0, 8)
  };
}

export function toggleFavoriteTag(preferences: TagPreferences, name: string, categories: Category[]): TagPreferences {
  const exists = categories.some((category) => category.name === name);

  if (!exists) {
    return preferences;
  }

  const favoriteTags = preferences.favoriteTags.includes(name)
    ? preferences.favoriteTags.filter((tagName) => tagName !== name)
    : [name, ...preferences.favoriteTags].slice(0, 12);

  return {
    ...preferences,
    favoriteTags
  };
}

function normalizeTagList(value: unknown, valid: Set<string>, limit: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const names: string[] = [];

  for (const item of value) {
    if (typeof item !== "string" || seen.has(item) || !valid.has(item)) {
      continue;
    }

    seen.add(item);
    names.push(item);

    if (names.length === limit) {
      break;
    }
  }

  return names;
}
