import seedModels from '../db/seed-models.json';
import type { ModelDef } from '../types';

/**
 * The model catalog, server-side.
 *
 * `seed-models.json` is the single source of truth for both the client (which
 * seeds it into IndexedDB so the app works offline) and the server. The server
 * reads it directly so that a request only ever names a model by slug — the
 * prompt template and the output JSON Schema are never taken from the client,
 * which would turn the analyze route into an open proxy to the LLM.
 */
const models = seedModels as ModelDef[];

const bySlug = new Map(models.map((model) => [model.slug, model]));

export interface CatalogEntry {
	slug: string;
	name: string;
	description: string;
}

export function getModelBySlug(slug: string): ModelDef | undefined {
	return bySlug.get(slug);
}

/** The slug/name/description triples used to prompt for model recommendations. */
export function listCatalogEntries(): CatalogEntry[] {
	return models.map(({ slug, name, description }) => ({ slug, name, description }));
}
