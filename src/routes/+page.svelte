<script lang="ts">
	import TranslateDashboard from '$lib/components/TranslateDashboard.svelte';
	import { parseIntlFile } from '$lib/parser';

	let inputFiles: FileList | null = null;

	$: intlFile = inputFiles?.item(0);
	$: projectFile = parseIntlFile(intlFile);
</script>

<main>
	<header>
		<h1>RPG MAKER i18n App</h1>
	</header>
	<section>
		{#if !intlFile}
			<label for="file-input"
				>Choose a brand new intl.txt file to start a new dahsboard, or open any intl.json
				in-progress work to continue.</label
			>
			<input name="file-input" type="file" bind:files={inputFiles} />
		{:else}
			{#await projectFile}
				Processing...
			{:then output}
				{#if output}
					<TranslateDashboard intl={output} />
				{/if}
			{:catch error}
				<p style="color: red; font-weight: bold">{error}</p>
			{/await}
		{/if}
	</section>
	<footer>@Kyuu</footer>
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
		justify-content: end;
		padding-inline: 1rem;
		background-color: var(--bg-1);
	}
</style>
