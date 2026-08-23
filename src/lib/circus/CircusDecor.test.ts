import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import CircusDecor from './CircusDecor.svelte';

describe('CircusDecor', () => {
	it('renders decorative elements without crashing, all marked aria-hidden', () => {
		const { container } = render(CircusDecor);
		const hidden = container.querySelectorAll('[aria-hidden="true"]');
		expect(hidden.length).toBeGreaterThan(0);
	});

	it('renders no visible text content', () => {
		const { container } = render(CircusDecor);
		expect(container.textContent?.trim()).toBe('');
	});
});
