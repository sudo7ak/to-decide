import Dexie, { type Table } from 'dexie';
import type { ModelDef, Question, Analysis } from './types';

export class DecisionCopilotDB extends Dexie {
	models!: Table<ModelDef, string>;
	questions!: Table<Question, string>;
	analyses!: Table<Analysis, string>;

	constructor() {
		super('decision-copilot');
		this.version(1).stores({
			models: 'id, slug, category',
			questions: 'id, createdAt',
			analyses: 'id, questionId, modelId'
		});
	}
}

export const db = new DecisionCopilotDB();
