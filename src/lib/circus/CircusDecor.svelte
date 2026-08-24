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

	<svg class="absolute bottom-0 right-4 h-20 w-20" viewBox="0 0 32 26" xmlns="http://www.w3.org/2000/svg">
		<path d="M16 1 L8 11 L16 11 Z" fill="var(--color-accent)" />
		<path d="M16 1 L24 11 L16 11 Z" fill="var(--color-accent)" opacity="0.6" />
		<circle cx="16" cy="1.4" r="1.4" fill="var(--color-accent-moss)" />
		<path d="M16 18 L24 18 L20 11.1 Z" fill="var(--color-accent-moss)" />
		<path d="M16 18 L20 11.1 L12 11.1 Z" fill="var(--color-accent-moss)" opacity="0.7" />
		<path d="M16 18 L12 11.1 L8 18 Z" fill="var(--color-accent-moss)" opacity="0.85" />
		<path d="M16 18 L8 18 L12 24.9 Z" fill="var(--color-accent-moss)" opacity="0.55" />
		<path d="M16 18 L12 24.9 L20 24.9 Z" fill="var(--color-accent-moss)" opacity="0.75" />
		<path d="M16 18 L20 24.9 L24 18 Z" fill="var(--color-accent-moss)" opacity="0.45" />
		<path d="M11.5 13.5 L13.5 13.5 L12.5 16 Z" fill="var(--color-ink)" />
		<path d="M18.5 13.5 L20.5 13.5 L19.5 16 Z" fill="var(--color-ink)" />
		<path d="M16 16.6 L18.2 18.8 L16 21 L13.8 18.8 Z" fill="var(--color-accent)" />
	</svg>

	<svg class="circus-cycle" viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
		<polygon
			points="16,22 14.2,26.2 10,28 5.8,26.2 4,22 5.8,17.8 10,16 14.2,17.8"
			fill="none"
			stroke="var(--color-ink)"
			stroke-width="1.6"
			stroke-linejoin="round"
		/>
		<polygon
			points="44,22 42.2,26.2 38,28 33.8,26.2 32,22 33.8,17.8 38,16 42.2,17.8"
			fill="none"
			stroke="var(--color-ink)"
			stroke-width="1.6"
			stroke-linejoin="round"
		/>
		<path d="M10 22 L24 22 L19 12 Z" fill="var(--color-accent)" />
		<path d="M24 22 L29 10 L19 12 Z" fill="var(--color-accent)" opacity="0.6" />
		<path d="M24 22 L38 22 L29 10 Z" fill="var(--color-accent-moss)" opacity="0.8" />
		<circle cx="24" cy="22" r="1.6" fill="var(--color-ink)" />
	</svg>
</div>

<style>
	.circus-bunting {
		display: block;
		width: 100%;
		height: 14px;
	}

	.circus-cycle {
		position: absolute;
		bottom: 6px;
		left: -92px;
		width: 90px;
		animation: circus-roam 70s linear infinite;
	}

	@keyframes circus-roam {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(calc(100vw + 182px));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.circus-cycle {
			animation: none;
		}
	}
</style>
