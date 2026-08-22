import { db } from '../db';
import type { ModelDef } from '../types';
import seedModels from './seed-models.json';

export async function seedModelsIfEmpty(): Promise<void> {
	const count = await db.models.count();
	if (count > 0) return;
	await db.models.bulkAdd(seedModels as ModelDef[]);
}
