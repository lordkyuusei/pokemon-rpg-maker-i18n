export type Status =
    'first-run' |
    'idle' |
    'saving-db' |
    'saving-json' |
    'saving-final' |
    'saved' |
    'deleting-db' |
    'deleted' |
    'error';

export type IntlDb = {
    game: string,
    intl: IntlObject[],
}

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

export type ParserState = {
    currentMap: string,
    currentCharacter: string,
    previousLine: string,
};
