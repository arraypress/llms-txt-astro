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

## Why a separate package?

`@arraypress/llms-txt` is zero-dependency and runs anywhere. This package adds the two things every Astro site otherwise reimplements — resolving `Astro.site` down to a bare origin, and wrapping the result in a `Response` — without pulling Astro into the core library.

## License

MIT
