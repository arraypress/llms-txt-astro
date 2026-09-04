# Changelog

All notable changes to `@arraypress/llms-txt-astro` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] — Unreleased

### Added

- `llmsFullTxtRoute(options)` and the `buildFull()` builder behind it — serves
  `/llms-full.txt`, the whole corpus inline rather than an index of links.
  **Note:** llmstxt.org does not specify `llms-full.txt`; the name is a de-facto
  convention popularised by documentation platforms. We follow it — llms.txt's
  header, then each document under its own H1 with a citable `Source:` line,
  separated by horizontal rules — and the tests say so rather than claiming a
  conformance that doesn't exist.
- `collectionSection(entries, options)` and `collectionDocuments(entries, options)`
  — turn `await getCollection('docs')` into llms.txt sections or llms-full.txt
  documents. Drafts excluded, `data.order` then title for a stable sort, URLs
  built from `origin` + `base` with file extensions and trailing `/index`
  stripped. Both take an override hook that receives the computed default, so
  tweaking one field doesn't mean rebuilding the whole object.
  They take entries rather than calling `getCollection` themselves: `astro:content`
  is a virtual module, so importing it here would break this package's own build.

### Fixed

- **Two llms.txt spec violations in `build()`.** [The spec](https://llmstxt.org)
  requires every item in an H2-delimited file list to be a `[name](url)`
  hyperlink, optionally followed by `:` and notes.
  - `meta` was emitted under an `## Information` heading as plain
    `- key: value` items. It now renders as a bare list under the summary —
    the spec's rule-4 space for free-form markdown, where headings aren't
    allowed. **The `## Information` heading is gone from the output.**
  - `apis` emitted `- description: METHOD url`. Items are now
    `- [description](url): METHOD`.

## [1.1.0] — Unreleased

### Added

- Re-exported the core's surface — `build`, `llmsTxtResponse`, `parse` and the
  `BuildOptions` / `LlmsTxtSection` / `LlmsTxtLink` / `LlmsTxtItem` /
  `LlmsTxtApi` / `ParsedLlmsTxt` types. A site that assembles its llms.txt
  outside `llmsTxtRoute()` no longer needs a second dependency on
  `@arraypress/llms-txt`.

## [1.0.0] — 2026-08-02

### Added

- `llmsTxtRoute(options)` — returns an Astro `APIRoute` serving `/llms.txt`.
  Accepts a literal `build()` options object, or a factory
  `(origin, context) => options` (sync or async) for the common case where
  links need the site origin.
- `originOf(context)` — resolves the site origin with no trailing slash,
  preferring Astro's configured `site` and falling back to the request URL's
  origin so `astro dev` emits usable absolute links rather than `undefined/…`.
