import { describe, expect, it } from "vitest";
import { normalizeTagPreferences, recordRecentTag, toggleFavoriteTag } from "./tagPreferences";
import { Category } from "./types";

const categories: Category[] = [
  { name: "Client", color: "preset7" },
  { name: "Finance", color: "preset4" },
  { name: "Waiting", color: "preset3" }
];

describe("tag preferences", () => {
  it("keeps only valid unique preference names", () => {
    const preferences = normalizeTagPreferences(
      {
        favoriteTags: ["Client", "Missing", "Client", "Finance"],
        recentTags: ["Waiting", "Missing", "Waiting"]
      },
      categories.map((category) => category.name)
    );

    expect(preferences).toEqual({
      favoriteTags: ["Client", "Finance"],
      recentTags: ["Waiting"]
    });
  });

  it("records recent tags most-recent first without duplicates", () => {
    const preferences = recordRecentTag({ favoriteTags: [], recentTags: ["Client", "Waiting"] }, "Waiting", categories);

    expect(preferences.recentTags).toEqual(["Waiting", "Client"]);
  });

  it("toggles favorites only for existing categories", () => {
    const added = toggleFavoriteTag({ favoriteTags: [], recentTags: [] }, "Client", categories);
    const removed = toggleFavoriteTag(added, "Client", categories);
    const ignored = toggleFavoriteTag(removed, "Missing", categories);

    expect(added.favoriteTags).toEqual(["Client"]);
    expect(removed.favoriteTags).toEqual([]);
    expect(ignored.favoriteTags).toEqual([]);
  });
});
