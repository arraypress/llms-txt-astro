/**
 * vitest.config.ts
 * ----------------
 *
 * Wires Vitest up with Astro's Vite plugin so `.astro` files can be
 * rendered through the official `experimental_AstroContainer` API
 * without a browser.
 */
import { getViteConfig } from 'astro/config';

export default getViteConfig({
	test: {
		include: ['test/**/*.test.ts'],
		environment: 'node',
		globals: false,
	},
});
