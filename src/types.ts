/**
 * @module @arraypress/llms-txt-astro/types
 */
import type { APIContext } from 'astro';
import type { BuildOptions } from '@arraypress/llms-txt';

/**
 * The resolved site origin, with no trailing slash — e.g. `https://example.com`.
 *
 * Derived from Astro's configured `site`, falling back to the request URL's
 * origin when `site` is unset (`astro dev` without one, or a preview build). The
 * llms.txt spec wants absolute URLs, and hand-building them from `Astro.site` is
 * the step every site otherwise repeats.
 */
export type Origin = string;

/**
 * The route's options — either a literal `build()` options object, or a factory
 * given the resolved origin and the request context.
 *
 * Use the factory form whenever a link needs the origin (which is most of the
 * time); use the literal form for a static file with no absolute URLs.
 */
export type LlmsTxtRouteOptions =
	| BuildOptions
	| ((origin: Origin, context: APIContext) => BuildOptions | Promise<BuildOptions>);
