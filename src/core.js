/**
 * @arraypress/llms-txt
 *
 * Generate llms.txt files for AI agent discovery. The emerging standard
 * for making sites AI-accessible.
 *
 * Zero dependencies. Works everywhere.
 *
 * @module @arraypress/llms-txt
 */

/**
 * Build an llms.txt file content string from structured options.
 *
 * Produces Markdown-formatted output with a title, description, optional
 * metadata, content sections with items/links, and API endpoints.
 *
 * @param {Object} [options={}] - Configuration for the llms.txt file.
 * @param {string} [options.name] - Site or project name (rendered as `# heading`).
 * @param {string} [options.description] - One-line description (rendered as `> blockquote`).
 * @param {Object<string, string>} [options.meta={}] - Key-value metadata pairs, rendered as a plain list under the summary (no heading — the spec forbids one there).
 * @param {Array<Object>} [options.sections=[]] - Content sections.
 * @param {string} options.sections[].title - Section heading.
 * @param {string} [options.sections[].description] - Section description paragraph.
 * @param {Array<Object>} [options.sections[].items] - Named items with fields.
 * @param {string} options.sections[].items[].name - Item name (rendered as `### heading`).
 * @param {Object<string, string>} [options.sections[].items[].fields] - Key-value fields for the item.
 * @param {string} [options.sections[].items[].description] - Item description.
 * @param {Array<Object>} [options.sections[].links] - Links in the section.
 * @param {string} options.sections[].links[].label - Link display text.
 * @param {string} options.sections[].links[].url - Link URL.
 * @param {string} [options.sections[].links[].description] - Link description.
 * @param {Array<Object>} [options.apis=[]] - API endpoint entries.
 * @param {string} [options.apis[].method] - HTTP method (e.g. 'GET', 'POST').
 * @param {string} options.apis[].url - API endpoint URL.
 * @param {string} [options.apis[].description] - Endpoint description.
 * @returns {string} The llms.txt file content.
 *
 * @example
 * const txt = build({
 *   name: 'Acme Store',
 *   description: 'Digital products and downloads.',
 *   sections: [
 *     {
 *       title: 'Products',
 *       links: [
 *         { label: 'Widget Pro', url: 'https://acme.com/widget-pro', description: 'Our flagship widget.' },
 *       ],
 *     },
 *   ],
 *   apis: [
 *     { method: 'GET', url: 'https://acme.com/api/products', description: 'List all products' },
 *   ],
 * });
 */
export function build(options = {}) {
  const { name, description, sections = [], apis = [], meta = {} } = options;
  const lines = [];
  if (name) lines.push("# " + name);
  if (description) lines.push("", "> " + description);
  // Metadata goes in the spec's rule-4 space — free-form markdown between the
  // summary and the file lists, headings not allowed. It was previously emitted
  // under an `## Information` heading, which made it an H2 section whose items
  // carry no hyperlink, and rule 5 requires one in every file-list item.
  if (Object.keys(meta).length > 0) {
    lines.push("");
    for (const [key, value] of Object.entries(meta)) lines.push("- " + key + ": " + value);
  }
  for (const section of sections) {
    lines.push("", "## " + section.title, "");
    if (section.description) lines.push(section.description, "");
    if (section.items) {
      for (const item of section.items) {
        lines.push("### " + item.name);
        if (item.fields) { for (const [key, value] of Object.entries(item.fields)) lines.push("- " + key + ": " + value); }
        if (item.description) lines.push("- Description: " + item.description);
        lines.push("");
      }
    }
    if (section.links) {
      for (const link of section.links) lines.push("- [" + link.label + "](" + link.url + ")" + (link.description ? ": " + link.description : ""));
    }
  }
  if (apis.length > 0) {
    lines.push("", "## API Access", "");
    for (const api of apis) {
      // Rule 5 again: the item must be a hyperlink. The method is the note
      // after the colon, which is what the `:` in the spec is for.
      const label = api.description || (api.method ? api.method + " " + api.url : api.url);
      const note = api.description && api.method ? ": " + api.method : "";
      lines.push("- [" + label + "](" + api.url + ")" + note);
    }
  }
  return lines.join("\n");
}
/**
 * Create a Response object with the correct `text/plain` content type for llms.txt.
 *
 * @param {string} content - The llms.txt content string (from {@link build}).
 * @returns {Response} A Response with `Content-Type: text/plain; charset=utf-8`.
 *
 * @example
 * // In a Hono/Workers route handler:
 * app.get('/llms.txt', (c) => {
 *   const content = build({ name: 'My Site', description: 'A great site.' });
 *   return llmsTxtResponse(content);
 * });
 */
export function llmsTxtResponse(content) {
  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
/**
 * Parse an llms.txt string back into a structured object.
 *
 * Extracts the name (`# heading`), description (`> blockquote`), and sections
 * with their items and fields.
 *
 * @param {string} text - The llms.txt file content to parse.
 * @returns {{name: string, description: string, sections: Array<{title: string, items: Array<{name: string, fields: Object<string, string>}>}>}} Parsed structure.
 *
 * @example
 * const result = parse('# My Site\n\n> A great site.\n\n## Products\n\n### Widget\n- Price: $10\n');
 * // => { name: 'My Site', description: 'A great site.', sections: [{ title: 'Products', items: [{ name: 'Widget', fields: { Price: '$10' } }] }] }
 */
export function parse(text) {
  if (!text) return { name: "", description: "", sections: [] };
  const lines = text.split("\n");
  let name = "", description = "";
  const sections = [];
  let currentSection = null, currentItem = null;
  for (const line of lines) {
    if (line.startsWith("# ") && !name) { name = line.slice(2).trim(); }
    else if (line.startsWith("> ") && !description) { description = line.slice(2).trim(); }
    else if (line.startsWith("## ")) { currentSection = { title: line.slice(3).trim(), items: [] }; sections.push(currentSection); currentItem = null; }
    else if (line.startsWith("### ") && currentSection) { currentItem = { name: line.slice(4).trim(), fields: {} }; currentSection.items.push(currentItem); }
    else if (line.startsWith("- ") && currentItem) { const content = line.slice(2); const colonIdx = content.indexOf(": "); if (colonIdx > 0) currentItem.fields[content.slice(0, colonIdx)] = content.slice(colonIdx + 2); }
  }
  return { name, description, sections };
}

/**
 * Build an `llms-full.txt` file — the full-text companion to `llms.txt`.
 *
 * `llms.txt` is an index: names, one-line descriptions and links an agent must
 * then go and fetch. `llms-full.txt` is the corpus — every document inlined, so
 * a model has the whole site in one request. Sites publish both; they answer
 * different questions.
 *
 * Shares the header shape with {@link build} (name, description, metadata), then
 * emits each document separated by a horizontal rule.
 *
 * @param {Object} [options={}] - Configuration.
 * @param {string} [options.name] - Site or project name (rendered as `# heading`).
 * @param {string} [options.description] - One-line description (rendered as `> blockquote`).
 * @param {Object<string, string>} [options.meta={}] - Key-value metadata (rendered under "## Information").
 * @param {Array<Object>} [options.documents=[]] - The documents, in order.
 * @param {string} options.documents[].title - Document title (rendered as `# heading`).
 * @param {string} [options.documents[].url] - Canonical URL, emitted as a `Source:` line.
 * @param {string} [options.documents[].description] - One-line summary, above the body.
 * @param {string} [options.documents[].content] - The document body, verbatim.
 * @returns {string} The llms-full.txt content, newline-terminated.
 *
 * @example
 * const txt = buildFull({
 *   name: 'Acme Docs',
 *   description: 'Everything about Acme.',
 *   documents: [
 *     { title: 'Getting started', url: 'https://acme.com/docs/start', content: '## Install\n\nnpm i acme' },
 *   ],
 * });
 */
export function buildFull(options = {}) {
  const { name, description, meta = {}, documents = [] } = options;

  const head = [];
  if (name) head.push("# " + name);
  if (description) head.push("", "> " + description);
  if (Object.keys(meta).length > 0) {
    head.push("", "## Information", "");
    for (const [key, value] of Object.entries(meta)) head.push("- " + key + ": " + value);
  }

  const blocks = [];
  for (const doc of documents) {
    if (!doc) continue;
    const block = [];
    if (doc.title) block.push("# " + doc.title);
    // The source URL earns its place: a model quoting this corpus can cite the
    // page it came from rather than the aggregate file.
    if (doc.url) block.push("", "Source: " + doc.url);
    if (doc.description) block.push("", doc.description);
    if (doc.content) block.push("", String(doc.content).trim());
    if (block.length) blocks.push(block.join("\n"));
  }

  const parts = [];
  if (head.length) parts.push(head.join("\n"));
  parts.push(...blocks);
  return parts.join("\n\n---\n\n") + "\n";
}
