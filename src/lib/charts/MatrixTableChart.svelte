<script lang="ts">
	import type { MatrixTableData, MatrixPayoffCell } from '$lib/types';

	let { data }: { data: MatrixTableData } = $props();

	const rows = $derived(data.rows ?? []);
	const grid = $derived(data.payoffGrid);

	function cellFor(
		cells: MatrixPayoffCell[],
		rowChoice: string,
		colChoice: string
	): MatrixPayoffCell | undefined {
		return cells.find((c) => c.rowChoice === rowChoice && c.colChoice === colChoice);
	}
</script>

<figure class="matrix-chart">
	{#if grid}
		<p class="grid-subtitle">
			<span class="axis-tag axis-tag-row">{grid.rowPlayerLabel}</span> picks a row,
			<span class="axis-tag axis-tag-col">{grid.colPlayerLabel}</span> picks a column.
		</p>
		<div class="table-scroll">
			<table class="payoff-table">
				<caption class="sr-only">
					Payoff matrix: outcome by {grid.rowPlayerLabel}'s choice and {grid.colPlayerLabel}'s choice
				</caption>
				<thead>
					<tr>
						<th scope="col" class="corner-cell"></th>
						{#each grid.colChoices as colChoice (colChoice)}
							<th scope="col">{colChoice}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each grid.rowChoices as rowChoice (rowChoice)}
						<tr>
							<th scope="row">{rowChoice}</th>
							{#each grid.colChoices as colChoice (colChoice)}
								{@const cell = cellFor(grid.cells, rowChoice, colChoice)}
								<td class:matched={rowChoice === colChoice}>
									{cell?.outcome ?? ''}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="table-scroll">
			<table class="rows-table">
				<tbody>
					{#each rows as row (row.label)}
						<tr class="tone-{row.tone ?? 'neutral'}">
							<th scope="row">{row.label}</th>
							<td>
								{#if row.items.length > 0}
									<ul class="chip-list">
										{#each row.items as item (item)}
											<li class="chip">{item}</li>
										{/each}
									</ul>
								{:else}
									<span class="empty">No items</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
	<figcaption>{data.summary}</figcaption>
</figure>

<style>
	.matrix-chart {
		margin: 0;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.table-scroll {
		overflow-x: auto;
	}

	table {
		border-collapse: collapse;
		width: 100%;
	}

	/* --- Rows table: one real table row per category. The row header carries
	   the label; items render as chips so the reader sees actual content
	   instead of an abstracted count or bar. --- */
	.rows-table th[scope='row'] {
		text-align: left;
		vertical-align: top;
		padding: 0.625rem 0.875rem 0.625rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 700;
		white-space: nowrap;
		border-left: 3px solid var(--chart-box-stroke, #cbd5e1);
		color: var(--chart-text, #0f172a);
	}
	.rows-table tr.tone-positive th[scope='row'] {
		border-left-color: var(--chart-accent, #0f172a);
		color: var(--chart-accent, #0f172a);
	}
	.rows-table td {
		padding: 0.625rem 0.5rem;
		vertical-align: top;
	}
	.rows-table tr + tr th[scope='row'],
	.rows-table tr + tr td {
		border-top: 1px solid var(--chart-box-stroke, #e2e8f0);
	}

	.chip-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.chip {
		font-size: 0.8125rem;
		line-height: 1.35;
		color: var(--chart-text-muted, #475569);
		background: var(--chart-box-fill, #f8fafc);
		border: 1px solid var(--chart-box-stroke, #e2e8f0);
		border-radius: 999px;
		padding: 0.25rem 0.625rem;
	}
	.tone-positive .chip {
		border-color: var(--chart-accent, #0f172a);
	}
	.empty {
		font-size: 0.8125rem;
		font-style: italic;
		color: var(--chart-text-muted, #94a3b8);
	}

	/* --- Payoff matrix: a real crosstab — row player's choice x column
	   player's choice, one outcome per cell. This is the only layout that
	   can show a Prisoner's-Dilemma-style game honestly: mutual cooperation,
	   mutual defection, and both one-sided outcomes, all at once. --- */
	.grid-subtitle {
		margin: 0 0 0.625rem;
		font-size: 0.8125rem;
		color: var(--chart-text-muted, #64748b);
	}
	.axis-tag {
		font-weight: 700;
		color: var(--chart-text, #0f172a);
	}

	.payoff-table th,
	.payoff-table td {
		border: 1px solid var(--chart-box-stroke, #e2e8f0);
		padding: 0.625rem 0.75rem;
		text-align: left;
		vertical-align: top;
	}
	.payoff-table thead th {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--chart-text, #0f172a);
		background: var(--chart-box-fill, #f8fafc);
	}
	.payoff-table .corner-cell {
		background: var(--chart-box-fill, #f8fafc);
	}
	.payoff-table tbody th[scope='row'] {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--chart-text, #0f172a);
		background: var(--chart-box-fill, #f8fafc);
		white-space: nowrap;
	}
	.payoff-table td {
		font-size: 0.8125rem;
		line-height: 1.4;
		color: var(--chart-text-muted, #475569);
	}
	/* The diagonal — both sides make the same choice — is the symmetric
	   outcome a payoff matrix is built to highlight. */
	.payoff-table td.matched {
		border-left: 3px solid var(--chart-accent, #0f172a);
	}

	figcaption {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--chart-text-muted, #64748b);
	}
</style>
