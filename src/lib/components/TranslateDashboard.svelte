<script lang="ts">
	import type { IntlCharacter, IntlLine, IntlObject } from '$lib/parser';

	export let intl: IntlObject[];

	let currentTab: string = intl[0].name;
	let currentChar: string = intl[0].characters[0].name;
	let currentLang: string = 'fr';

	const getFileName = (lang: string, time = new Date()) =>
		`INTL_Rejuvenation-${time.getDate()}${time.getMonth()}${time.getFullYear()}_${lang}`;

	const saveDraft = () => {
		const file = new Blob([JSON.stringify(intl)], { type: 'json' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(file);
		link.href = url;
		link.download = getFileName(currentLang) + '.json';
		document.body.append(link);
		link.click();
		document.body.removeChild(link);
	};

	const saveTranslation = (newValue: string, line: IntlLine) => {
		const mapIndex = intl.findIndex((map) => map.name === currentTab);
		const charIndex = intl[mapIndex].characters.findIndex((char) => char.name === currentChar);
		const lineIndex = intl[mapIndex].characters[charIndex].lines.findIndex((l) => l.id === line.id);
		intl[mapIndex].characters[charIndex].lines[lineIndex].translation = newValue;
		intl = [...intl];
	};

	$: tabs = intl.map((map) => map.name);
	$: chars = intl.find((map) => map.name === currentTab)?.characters ?? [];
	$: lines = intl
		.find((map) => map.name === currentTab)
		?.characters.find((char) => char.name === currentChar)?.lines;

	$: allTranslations = intl.flatMap((maps) =>
		maps.characters.flatMap((chars) => chars.lines.map((line) => line.translation))
	);

	$: totalCompletion = (
		(allTranslations.filter((x) => x).length / allTranslations.length) *
		100
	).toFixed(1);
</script>

<div id="dashboard">
	<header>
		{#each tabs as tab (tab)}
			<button
				class="header-button"
				class:selected={currentTab === tab}
				on:click={() => (currentTab = tab)}>{tab}</button
			>
		{/each}
	</header>
	<aside>
		{#each chars as char (char.name)}
			<button
				class="aside-button"
				class:completed={char.lines.filter((x) => x.translation).length / char.lines.length === 1}
				class:selected={currentChar === char.name}
				on:click={() => (currentChar = char.name)}
			>
				{char.name}
				<span>
					{((char.lines.filter((x) => x.translation).length / char.lines.length) * 100).toFixed(1)}%
				</span>
			</button>
		{/each}
	</aside>
	<div id="lines">
		{#if lines && lines.length > 0}
			{#each lines as line (line.id)}
				<label for={`${line.id}`}>{line.text}</label>
				<input
					name={`${line.id}`}
					bind:value={line.translation}
					on:focusout={(event) => saveTranslation(event.currentTarget.value, line)}
				/>
			{/each}
		{/if}
	</div>
	<footer>
		<span>
			Total Completion: {totalCompletion}%
		</span>
		<span>
			<button class="debug" on:click={() => console.log(intl)}>[debug] print INTL</button>
			<button class="selected" on:click={() => saveDraft()}>Save Draft ({currentLang}.json)</button>
			<button class="selected" on:click={() => saveDraft()}
				>Compile texts ({currentLang}.txt)</button
			>
		</span>
	</footer>
</div>

<style>
	#dashboard {
		display: grid;
		grid-template: 'header header' 5% 'aside div' 88% 'aside footer' auto / 15svw 85svw;

		height: 100%;
	}

	button {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		appearance: none;
		border: 0;
		background-color: transparent;
		color: white;
		border-radius: 1rem;
		padding: 0.75rem 1.5rem;

		&:hover {
			cursor: pointer;
			color: black;
			background-color: hsl(249, 95%, 68%);
		}

		&.selected {
			background-color: hsl(249, 95%, 68%);
		}

		&.completed {
			background-color: green;
		}

		&.debug {
			background-color: purple;
		}
	}

	button.aside-button {
		justify-content: space-between;
		padding-inline: 0.5rem;
	}

	header,
	aside {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	header {
		grid-area: header;
		overflow-x: auto;
		background-color: var(--bg-2);
	}

	aside {
		grid-area: aside;
		flex-direction: column;
		overflow-y: auto;
		background-color: var(--bg-3);
	}

	#lines {
		grid-area: div;
		border-radius: 1rem;
		background-color: var(--bg-4);

		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-auto-flow: row;
		grid-auto-rows: max-content;
		align-items: center;
		row-gap: 2rem;
		column-gap: 1rem;
		overflow-y: auto;
		padding: 1rem;
	}

	#lines label {
		overflow-y: auto;
	}

	#lines input {
		height: 2rem;
		border: 1px solid var(--bg-2);
		border-radius: 0.25rem;
		background-color: var(--bg-3);
		color: white;
	}

	footer {
		padding-inline: 1rem;
		display: flex;
		justify-content: space-between;
		grid-area: footer;
	}

	footer span {
		display: flex;
		gap: 1rem;
		justify-content: space-between;
		align-items: center;
	}
</style>
