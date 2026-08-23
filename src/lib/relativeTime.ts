const MONTH_NAMES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

export function relativeTime(iso: string, now: Date = new Date()): string {
	const then = new Date(iso);
	const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

	if (seconds < 60) return 'just now';

	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;

	return `${MONTH_NAMES[then.getUTCMonth()]} ${then.getUTCDate()}`;
}
