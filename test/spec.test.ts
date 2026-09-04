import { describe, it, expect } from 'vitest';
import { build, buildFull, parse } from '../src/core.js';

/**
 * Conformance to the llms.txt specification at https://llmstxt.org.
 *
 * The spec defines the file as, in order:
 *   1. an optional byte-order mark
 *   2. an H1 with the project name — the only required element
 *   3. an optional blockquote with a short summary
 *   4. zero or more markdown sections of any type *except headings*
 *   5. zero or more H2-delimited "file list" sections, each a markdown list
 *      whose items are a required `[name](url)` hyperlink, then optionally a
 *      `:` and notes about the file
 *
 * Rule 5 is the one worth machine-checking: it is the only place the spec
 * makes a hard structural demand, and it is the easy one to break by emitting
 * a plain `- key: value` list under an H2.
 */
function llmsTxtViolations(text: string): string[] {
	const errors: string[] = [];
	const lines = text.replace(/^﻿/, '').split('\n');

	const firstContent = lines.findIndex((l) => l.trim() !== '');
	if (firstContent === -1 || !/^# \S/.test(lines[firstContent])) {
		errors.push('spec 2: the first content line must be an H1 project name');
	}

	const h1s = lines.filter((l) => /^# /.test(l));
	if (h1s.length > 1) errors.push(`spec 2: exactly one H1 expected, found ${h1s.length}`);

	const firstH2 = lines.findIndex((l) => /^## /.test(l));
	const quote = lines.findIndex((l) => /^> /.test(l));
	if (quote !== -1 && firstH2 !== -1 && quote > firstH2) {
		errors.push('spec 3: the blockquote summary must precede the H2 sections');
	}

	let inH2 = false;
	for (const line of lines) {
		if (/^#{1,2} /.test(line)) {
			inH2 = /^## /.test(line);
			continue;
		}
		if (!inH2 || !/^\s*[-*]\s+/.test(line)) continue;
		// Required: a markdown hyperlink. Optional: a colon and free-text notes.
		if (!/^\s*[-*]\s+\[[^\]]*\]\([^)]+\)\s*(:.*)?$/.test(line)) {
			errors.push(`spec 5: H2 list item is not a [name](url) hyperlink — ${JSON.stringify(line)}`);
		}
	}
	return errors;
}

const FULL_OPTIONS = {
	name: 'Acme',
	description: 'Everything Acme.',
	meta: { Version: '2.0.0', License: 'MIT' },
	sections: [
		{
			title: 'Docs',
			description: 'The manual.',
			links: [
				{ label: 'Start', url: 'https://acme.com/start', description: 'Begin here.' },
				{ label: 'API', url: 'https://acme.com/api' },
			],
		},
	],
	apis: [{ method: 'GET', url: 'https://acme.com/api/things', description: 'List things' }],
};

describe('llms.txt spec conformance (llmstxt.org)', () => {
	it('emits a conformant file for the full option set', () => {
		expect(llmsTxtViolations(build(FULL_OPTIONS))).toEqual([]);
	});

	it('emits a conformant file for the minimum — name only', () => {
		expect(llmsTxtViolations(build({ name: 'Acme' }))).toEqual([]);
	});

	it('emits a conformant file with metadata but no sections', () => {
		expect(llmsTxtViolations(build({ name: 'Acme', meta: { Version: '1' } }))).toEqual([]);
	});

	it('keeps the H1 first and the blockquote before any H2', () => {
		const lines = build(FULL_OPTIONS).split('\n').filter((l) => l.trim() !== '');
		expect(lines[0]).toBe('# Acme');
		expect(lines[1]).toBe('> Everything Acme.');
	});

	it('writes file-list items as [name](url) with notes after a colon', () => {
		const out = build(FULL_OPTIONS);
		expect(out).toContain('- [Start](https://acme.com/start): Begin here.');
		expect(out).toContain('- [API](https://acme.com/api)');
	});

	/* The checker has to be able to fail, or the suite above proves nothing. */
	it('the conformance checker rejects a non-conformant file', () => {
		const bad = '# Acme\n\n## Information\n\n- Version: 2.0.0\n';
		expect(llmsTxtViolations(bad)).toHaveLength(1);
		expect(llmsTxtViolations(bad)[0]).toContain('spec 5');
		expect(llmsTxtViolations('No heading here')).toContain(
			'spec 2: the first content line must be an H1 project name',
		);
	});

	it('round-trips through parse()', () => {
		const out = parse(build(FULL_OPTIONS));
		expect(out.name).toBe('Acme');
		expect(out.description).toBe('Everything Acme.');
		expect(out.sections.map((s) => s.title)).toContain('Docs');
	});
});

/**
 * `llms-full.txt` has **no specification**. llmstxt.org never mentions it; the
 * name is a de-facto convention popularised by documentation platforms
 * (Mintlify chiefly) for "the whole site concatenated into one file". These
 * tests pin the convention we follow — an llms.txt-shaped header, then each
 * document under its own H1, separated by a horizontal rule — rather than
 * claiming a conformance that does not exist to be claimed.
 */
describe('llms-full.txt convention', () => {
	const out = buildFull({
		name: 'Acme Docs',
		description: 'All of it.',
		meta: { Version: '2.0.0' },
		documents: [
			{ title: 'Start', url: 'https://acme.com/start', description: 'Begin.', content: '## Install\n\nnpm i acme' },
			{ title: 'API', content: '### get()' },
		],
	});

	it('opens with the same header shape as llms.txt', () => {
		const lines = out.split('\n').filter((l) => l.trim() !== '');
		expect(lines[0]).toBe('# Acme Docs');
		expect(lines[1]).toBe('> All of it.');
	});

	it('separates documents with a horizontal rule', () => {
		expect(out.split('\n---\n')).toHaveLength(3); // header + 2 documents
	});

	it('gives each document an H1 and a citable Source line', () => {
		expect(out).toContain('# Start');
		expect(out).toContain('Source: https://acme.com/start');
		expect(out).toContain('# API');
	});

	it('inlines the body verbatim', () => {
		expect(out).toContain('## Install\n\nnpm i acme');
		expect(out).toContain('### get()');
	});

	it('omits the Source line when a document has no url', () => {
		const one = buildFull({ documents: [{ title: 'X', content: 'y' }] });
		expect(one).not.toContain('Source:');
	});

	it('ends with a trailing newline', () => {
		expect(out.endsWith('\n')).toBe(true);
	});

	it('skips empty and null documents rather than emitting blank rules', () => {
		const sparse = buildFull({ name: 'N', documents: [null as never, {}, { title: 'Real' }] });
		expect(sparse.split('\n---\n')).toHaveLength(2); // header + the one real document
	});
});
