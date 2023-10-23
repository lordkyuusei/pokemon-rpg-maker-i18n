import { _log } from "./log";
import { CHARACTER_TOKEN_REGEX, MAP_TOKEN_REGEX, UNKNOWN_CHARACTER_TOKEN, CHARACTER_NAME_I18N_ID } from "$lib/consts";
import type { IntlObject, ParserState } from "./types";

export const compileTexts = (intl: IntlObject[], topLog: string): string[] => {
    const texts: string[] = [];

    const sortedIntl = intl
        .map(map => ({
            mapName: map.name,
            mapLines: map.characters
                .flatMap(char => char.lines.filter(l => l.id !== CHARACTER_NAME_I18N_ID).map(line => {
                    const namei18NLine = char.lines.find(l => l.id === CHARACTER_NAME_I18N_ID);

                    const separator = line.text.startsWith('\\c') || line.text.startsWith('\\ts') ? "" : " ";
                    const name = char.name !== UNKNOWN_CHARACTER_TOKEN ? `${char.name}${separator}` : '';
                    const i18nName = char.name !== UNKNOWN_CHARACTER_TOKEN ? `${namei18NLine?.translation ?? '[char not translated]'}${separator}` : '';

                    return ({
                        id: line.id,
                        line: `${name}${line.text}`,
                        translation: `${i18nName}${line.text}`,
                    });
                }))
                .sort((a, b) => a.id - b.id)
        }));

    texts.push(`# Compiled strings - ${topLog}`);
    texts.push(`# This file has been generated automatically.`);

    sortedIntl.forEach(map => {
        texts.push(map.mapName);
        map.mapLines.forEach(line => {
            texts.push(line.line)
            texts.push(line.translation)
        })
    });

    _log(`[PARSER] Compiled ${texts.length} lines`, texts);
    return texts;
}

const parseIntlDraftFile = async (reader: FileReader, res: any, rej: any) => {
    try {
        const result = reader.result?.toString();

        if (!result) return rej("Invalid JSON file.");

        const intlObject = JSON.parse(result);
        return res(intlObject);
    } catch (err) {
        rej(err);
    }
}

const parseIntlNewFile = async (reader: FileReader, res: any, rej: any) => {
    const state: ParserState = {
        currentMap: "",
        currentCharacter: "",
        previousLine: "",
    };

    const textAsArray = reader.result?.toString().split('\r\n');
    if (textAsArray === undefined) return rej("Invalid file.");

    try {
        const intlObject: IntlObject[] | undefined = textAsArray.reduce((acc, rawLine, index) => {
            const line = rawLine.trim().replaceAll('  ', ' ');
            const prevLine = index === 0 ? "" : textAsArray[index - 1].trim().replaceAll('  ', ' ');

            // ignore the first few comments.
            if (line.startsWith('#')) return acc;

            // translation file is working on a duplicate-then-translate line system.
            if (line === prevLine) return acc;

            // detect [Map] segments 
            const mapName = line.match(MAP_TOKEN_REGEX);
            if (mapName) {
                state.currentMap = mapName[0];
                return [...acc, {
                    name: line,
                    characters: []
                }]
            }

            // detect character zone
            const characterName = line.match(CHARACTER_TOKEN_REGEX);
            if (characterName) {
                state.currentCharacter = characterName[0];
                const currentMapIndex = acc.findIndex(maps => maps.name === state.currentMap);
                const characterIndex = acc[currentMapIndex].characters.findIndex(character => character.name === state.currentCharacter);
                const text = line.split(CHARACTER_TOKEN_REGEX)[1].trim();

                if (characterIndex !== -1) {
                    acc[currentMapIndex].characters[characterIndex].lines.push({
                        id: index,
                        previousText: acc[currentMapIndex].characters[characterIndex].lines.at(-1)?.text ?? "",
                        text
                    });
                } else {
                    acc[currentMapIndex].characters.push({
                        name: state.currentCharacter,
                        lines: [{
                            id: CHARACTER_NAME_I18N_ID,
                            previousText: "",
                            text: state.currentCharacter
                        }, {
                            id: index,
                            previousText: state.currentCharacter,
                            text
                        }]
                    });
                }

                state.previousLine = line;
                return acc;
            }

            // not a map & no character detected : either a follow-up line or a standalone one
            if (!mapName && !characterName) {
                const currentMapIndex = acc.findIndex(maps => maps.name === state.currentMap);
                const characterIndex = acc[currentMapIndex].characters.findIndex(character => character.name === UNKNOWN_CHARACTER_TOKEN);

                if (characterIndex !== -1) {
                    acc[currentMapIndex].characters[characterIndex].lines.push({
                        id: index,
                        previousText: prevLine,
                        text: line,
                    });
                } else {
                    acc[currentMapIndex].characters.push({
                        name: UNKNOWN_CHARACTER_TOKEN,
                        lines: [{
                            id: index,
                            previousText: state.currentCharacter,
                            text: line
                        }]
                    });
                }

                state.previousLine = line;
                return acc;
            }

            return acc;
        }, [] as IntlObject[]);

        _log(`[PARSER] Parsed ${textAsArray.length} lines`, textAsArray);
        res(intlObject ?? []);
    } catch (err) {
        rej(err);
    }
}

export const parseIntlFile = async (file: File | null | undefined) => {
    if (!file) return;

    const reader = new FileReader();

    const promise: Promise<IntlObject[]> = new Promise((res, rej) => {
        if (file.name.endsWith('.txt')) {
            reader.onload = (_: ProgressEvent<FileReader>) => parseIntlNewFile(reader, res, rej);
        } else if (file.name.endsWith('.json')) {
            reader.onload = (_: ProgressEvent<FileReader>) => parseIntlDraftFile(reader, res, rej);
        }
        reader.readAsText(file);
    });

    return await promise;
};