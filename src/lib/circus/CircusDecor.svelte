<div class="circus-bunting no-print" aria-hidden="true"></div>

<div class="no-print pointer-events-none fixed inset-x-0 bottom-0 z-0 hidden md:block" aria-hidden="true">
	<svg
		class="absolute bottom-2 left-4 h-14 w-14 text-accent/70"
		viewBox="0 0 64 56"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<line x1="32" y1="2" x2="32" y2="12" stroke="currentColor" stroke-width="1.5" />
		<path d="M32 2 L40 5 L32 8 Z" fill="currentColor" />
		<path
			d="M32 10 L58 50 H6 Z"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linejoin="round"
		/>
		<path d="M32 10 L20 50" stroke="currentColor" stroke-width="1.5" opacity="0.5" />
		<path d="M32 10 L44 50" stroke="currentColor" stroke-width="1.5" opacity="0.5" />
		<path d="M26 50 L32 30 L38 50" fill="none" stroke="currentColor" stroke-width="1.5" />
		<line x1="4" y1="50" x2="60" y2="50" stroke="currentColor" stroke-width="2" />
	</svg>

	<svg
		class="circus-clown absolute bottom-2 right-4 h-12 w-12 text-accent-moss/80"
		viewBox="0 0 48 48"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M24 2 L34 16 H14 Z"
			fill="currentColor"
			fill-opacity="0.15"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linejoin="round"
		/>
		<circle cx="24" cy="2" r="2" fill="currentColor" />
		<circle cx="24" cy="26" r="14" fill="none" stroke="currentColor" stroke-width="1.5" />
		<circle cx="19" cy="24" r="1.4" fill="currentColor" />
		<circle cx="29" cy="24" r="1.4" fill="currentColor" />
		<circle class="circus-clown-nose" cx="24" cy="29" r="3" />
		<path
			d="M17 32 Q24 38 31 32"
			stroke="currentColor"
			stroke-width="1.5"
			fill="none"
			stroke-linecap="round"
		/>
	</svg>

	<svg
		class="circus-cycle text-ink/70"
		viewBox="0 0 64 40"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<circle cx="14" cy="32" r="7" stroke="currentColor" stroke-width="1.6" />
		<circle cx="50" cy="32" r="7" stroke="currentColor" stroke-width="1.6" />
		<path
			d="M14 32 L28 14 H40 L50 32 M28 14 L22 32 M28 14 L34 22 L50 32 M34 22 L26 22"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
		<line x1="34" y1="22" x2="34" y2="10" stroke="currentColor" stroke-width="1.6" />
		<circle cx="34" cy="6" r="3" fill="currentColor" />
		<path
			d="M34 9 L30 18 M34 9 L38 16"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
		/>
	</svg>
</div>

<style>
	.circus-bunting {
		height: 14px;
		background: linear-gradient(-45deg, transparent 7px, var(--color-accent) 7px) 0 0 / 14px 14px
			repeat-x;
		opacity: 0.35;
	}

	.circus-clown-nose {
		fill: var(--color-accent);
	}

	.circus-clown {
		animation: circus-bounce 2.4s ease-in-out infinite;
	}

	@keyframes circus-bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.circus-cycle {
		position: absolute;
		bottom: 8px;
		left: -60px;
		width: 56px;
		animation: circus-roam 40s linear infinite;
	}

	@keyframes circus-roam {
		0% {
			transform: translateX(0);
			opacity: 0;
		}
		5% {
			opacity: 1;
		}
		45% {
			transform: translateX(calc(100vw + 60px));
			opacity: 1;
		}
		50% {
			transform: translateX(calc(100vw + 60px));
			opacity: 0;
		}
		100% {
			transform: translateX(calc(100vw + 60px));
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.circus-clown,
		.circus-cycle {
			animation: none;
		}
	}
</style>
