import { db } from '../db';
import type { Analysis } from '../types';

export async function createAnalysis(
	questionId: string,
	modelId: string,
	resultJson: Record<string, unknown>
): Promise<Analysis> {
	const now = new Date().toISOString();
	const analysis: Analysis = {
		id: crypto.randomUUID(),
		questionId,
		modelId,
		resultJson,
		createdAt: now,
		updatedAt: now,
		syncedAt: null
	};
	await db.analyses.add(analysis);
	return analysis;
}

export async function listAnalysesForQuestion(questionId: string): Promise<Analysis[]> {
	return db.analyses.where('questionId').equals(questionId).toArray();
}

export async function listAnalysesForQuestionAndModel(
	questionId: string,
	modelId: string
): Promise<Analysis[]> {
	const forQuestion = await db.analyses.where('questionId').equals(questionId).toArray();
	return forQuestion
		.filter((a) => a.modelId === modelId)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
