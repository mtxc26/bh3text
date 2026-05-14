import { openDB, unwrap } from 'idb';
import type { IDBPDatabase, IDBPTransaction } from 'idb';
import { message } from 'ant-design-vue';

export const db_name = 'www.bh3text.com';
export const db_version = 1;

/**@type {import('idb').IDBPDatabase} */
let db!: import('idb').IDBPDatabase;

interface UpgradeFunction {
    (db: IDBPDatabase, transaction: IDBPTransaction<unknown, string[], 'versionchange'>, oldVersion: number): void;
}

const dbUpgrade: Record<number, UpgradeFunction> = {
    0(db, t, old) {
        db.createObjectStore('config');
        db.createObjectStore('cache');
        db.createObjectStore('kv');
        db.createObjectStore('tmp');
    },
};

export async function initDB() {
    db = await openDB(db_name, db_version, {
        upgrade(db, oldVersion, newVersion, transaction) {
            for (let v = oldVersion, m = (newVersion ?? db_version); v < m; ++v) {
                dbUpgrade[v]?.(db, transaction, oldVersion);
            }
        },
        blocked(currentVersion, blockedVersion, event) {
            message.error('数据库初始化失败，请重新加载页面');
            throw new Error(`Failed to open database ${db_name}: blocked: currentVersion = ${currentVersion}, blockedVersion = ${blockedVersion}`);
        },
        blocking(currentVersion, blockedVersion, event) {
            db?.close();
        },
        terminated() {},
    });
}

export { db };
