# @arraypress/llms-txt-astro

An idiomatic `/llms.txt` route for Astro, plus the `build()` generator behind it. Returns a `Response`, with the site origin resolved for you.

## Install

```bash
npm install @arraypress/llms-txt-astro
```

## Usage

Drop a file at `src/pages/llms.txt.ts`. Astro serves it at `/llms.txt` and prerenders it with the rest of a static build.

```ts
import { llmsTxtRoute } from '@arraypress/llms-txt-astro';
import { posts } from '../data/posts';

export const GET = llmsTxtRoute((origin) => ({
  name: 'My Site',
  description: 'What this site is, in one line.',
  sections: [
    {
      title: 'Writing',
      links: posts.map((p) => ({ label: p.title, url: `${origin}/${p.slug}` })),
    },
  ],
}));
```

For a file with no absolute URLs, pass the options directly:

```ts
export const GET = llmsTxtRoute({ name: 'My Site', description: 'One line.' });
```

## API

### `llmsTxtRoute(options)`

Returns an Astro `APIRoute` serving `text/plain`.

`options` is either a [`build()`](https://www.npmjs.com/package/@arraypress/llms-txt) options object, or a factory `(origin, context) => options` — sync or async. The factory form is the usual one, since the spec wants absolute URLs and the origin isn't known until the request.

### `originOf(context)`

The resolved origin, no trailing slash. Prefers Astro's configured `site`; falls back to the request URL's origin when `site` is unset, so `astro dev` emits usable links instead of `undefined/…`. Exported because a page occasionally needs the same value.

## Content collections

`collectionSection()` turns a collection into a section of links, and
`collectionDocuments()` turns it into full-text documents. Both take the
entries — you call `getCollection` yourself, because `astro:content` is a
virtual module this package can't import without breaking its own build.

```ts
// src/pages/llms.txt.ts
import { llmsTxtRoute, collectionSection } from '@arraypress/llms-txt-astro';
import { getCollection } from 'astro:content';

export const GET = llmsTxtRoute(async (origin) => ({
  name: 'Acme',
  description: 'One line about Acme.',
  sections: [
    collectionSection(await getCollection('docs'), { title: 'Docs', origin, base: '/docs' }),
  ],
}));
```

Drafts (`data.draft === true`) are dropped, entries sort by `data.order` then
title, and URLs lose their file extension and any trailing `/index`. Pass
`filter`, `sort`, or a `link` / `document` override to change any of it — the
override receives the computed default, so you can spread it and adjust one
field.

## /llms-full.txt

`llms.txt` is an index — an agent still has to fetch every link. `llms-full.txt`
is the corpus, and both are worth publishing:

```ts
// src/pages/llms-full.txt.ts
import { llmsFullTxtRoute, collectionDocuments } from '@arraypress/llms-txt-astro';
import { getCollection } from 'astro:content';

export const GET = llmsFullTxtRoute(async (origin) => ({
  name: 'Acme',
  documents: collectionDocuments(await getCollection('docs'), { origin, base: '/docs' }),
}));
```

**On the format:** [llmstxt.org](https://llmstxt.org) specifies `llms.txt` and
says nothing about `llms-full.txt` — the name is a de-facto convention from
documentation platforms. This package follows it (llms.txt's header, then each
document under its own H1 with a `Source:` line, separated by `---`), but
there's no standard to conform to, and the tests are honest about that. The
`llms.txt` output *is* checked against the real spec.

## Why a separate package?

`@arraypress/llms-txt` is zero-dependency and runs anywhere. This package adds the two things every Astro site otherwise reimplements — resolving `Astro.site` down to a bare origin, and wrapping the result in a `Response` — without pulling Astro into the core library.

## License

MIT
