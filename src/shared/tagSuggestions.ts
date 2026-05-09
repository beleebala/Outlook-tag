import { Category, MailContext } from "./types";

const STOP_WORDS = new Set([
  "and",
  "are",
  "com",
  "email",
  "for",
  "from",
  "inc",
  "mail",
  "net",
  "org",
  "the",
  "this",
  "with"
]);

export function suggestTagsForMail(categories: Category[], context: MailContext, appliedNames: string[] = []): Category[] {
  const haystack = tokenize([context.subject, context.senderName, context.senderEmail].join(" "));
  const applied = new Set(appliedNames);
  const scored = categories
    .filter((category) => !applied.has(category.name))
    .map((category, index) => ({
      category,
      index,
      score: scoreCategory(category.name, haystack)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return scored.slice(0, 5).map((item) => item.category);
}

function scoreCategory(name: string, haystack: Set<string>): number {
  const tokens = tokenize(name);

  if (!tokens.size) {
    return 0;
  }

  let score = 0;
  let matches = 0;
  for (const token of tokens) {
    if (haystack.has(token)) {
      matches += 1;
      score += token.length >= 5 ? 2 : 1;
    }
  }

  if (tokens.size > 1 && matches < 2) {
    return 0;
  }

  if (score === tokens.size && tokens.size > 1) {
    score += 1;
  }

  return score;
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/u)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
  );
}
