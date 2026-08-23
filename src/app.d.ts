// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface Platform {
			env: {
				GEMINI_API_KEY: string;
			};
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
