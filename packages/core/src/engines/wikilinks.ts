/**
 * Wikilinks engine for Obsidian-style [[Note Title]] syntax.
 * Pure logic for extracting, matching and transforming links in notes.
 */

const WIKILINK_REGEX = /\[\[([^[\]]+)\]\]/g;

/**
 * Extracts unique wikilink targets from a markdown string.
 * Example: "Read [[Atomic Habits]] and [[Deep Work]]" -> ["Atomic Habits", "Deep Work"]
 */
export function extractWikilinks(content: string): string[] {
  if (!content) return [];
  const matches = content.matchAll(WIKILINK_REGEX);
  const titles = new Set<string>();

  for (const match of matches) {
    const raw = match[1]?.trim();
    if (raw) {
      // Support aliased links: [[Note Title|Custom Label]]
      const [title] = raw.split("|");
      const clean = title?.trim();
      if (clean) titles.add(clean);
    }
  }

  return Array.from(titles);
}

/**
 * Replaces [[Title]] with a custom markup or anchor tag using a resolver.
 */
export function parseWikilinksToHtml(
  content: string,
  resolveHref: (title: string) => string | null,
): string {
  if (!content) return "";
  return content.replace(WIKILINK_REGEX, (_fullMatch, raw: string) => {
    const parts = raw.split("|");
    const title = parts[0]?.trim() || "";
    const label = parts[1]?.trim() || title;
    const href = resolveHref(title);

    if (href) {
      return `<a href="${href}" class="text-primary hover:underline font-semibold" data-wikilink="${title}">${label}</a>`;
    }
    return `<span class="text-muted-foreground underline decoration-dotted" title="Note not created yet">${label}</span>`;
  });
}
