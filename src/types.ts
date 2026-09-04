/**
 * @module @arraypress/llms-txt-astro/types
 */
import type { APIContext } from 'astro';
import type { BuildFullOptions, BuildOptions, LlmsFullDocument, LlmsTxtLink } from './core.js';

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

/**
 * A content-collection entry, described structurally rather than imported.
 *
 * `astro:content` is a virtual module that only exists inside a project with a
 * content config, so a published package can't import `CollectionEntry` without
 * breaking its own build. Astro's real entries satisfy this shape, so
 * `await getCollection('docs')` passes straight in and stays typed.
 */
export interface ContentEntryLike {
	id: string;
	/** Legacy pre-Astro-5 entries. Preferred over `id` when present. */
	slug?: string;
	/** Raw Markdown body — what `llms-full.txt` inlines. */
	body?: string;
	collection?: string;
	data?: Record<string, unknown> & {
		title?: string;
		description?: string;
		draft?: boolean;
		order?: number;
	};
}

/** Shared mapping controls for the two collection helpers. */
export interface CollectionMapOptions<T extends ContentEntryLike = ContentEntryLike> {
	/** Site origin, no trailing slash — from `originOf(context)`. */
	origin?: string;
	/** Path prefix the collection is served under, e.g. `'/docs'`. */
	base?: string;
	/** Which entries to include. Defaults to dropping `data.draft === true`. */
	filter?: (entry: T) => boolean;
	/** Order. Defaults to `data.order` ascending, then title, then slug. */
	sort?: (a: T, b: T) => number;
}

/** Options for {@link collectionSection}. */
export interface CollectionSectionOptions<T extends ContentEntryLike = ContentEntryLike>
	extends CollectionMapOptions<T> {
	/** Section heading. */
	title: string;
	/** Optional paragraph under the heading. */
	description?: string;
	/** Rewrite a generated link. Receives the entry and the computed default. */
	link?: (entry: T, defaults: LlmsTxtLink) => LlmsTxtLink;
}

/** Options for {@link collectionDocuments}. */
export interface CollectionDocumentsOptions<T extends ContentEntryLike = ContentEntryLike>
	extends CollectionMapOptions<T> {
	/** Rewrite a generated document. Receives the entry and the computed default. */
	document?: (entry: T, defaults: LlmsFullDocument) => LlmsFullDocument;
}

/**
 * The full-text route's options — a literal `buildFull()` options object, or a
 * factory given the resolved origin and the request context.
 */
export type LlmsFullTxtRouteOptions =
	| BuildFullOptions
	| ((origin: Origin, context: APIContext) => BuildFullOptions | Promise<BuildFullOptions>);
