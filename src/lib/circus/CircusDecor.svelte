<svg
	class="circus-bunting no-print"
	viewBox="0 0 1600 14"
	preserveAspectRatio="none"
	aria-hidden="true"
>
	<defs>
		<pattern id="circus-bunting-pattern" width="16" height="14" patternUnits="userSpaceOnUse">
			<line x1="0" y1="1" x2="16" y2="1" stroke="var(--color-border)" stroke-width="1" />
			<path d="M1 1.5 L5 10.5 L9 1.5 Z" fill="var(--color-accent)" opacity="0.55" />
			<path d="M9 1.5 L13 10.5 L17 1.5 Z" fill="var(--color-accent-moss)" opacity="0.55" />
		</pattern>
	</defs>
	<rect width="1600" height="14" fill="url(#circus-bunting-pattern)" />
</svg>

<div class="no-print pointer-events-none fixed inset-x-0 bottom-0 z-0 hidden md:block" aria-hidden="true">
	<svg class="absolute bottom-0 left-4 h-24 w-24" viewBox="0 0 40 38" xmlns="http://www.w3.org/2000/svg">
		<path d="M20 6 L4 33 L20 33 Z" fill="var(--color-accent)" />
		<path d="M20 6 L36 33 L20 33 Z" fill="var(--color-accent)" opacity="0.6" />
		<path d="M15 33 L20 21 L25 33 Z" fill="var(--color-ink)" opacity="0.18" />
		<path d="M4 33 L36 33 L20 37 Z" fill="var(--color-border)" opacity="0.7" />
		<path d="M20 6 L20 1" stroke="var(--color-ink)" stroke-width="1.2" stroke-linecap="round" />
		<path d="M20 1 L27 3.2 L20 5.8 Z" fill="var(--color-accent-moss)" />
	</svg>
</div>

<style>
	.circus-bunting {
		display: block;
		width: 100%;
		height: 14px;
	}
</style>
