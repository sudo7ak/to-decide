import { describe, it, expect } from 'vitest';
import { relativeTime } from './relativeTime';

describe('relativeTime', () => {
	const now = new Date('2026-08-23T12:00:00.000Z');

	it('shows "just now" for under a minute', () => {
		expect(relativeTime('2026-08-23T11:59:30.000Z', now)).toBe('just now');
	});

	it('shows minutes ago for under an hour', () => {
		expect(relativeTime('2026-08-23T11:45:00.000Z', now)).toBe('15m ago');
	});

	it('shows hours ago for under a day', () => {
		expect(relativeTime('2026-08-23T09:00:00.000Z', now)).toBe('3h ago');
	});

	it('shows days ago for under a month', () => {
		expect(relativeTime('2026-08-20T12:00:00.000Z', now)).toBe('3d ago');
	});

	it('falls back to a date for a month or more', () => {
		expect(relativeTime('2026-06-01T12:00:00.000Z', now)).toBe('Jun 1');
	});
});
