import { describe, it, expect } from 'vitest';
import type { APIContext } from 'astro';
import {
	collectionDocuments,
	collectionSection,
	llmsFullTxtRoute,
} from '../src/index';
import type { ContentEntryLike } from '../src/types';

/** Minimal APIContext stand-in — the routes only read `site` and `url`. */
function ctx(url: string, site?: string): APIContext {
	return {
		url: new URL(url),
		site: site ? new URL(site) : undefined,
	} as unknown as APIContext;
}

const entry = (id: string, data: ContentEntryLike['data'] = {}, body?: string): ContentEntryLike => ({
	id,
	collection: 'docs',
	data,
	...(body === undefined ? {} : { body }),
});

const docs: ContentEntryLike[] = [
	entry('getting-started', { title: 'Getting started', description: 'Begin here.', order: 1 }, '## Install\n\nnpm i acme'),
	entry('api-reference', { title: 'API reference', order: 2 }, '### get()'),
	entry('secret', { title: 'Secret', draft: true }, 'shh'),
];

describe('collectionSection', () => {
	it('maps entries to spec-shaped links', () => {
		const section = collectionSection(docs, {
			title: 'Docs',
			origin: 'https://acme.com',
			base: '/docs',
		});
		expect(section.title).toBe('Docs');
		expect(section.links).toEqual([
			{
				label: 'Getting started',
				url: 'https://acme.com/docs/getting-started',
				description: 'Begin here.',
			},
			{ label: 'API reference', url: 'https://acme.com/docs/api-reference' },
		]);
	});

	it('excludes drafts by default', () => {
		const section = collectionSection(docs, { title: 'Docs' });
		expect(section.links?.map((l) => l.label)).not.toContain('Secret');
	});

	it('honours an explicit filter over the draft default', () => {
		const section = collectionSection(docs, { title: 'Docs', filter: () => true });
		expect(section.links).toHaveLength(3);
	});

	it('sorts by order, then title', () => {
		const unordered = [
			entry('c', { title: 'C' }),
			entry('a', { title: 'A' }),
			entry('first', { title: 'Zzz', order: 1 }),
		];
		const section = collectionSection(unordered, { title: 'S' });
		expect(section.links?.map((l) => l.label)).toEqual(['Zzz', 'A', 'C']);
	});

	it('takes a custom sort', () => {
		const section = collectionSection(docs, {
			title: 'Docs',
			sort: (a, b) => (a.data?.title ?? '').localeCompare(b.data?.title ?? ''),
		});
		expect(section.links?.[0].label).toBe('API reference');
	});

	it('does not mutate the array it is given', () => {
		const input = [entry('b', { title: 'B' }), entry('a', { title: 'A' })];
		const before = input.map((e) => e.id);
		collectionSection(input, { title: 'S' });
		expect(input.map((e) => e.id)).toEqual(before);
	});

	it('strips file extensions and a trailing /index from the URL', () => {
		const section = collectionSection(
			[entry('guide/intro.md', { title: 'Intro' }), entry('guide/index', { title: 'Guide' })],
			{ title: 'S', origin: 'https://acme.com', base: '/docs' },
		);
		// Default sort is by title, so 'Guide' (guide/index) precedes 'Intro'.
		expect(section.links?.map((l) => l.url)).toEqual([
			'https://acme.com/docs/guide',
			'https://acme.com/docs/guide/intro',
		]);
	});

	it('prefers a legacy slug over the id', () => {
		const legacy: ContentEntryLike = { id: 'src/pages/x.md', slug: 'x', data: { title: 'X' } };
		const section = collectionSection([legacy], { title: 'S', origin: 'https://acme.com' });
		expect(section.links?.[0].url).toBe('https://acme.com/x');
	});

	it('falls back to the slug when there is no title', () => {
		const section = collectionSection([entry('no-title')], { title: 'S' });
		expect(section.links?.[0].label).toBe('no-title');
	});

	it('gives the link override the computed defaults to build on', () => {
		const section = collectionSection(docs, {
			title: 'Docs',
			origin: 'https://acme.com',
			link: (e, d) => ({ ...d, label: `${d.label} [${e.id}]` }),
		});
		expect(section.links?.[0].label).toBe('Getting started [getting-started]');
		expect(section.links?.[0].url).toBe('https://acme.com/getting-started');
	});

	it('adds the section description only when given one', () => {
		expect(collectionSection(docs, { title: 'D' }).description).toBeUndefined();
		expect(collectionSection(docs, { title: 'D', description: 'x' }).description).toBe('x');
	});
});

describe('collectionDocuments', () => {
	it('inlines the raw body and keeps a citable URL', () => {
		const out = collectionDocuments(docs, { origin: 'https://acme.com', base: '/docs' });
		expect(out).toEqual([
			{
				title: 'Getting started',
				url: 'https://acme.com/docs/getting-started',
				description: 'Begin here.',
				content: '## Install\n\nnpm i acme',
			},
			{
				title: 'API reference',
				url: 'https://acme.com/docs/api-reference',
				content: '### get()',
			},
		]);
	});

	it('excludes drafts by default', () => {
		expect(collectionDocuments(docs).map((d) => d.title)).not.toContain('Secret');
	});

	it('omits content for an entry with no body', () => {
		const out = collectionDocuments([entry('x', { title: 'X' })]);
		expect(out[0].content).toBeUndefined();
	});

	it('gives the document override the computed defaults', () => {
		const out = collectionDocuments(docs, {
			document: (e, d) => ({ ...d, title: `${d.title} (${e.collection})` }),
		});
		expect(out[0].title).toBe('Getting started (docs)');
	});
});

describe('llmsFullTxtRoute', () => {
	it('serves the corpus as text/plain', async () => {
		const route = llmsFullTxtRoute({
			name: 'Acme Docs',
			documents: [{ title: 'Start', content: 'go' }],
		});
		const res = (await route(ctx('https://acme.com/llms-full.txt') as never)) as Response;
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toContain('text/plain');
		const body = await res.text();
		expect(body).toContain('# Acme Docs');
		expect(body).toContain('# Start');
		expect(body).toContain('go');
	});

	it('passes the resolved origin to the factory form', async () => {
		const route = llmsFullTxtRoute((origin) => ({
			name: 'Acme',
			documents: collectionDocuments(docs, { origin, base: '/docs' }),
		}));
		const res = (await route(
			ctx('http://localhost:4321/llms-full.txt', 'https://acme.com') as never,
		)) as Response;
		const body = await res.text();
		expect(body).toContain('Source: https://acme.com/docs/getting-started');
		expect(body).not.toContain('localhost');
	});

	it('awaits an async factory', async () => {
		const route = llmsFullTxtRoute(async () => ({ name: 'Async', documents: [{ title: 'A' }] }));
		const res = (await route(ctx('https://acme.com/llms-full.txt') as never)) as Response;
		expect(await res.text()).toContain('# Async');
	});

	/* The two files answer different questions and must not be interchangeable:
	 * llms.txt is an index of links, llms-full.txt is the corpus itself. */
	it('emits the bodies that llms.txt only links to', async () => {
		const full = llmsFullTxtRoute({ documents: collectionDocuments(docs) });
		const body = await ((await full(ctx('https://acme.com/llms-full.txt') as never)) as Response).text();
		expect(body).toContain('npm i acme');
	});
});
