const MAP_TOKEN_REGEX = /\[Map\d+\]/;
const CHARACTER_TOKEN_REGEX = /^[A-Z?]+:/;
const UNKNOWN_CHARACTER_TOKEN = "__UNKNOWN";

export type IntlObject = {
    name: string,
    characters: IntlCharacter[],
};

export type IntlCharacter = {
    name: string,
    lines: IntlLine[],
};

export type IntlLine = {
    id: number,
    previousText: string,
    text: string,
    translation?: string,
};

const parseIntlDraftFile = async (reader: FileReader, res: any, rej: any) => {
    try {
        const result = reader.result?.toString();

        if (!result) return rej("Invalid JSON file.");

        const intlObject = JSON.parse(result);
        console.log({ result, intlObject })
        return res(intlObject);
    } catch (err) {
        rej(err);
    }
}

const parseIntlNewFile = async (reader: FileReader, res: any, rej: any) => {
    const config = {
        currentMap: "",
        currentCharacter: "",
    };

    const textAsArray = reader.result?.toString().split('\r\n');
    if (textAsArray === undefined) return rej("Invalid file.");

    try {
        const intlObject: IntlObject[] | undefined = textAsArray.reduce((acc, line, index) => {
            // ignore zone
            if (line.startsWith('#')) return acc;

            // map zone
            const mapName = line.match(MAP_TOKEN_REGEX);
            if (mapName) {
                config.currentMap = mapName[0];
                return [...acc, {
                    name: line,
                    characters: []
                }]
            }

            // character zone
            const characterName = line.match(CHARACTER_TOKEN_REGEX);
            if (characterName) {
                config.currentCharacter = characterName[0];
                const currentMapIndex = acc.findIndex(maps => maps.name === config.currentMap);
                const characterIndex = acc[currentMapIndex].characters.findIndex(character => character.name === config.currentCharacter);
                const text = line.split(CHARACTER_TOKEN_REGEX)[1];

                if (characterIndex !== -1) {
                    acc[currentMapIndex].characters[characterIndex].lines = [
                        ...acc[currentMapIndex].characters[characterIndex].lines,
                        {
                            id: index,
                            previousText: acc[currentMapIndex].characters[characterIndex].lines.at(-1)?.text ?? "",
                            text
                        }
                    ]
                } else {
                    acc[currentMapIndex].characters = [
                        ...acc[currentMapIndex].characters,
                        {
                            name: config.currentCharacter,
                            lines: [{
                                id: index * 10_000,
                                previousText: "",
                                text: config.currentCharacter
                            }]
                        }
                    ]
                }

                return acc;
            }

            // standalone line zone
            if (!mapName && !characterName) {
                const currentMapIndex = acc.findIndex(maps => maps.name === config.currentMap);
                const characterIndex = acc[currentMapIndex].characters.findIndex(character => character.name === UNKNOWN_CHARACTER_TOKEN);

                if (characterIndex !== -1) {
                    acc[currentMapIndex].characters[characterIndex].lines = [
                        ...acc[currentMapIndex].characters[characterIndex].lines,
                        {
                            id: index,
                            previousText: acc[currentMapIndex].characters[characterIndex].lines.at(-1)?.text ?? "",
                            text: line,
                        }
                    ]
                } else {
                    acc[currentMapIndex].characters = [
                        ...acc[currentMapIndex].characters,
                        {
                            name: UNKNOWN_CHARACTER_TOKEN,
                            lines: []
                        }
                    ]
                }

                return acc;
            }

            return acc;
        }, [] as IntlObject[]);

        res(intlObject ?? []);
    } catch (err) {
        rej(err);
    }
}

export const parseIntlFile = async (file: File | null | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    console.log(file);

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