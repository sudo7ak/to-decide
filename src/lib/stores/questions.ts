import { db } from '../db';
import type { Question } from '../types';

export async function createQuestion(text: string): Promise<Question> {
	const trimmed = text.trim();
	if (!trimmed) {
		throw new Error('Question text cannot be empty');
	}
	const question: Question = {
		id: crypto.randomUUID(),
		text: trimmed,
		createdAt: new Date().toISOString()
	};
	await db.questions.add(question);
	return question;
}

export async function listQuestions(): Promise<Question[]> {
	const all = await db.questions.toArray();
	return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getQuestion(id: string): Promise<Question | undefined> {
	return db.questions.get(id);
}

export async function setRecommendedModels(
	questionId: string,
	modelIds: string[]
): Promise<void> {
	await db.questions.update(questionId, { recommendedModelIds: modelIds });
}
