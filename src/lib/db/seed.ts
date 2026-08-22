import { db } from '../db';
import type { ModelDef } from '../types';
import seedModels from './seed-models.json';

export async function syncSeedModels(): Promise<void> {
	await db.models.bulkPut(seedModels as ModelDef[]);
}
