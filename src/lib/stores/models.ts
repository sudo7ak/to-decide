import { db } from '../db';
import type { Category, ModelDef } from '../types';

export async function listModels(): Promise<ModelDef[]> {
	return db.models.toArray();
}

export async function listModelsByCategory(category: Category): Promise<ModelDef[]> {
	return db.models.where('category').equals(category).toArray();
}

export async function getModelBySlug(slug: string): Promise<ModelDef | undefined> {
	return db.models.where('slug').equals(slug).first();
}
