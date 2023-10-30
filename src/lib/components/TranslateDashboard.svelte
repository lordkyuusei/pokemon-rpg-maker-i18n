<script lang="ts">
	import { browser } from '$app/environment';

	import { compileTexts } from '$lib/parser';
	import { UNKNOWN_CHARACTER_TOKEN } from '$lib/consts';
	import { status, db, saveinDb } from '$lib/indexeddb';
	import type { IntlCharacter, IntlLine, IntlObject } from '$lib/types';

	export let intl: IntlObject[];

	let currentTab: string = intl[0].name;
	let currentChar: string = intl[0].characters[0].name;
	let currentLang: string = 'fr';

	const getFileName = (lang: string, time = new Date()) =>
		`INTL_Rejuvenation-${time.getDate()}${time.getMonth()}${time.getFullYear()}_${lang}`;

	const saveDraft = (content: any, format: string) => {
		const file = new Blob([content], { type: format });
		const link = document.createElement('a');
		const url = URL.createObjectURL(file);
		link.href = url;
		link.download = format === 'txt' ? 'intl' : getFileName(currentLang) + `.${format}`;
		document.body.append(link);
		link.click();
		document.body.removeChild(link);
	};

	const saveTranslation = (newValue: string, line: IntlLine) => {
		const mapIndex = intl.findIndex((map) => map.name === currentTab);
		const charIndex = intl[mapIndex].characters.findIndex(
			(char: IntlCharacter) => char.name === currentChar
		);
		const lineIndex = intl[mapIndex].characters[charIndex].lines.findIndex(
			(l: IntlLine) => l.id === line.id
		);
		intl[mapIndex].characters[charIndex].lines[lineIndex].translation = newValue;
		intl = [...intl];
	};

	const saveDraftBrowserDb = () => {
		if (browser) {
			saveinDb(intl, $db);
		}
	};

	const saveFinal = async () => {
		const file = await new Promise<string[]>((res, rej) =>
			res(compileTexts(intl, getFileName('fr')))
		);
		return saveDraft(file.join('\r\n'), 'txt');
	};

	$: tabs = intl.map((map) => map.name);
	$: chars = intl.find((map) => map.name === currentTab)?.characters ?? [];
	$: lines = intl
		.find((map) => map.name === currentTab)
		?.characters.find((char: IntlCharacter) => char.name === currentChar)?.lines;

	$: allTranslations = intl.flatMap((maps) =>
		maps.characters.flatMap((char: IntlCharacter) => char.lines.map((line) => line.translation))
	);

	$: totalCompletion = (
		(allTranslations.filter((x) => x).length / allTranslations.length) *
		100
	).toFixed(3);
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
		{#if currentChar === UNKNOWN_CHARACTER_TOKEN}
			<small
				>The parser wasn't able to deduce whom those lines belong to, so we show the previous line
				in the source for context.</small
			><small
				>It shouldn't be too much of a problem for translation ; however you can still take a look
				at the intl.txt source you provided for more info.</small
			>
		{/if}
		{#if lines && lines.length > 0}
			{#each lines as line (line.id)}
				<label
					class="show-previous {line.previousText?.length <= 90 ? 'small' : 'large'}-spacing"
					data-previous={line.previousText}
					for={`${line.id}`}
					title={line.previousText}
					>{line.text}
				</label>
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
			<button class="selected" on:click={() => saveDraftBrowserDb()}
				>Save Draft in your browser</button
			>
			<button class="selected" on:click={() => saveDraft(JSON.stringify(intl), 'json')}
				>Save Draft ({currentLang}.json)</button
			>
			<button class="selected" on:click={() => saveFinal()}
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
		position: relative;
	}

	#lines label.show-previous::before {
		position: absolute;
		content: attr(data-previous);
		height: 100%;
		width: 100%;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.75rem;
	}

	#lines label.show-previous.small-spacing::before {
		top: -1rem;
	}

	#lines label.show-previous.large-spacing::before {
		top: -2rem;
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
