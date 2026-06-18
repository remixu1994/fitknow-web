import type { DailyCalorieDayType, DailyCalorieRecord } from '../types';

export type { DailyCalorieDayType, DailyCalorieRecord } from '../types';

export type DailyCalorieRecordInput = Omit<DailyCalorieRecord, 'createdAt' | 'updatedAt'>;

const DB_NAME = 'fitknow-local';
const DB_VERSION = 1;
const STORE_NAME = 'dailyCalorieRecords';

function openCalorieDb(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('当前浏览器不支持 IndexedDB，无法保存本地记录。'));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'date' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('打开本地数据库失败。'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('本地数据库操作失败。'));
  });
}

async function openStore(mode: IDBTransactionMode): Promise<{
  db: IDBDatabase;
  store: IDBObjectStore;
  transaction: IDBTransaction;
}> {
  const db = await openCalorieDb();
  const transaction = db.transaction(STORE_NAME, mode);
  const store = transaction.objectStore(STORE_NAME);

  return { db, store, transaction };
}

export async function getCalorieRecords(): Promise<DailyCalorieRecord[]> {
  const { db, store } = await openStore('readonly');

  try {
    const records = await requestToPromise<DailyCalorieRecord[]>(store.getAll());
    return records.sort((left, right) => right.date.localeCompare(left.date));
  } finally {
    db.close();
  }
}

export async function upsertCalorieRecord(input: DailyCalorieRecordInput): Promise<DailyCalorieRecord> {
  const { db, store, transaction } = await openStore('readwrite');

  return new Promise((resolve, reject) => {
    let savedRecord: DailyCalorieRecord | null = null;

    transaction.oncomplete = () => {
      db.close();
      if (savedRecord) resolve(savedRecord);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error('本地数据库事务已取消。'));
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error('本地数据库事务失败。'));
    };

    const getRequest = store.get(input.date);

    getRequest.onsuccess = () => {
      const existing = getRequest.result as DailyCalorieRecord | undefined;
      const now = new Date().toISOString();
      savedRecord = {
        ...input,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      store.put(savedRecord);
    };

    getRequest.onerror = () => {
      reject(getRequest.error ?? new Error('读取本地记录失败。'));
    };
  });
}

export async function deleteCalorieRecord(date: string): Promise<void> {
  const { db, store, transaction } = await openStore('readwrite');

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error('本地数据库事务已取消。'));
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error('本地数据库事务失败。'));
    };

    store.delete(date);
  });
}
