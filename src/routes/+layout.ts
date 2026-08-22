import { seedModelsIfEmpty } from '$lib/db/seed';

export const ssr = false;
export const prerender = false;

export async function load() {
	await seedModelsIfEmpty();
}
