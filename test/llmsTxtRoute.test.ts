import { describe, it, expect } from 'vitest';
import type { APIContext } from 'astro';
import { llmsTxtRoute, originOf } from '../src/index';

/** Minimal APIContext stand-in — the route only reads `site` and `url`. */
function ctx(url: string, site?: string): APIContext {
	return {
		url: new URL(url),
		site: site ? new URL(site) : undefined,
	} as unknown as APIContext;
}

async function text(route: ReturnType<typeof llmsTxtRoute>, c: APIContext): Promise<string> {
	const res = await route(c as never);
	return (res as Response).text();
}

describe('originOf', () => {
	it('prefers the configured site', () => {
		expect(originOf(ctx('http://localhost:4321/llms.txt', 'https://example.com'))).toBe(
			'https://example.com',
		);
	});

	it('falls back to the request origin when site is unset', () => {
		expect(originOf(ctx('http://localhost:4321/llms.txt'))).toBe('http://localhost:4321');
	});

	it('strips the trailing slash Astro.site carries', () => {
		expect(originOf(ctx('http://x/llms.txt', 'https://example.com/'))).toBe('https://example.com');
	});
});

describe('llmsTxtRoute', () => {
	it('serves the built file as text/plain', async () => {
		const route = llmsTxtRoute({ name: 'My Site', description: 'One line.' });
		const res = (await route(ctx('https://example.com/llms.txt') as never)) as Response;
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toContain('text/plain');
		const body = await res.text();
		expect(body).toContain('# My Site');
		expect(body).toContain('> One line.');
	});

	it('passes the resolved origin to the factory form', async () => {
		const route = llmsTxtRoute((origin) => ({
			name: 'My Site',
			sections: [{ title: 'Docs', links: [{ label: 'Start', url: `${origin}/docs` }] }],
		}));
		const body = await text(route, ctx('http://localhost:4321/llms.txt', 'https://example.com'));
		expect(body).toContain('https://example.com/docs');
		expect(body).not.toContain('localhost');
	});

	it('awaits an async factory', async () => {
		const route = llmsTxtRoute(async (origin) => ({
			name: 'Async',
			sections: [{ title: 'S', links: [{ label: 'L', url: `${origin}/l` }] }],
		}));
		const body = await text(route, ctx('https://example.com/llms.txt', 'https://example.com'));
		expect(body).toContain('https://example.com/l');
	});

	it('gives the factory the context, for locale or params', async () => {
		const route = llmsTxtRoute((_origin, c) => ({
			name: c.url.searchParams.get('n') ?? 'Fallback',
		}));
		const body = await text(route, ctx('https://example.com/llms.txt?n=FromContext'));
		expect(body).toContain('# FromContext');
	});
});
