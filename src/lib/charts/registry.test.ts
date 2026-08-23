import { describe, it, expect } from 'vitest';
import { chartComponents } from './registry';

describe('chart registry', () => {
	it('has exactly the 6 chart components used by the seed models', () => {
		expect(Object.keys(chartComponents).sort()).toEqual(
			[
				'FlowDiagramChart',
				'MatrixTableChart',
				'NarrativeChart',
				'Quadrant2x2Chart',
				'RadarChart',
				'RankedListChart'
			].sort()
		);
	});
});
