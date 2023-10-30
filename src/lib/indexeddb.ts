import { writable, type Writable } from "svelte/store";
import { BROWSER_DATABASE_NAME } from "$lib/consts";
import type { IntlDb, IntlObject, Status } from "./types";
import { _err, _log } from "./log";

export const status: Writable<Status> = writable();
export const db: Writable<IDBDatabase> = writable();

const resetStatus = () => setTimeout(() => status.set('idle'), 3000);

export const initializeDb = () => {
    return new Promise((res, rej) => {
        const request = window.indexedDB.open(BROWSER_DATABASE_NAME);

        request.onerror = (errEvent) => {
            status.set('error');
            _err("[INDEXEDDB] Error", errEvent)

            resetStatus();
            rej(false);
        }

        request.onsuccess = (successEvent) => {
            db.set((successEvent.target as IDBOpenDBRequest).result);
            _log("[INDEXEDDB] Success", successEvent)

            resetStatus();
            res(true);
        };

        request.onupgradeneeded = (upgradeEvent) => {
            status.set('first-run');

            const db = (upgradeEvent.target as IDBOpenDBRequest).result;
            db.createObjectStore(BROWSER_DATABASE_NAME, { keyPath: "game" });

            _log("[INDEXEDDB] Upgrade Needed", { upgradeEvent })
            resetStatus();
        }
    })
}

export const findInDb = (db: IDBDatabase, resolver: (value: IntlObject[] | PromiseLike<IntlObject[] | undefined> | undefined) => void) => {
    const query = db
        .transaction([BROWSER_DATABASE_NAME])
        .objectStore(BROWSER_DATABASE_NAME)
        .get('Rejuv');

    query.onsuccess = (event) => {
        const { result }: IDBRequest<IntlDb> = event.target as IDBRequest;
        if (!result) resolver(undefined);
        else {
            resetStatus();
            _log('[INDEXEDDB] Existing value found', result);

            resolver(result.intl);
        }

    };

    query.onerror = (event) => {
        _err('[INDEXEDDB] Error loading values', event);
        status.set('error');
        resetStatus();
    };

}
export const saveinDb = (json: IntlObject[], db: IDBDatabase) => {
    status.set('saving-db');
    const transaction = db.transaction([BROWSER_DATABASE_NAME], 'readwrite');

    transaction.oncomplete = () => {
        status.set('saved');
        resetStatus();
    };

    transaction.onerror = (err) => {
        _err("[INDEXEDDB] Transaction Error", err);
        status.set('error');
        resetStatus();
    };

    const objStore = transaction.objectStore(BROWSER_DATABASE_NAME);
    const obj: IntlDb = {
        game: "Rejuv",
        intl: json
    };

    objStore.put(obj);
}

export const deleteDatabase = (db: IDBDatabase) => {
    status.set('deleting-db');
    const transaction = db.transaction([BROWSER_DATABASE_NAME], 'readwrite');

    transaction.oncomplete = () => {
        status.set('deleted');
        resetStatus();
    };

    transaction.onerror = (err) => {
        _err("[INDEXEDDB] Transaction Error", err);
        status.set('error');
        resetStatus();
    };

    const objStore = transaction.objectStore(BROWSER_DATABASE_NAME);

    objStore.delete("Rejuv");
}