import { extractWikilinks, parseWikilinksToHtml } from "../src/engines/wikilinks";

describe("extractWikilinks", () => {
  it("extracts simple wikilinks", () => {
    const input = "Here is a link to [[Second Brain]] and another to [[Deep Work]].";
    expect(extractWikilinks(input)).toEqual(["Second Brain", "Deep Work"]);
  });

  it("handles aliased links [[Target|Label]]", () => {
    const input = "Check out [[Project Apollo|the mission]] and [[Goals 2026]].";
    expect(extractWikilinks(input)).toEqual(["Project Apollo", "Goals 2026"]);
  });

  it("deduplicates identical targets", () => {
    const input = "[[Focus]] is key. Also read [[Focus]].";
    expect(extractWikilinks(input)).toEqual(["Focus"]);
  });

  it("handles empty or link-free text", () => {
    expect(extractWikilinks("")).toEqual([]);
    expect(extractWikilinks("Just plain text with [brackets]")).toEqual([]);
  });
});

describe("parseWikilinksToHtml", () => {
  it("replaces known links with anchor tags and unknown with placeholders", () => {
    const text = "See [[Active Note]] or [[Missing Note]].";
    const resolver = (title: string) => (title === "Active Note" ? "/notes/123" : null);

    const html = parseWikilinksToHtml(text, resolver);
    expect(html).toContain('<a href="/notes/123"');
    expect(html).toContain('data-wikilink="Active Note">Active Note</a>');
    expect(html).toContain('title="Note not created yet">Missing Note</span>');
  });
});
