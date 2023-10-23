import type { Status } from "./types";

export const MAP_TOKEN_REGEX = /\[Map\d+\]/;
export const CHARACTER_TOKEN_REGEX = /^[A-Z?]+:/;
export const CHARACTER_NAME_I18N_ID = -1;

export const UNKNOWN_CHARACTER_TOKEN = "__UNKNOWN";
export const BROWSER_DATABASE_NAME = "RPXMAKER_GAME_TRANSLATION";
export const BROWSER_DATABASE_KEY = "game";

export const mapStatusToMessage: { status: Status, message: string }[] = [
    { status: 'idle', message: "Waiting." },
    { status: 'saving-db', message: "Saving in DB..." },
    { status: 'saving-json', message: "Saving draft json..." },
    { status: 'saving-final', message: "Compiling texts..." },
    { status: 'saved', message: "Saved." },
    { status: 'deleting-db', message: "Deleting DB..." },
    { status: 'deleted', message: "DB deleted." },
    { status: 'error', message: "Something happened." },
]