// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

/** The subset of Cloudflare's Rate Limiting binding this app uses. */
interface RateLimiterBinding {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface Platform {
			env: {
				GEMINI_API_KEY: string;
				/**
				 * Configured in `wrangler.jsonc`, so it exists only on the deployed
				 * Worker — optional because `vite dev` and the tests run without it.
				 */
				RATE_LIMITER?: RateLimiterBinding;
			};
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
