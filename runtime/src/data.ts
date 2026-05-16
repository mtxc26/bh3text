import { openDB, unwrap } from 'idb';
import type { IDBPDatabase, IDBPTransaction } from 'idb';
import { message } from 'ant-design-vue';

export const db_name = 'www.bh3text.com';
export const db_version = 2;

/**@type {import('idb').IDBPDatabase} */
let db!: import('idb').IDBPDatabase;

interface _u {
    (db: IDBPDatabase, transaction: IDBPTransaction<unknown, string[], 'versionchange'>, oldVersion: number): void;
}

const dbUpgrade: Record<number, _u> = {
    0(db, tx, oldVersion) {
        db.createObjectStore('config');
        db.createObjectStore('cache');
        db.createObjectStore('kv');
        db.createObjectStore('tmp');
    },
    1(db, tx, oldVersion) {
        db.createObjectStore('pref');
    },
};

export async function initDB() {
    db = await openDB(db_name, db_version, {
        upgrade(db, oldVersion, newVersion, transaction) {
            for (let v = oldVersion, m = newVersion ?? db_version; v < m; ++v) {
                dbUpgrade[v]?.(db, transaction, oldVersion);
            }
        },
        blocked(currentVersion, blockedVersion, event) {
            message.error('数据库初始化失败，请重新加载页面');
            throw new Error(`Failed to open database ${db_name}: blocked: currentVersion = ${currentVersion}, blockedVersion = ${blockedVersion}`);
        },
        blocking(currentVersion, blockedVersion, event) {
            db?.close();
            message.error('数据库遇到问题，请重新加载页面');
        },
        terminated() {},
    });
}

export { db };
