<script lang="ts">
	import { onMount } from 'svelte';
	import { parseIntlFile } from '$lib/parser';

	import { _err, _log } from '$lib/log';
	import TranslateDashboard from '$lib/components/TranslateDashboard.svelte';
	import { db, deleteDatabase, findInDb, initializeDb, status } from '$lib/indexeddb';

	import type { IntlObject } from '$lib/types';
	import { mapStatusToMessage } from '$lib/consts';

	let inputFiles: FileList | null = null;

	$: intlFile = inputFiles?.item(0);
	$: projectFile = parseIntlFile(intlFile);

	$: statusMessage = mapStatusToMessage.find((stm) => stm.status === $status)?.message;

	onMount(() => {
		status.subscribe((value) => {
			if (value === 'first-run') {
				projectFile = new Promise<IntlObject[] | undefined>((res, _) => findInDb($db, res));
			}
		});

		initializeDb();
	});
</script>

<main>
	<header>
		<h1>Rejuv i18n Companion App</h1>
	</header>
	<section>
		{#await projectFile}
			Waiting for file input or DB read to fulfill...
		{:then output}
			{#if output}
				<TranslateDashboard intl={output} />
			{:else}
				<label for="file-input"
					>Choose a brand new intl.txt file to start a new dahsboard, or open any intl.json
					in-progress work to continue.</label
				>
				<input name="file-input" type="file" bind:files={inputFiles} />
			{/if}
		{:catch error}
			<p style="color: red; font-weight: bold">{error}</p>
		{/await}
	</section>
	<footer>
		<button class="footer-action" on:click={() => deleteDatabase($db)}
			>Delete browser's database</button
		>
		<span class="status {$status}">[STATUS] - {statusMessage}</span>
		@Kyuu
	</footer>
</main>

<style>
	main {
		display: grid;
		grid-template: 5svh 90svh 5svh / 100%;
	}

	header {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--bg-1);
	}

	section {
		background-color: var(--bg-3);
	}

	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-inline: 1rem;
		background-color: var(--bg-1);

		font-weight: bolder;
	}

	.idle,
	.first-run {
		display: none;
	}

	.saving {
		color: green;
	}

	.success {
		color: gold;
	}

	.first-run,
	.idle {
		display: none;
	}

	.saving-db,
	.saving-json,
	.saving-final {
		color: orangered;
	}

	.saved,
	.deleted {
		color: limegreen;
	}

	.deleting-db {
		color: orange;
	}

	.error {
		color: red;
	}
</style>
