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
 * @param {Object<string, string>} [options.meta={}] - Key-value metadata pairs (rendered under "## Information").
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
  if (Object.keys(meta).length > 0) {
    lines.push("", "## Information", "");
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
    for (const api of apis) lines.push("- " + (api.description || api.method + " " + api.url) + ": " + (api.method ? api.method + " " : "") + api.url);
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
