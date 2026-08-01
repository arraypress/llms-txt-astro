/**
 * @module @arraypress/llms-txt-astro
 *
 * An idiomatic `/llms.txt` route for Astro — a thin wrapper over
 * @arraypress/llms-txt's `build()`. Same options, returned as a `Response`,
 * with the site origin resolved for you.
 *
 * ```ts
 * // src/pages/llms.txt.ts
 * import { llmsTxtRoute } from '@arraypress/llms-txt-astro';
 * import { posts } from '../data/posts';
 *
 * export const GET = llmsTxtRoute((origin) => ({
 *   name: 'My Site',
 *   description: 'What this site is, in one line.',
 *   sections: [
 *     {
 *       title: 'Writing',
 *       links: posts.map((p) => ({ label: p.title, url: `${origin}/${p.slug}` })),
 *     },
 *   ],
 * }));
 * ```
 */

import { build, llmsTxtResponse } from '@arraypress/llms-txt';
import type { APIContext, APIRoute } from 'astro';
import type { LlmsTxtRouteOptions, Origin } from './types';

export type * from './types';

/**
 * Resolve the site origin with no trailing slash.
 *
 * Prefers Astro's configured `site` (the canonical origin, and the only one
 * correct at build time for a static site); falls back to the request URL when
 * `site` is unset, so `astro dev` still emits usable absolute links instead of
 * `undefined/...`.
 *
 * @param context - The Astro API context for the request.
 * @returns The origin, e.g. `https://example.com`.
 */
export function originOf(context: APIContext): Origin {
	return (context.site?.href ?? context.url.origin).replace(/\/+$/, '');
}

/**
 * Build an Astro `GET` handler that serves `/llms.txt`.
 *
 * Pass either a literal options object, or a factory receiving the resolved
 * origin — the factory form is the usual one, since the spec wants absolute
 * URLs and the origin isn't known until the request.
 *
 * Place the file at `src/pages/llms.txt.ts`; Astro serves it at `/llms.txt` and
 * prerenders it with the rest of a static build.
 *
 * @param options - `build()` options, or a factory returning them.
 * @returns An Astro `APIRoute` serving `text/plain`.
 *
 * @example
 * // Static — no absolute URLs needed.
 * export const GET = llmsTxtRoute({ name: 'My Site', description: '…' });
 *
 * @example
 * // Factory — links need the origin.
 * export const GET = llmsTxtRoute((origin) => ({
 *   name: 'My Site',
 *   sections: [{ title: 'Docs', links: [{ label: 'Start', url: `${origin}/docs` }] }],
 * }));
 */
export function llmsTxtRoute(options: LlmsTxtRouteOptions): APIRoute {
	return async (context: APIContext) => {
		const resolved =
			typeof options === 'function' ? await options(originOf(context), context) : options;
		return llmsTxtResponse(build(resolved));
	};
}

export default llmsTxtRoute;
