# Changelog

All notable changes to `@arraypress/llms-txt-astro` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-08-02

### Added

- `llmsTxtRoute(options)` — returns an Astro `APIRoute` serving `/llms.txt`.
  Accepts a literal `build()` options object, or a factory
  `(origin, context) => options` (sync or async) for the common case where
  links need the site origin.
- `originOf(context)` — resolves the site origin with no trailing slash,
  preferring Astro's configured `site` and falling back to the request URL's
  origin so `astro dev` emits usable absolute links rather than `undefined/…`.
