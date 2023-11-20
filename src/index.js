'use strict';

const DELIMITER = '____';
function checkArgs(...args) {
    for (const arg of args) {
        if (typeof arg !== 'object') {
            throw new Error('lowstorage: missing args or args not an object');
        }
    }
}

function _matchesQuery(document, query) {
    // Simple implementation for matching document with query
    return Object.keys(query).every((key) => document[key] === query[key]);
}

function generateUUID() {
    // older implementation
    // // Generate 16 random bytes
    // const array = new Uint8Array(16);
    // crypto.getRandomValues(array);

    // // Adjust version and variant for RFC 4122 compliance
    // array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    // array[8] = (array[8] & 0x3f) | 0x80; // Variant 10xx

    // // Convert to hexadecimal format
    // const hexArray = Array.from(array, (byte) =>
    //     byte.toString(16).padStart(2, '0'),
    // );

    // // Insert hyphens to create UUID format
    // return `${hexArray.slice(0, 4).join('')}-${hexArray
    //     .slice(4, 6)
    //     .join('')}-${hexArray.slice(6, 8).join('')}-${hexArray
    //     .slice(8, 10)
    //     .join('')}-${hexArray.slice(10, 16).join('')}`;
    // using the new implementation by Cloudflare -> https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
    return crypto.randomUUID();
}

function getStore(env, storeName = null) {
    let store = null;
    if (storeName) {
        store = env[storeName];
        if (store.get && store.put && store.delete && store.list) {
            return store;
        }
        throw new Error(`lowstorage: store ${storeName} not found`);
    }
    for (const obj of Object.values(env)) {
        if (obj.get && obj.put && obj.delete && obj.list) {
            return obj;
        }
    }
    throw new Error('lowstorage: no valid store found');
}

class Collection {
    constructor(colName, store) {
        this.colName = colName;
        this.__store = store;
    }

    // Insert a single document or an array of documents
    async insert(doc) {
        if (Array.isArray(doc)) {
            const insertPromises = doc.map(async (item) => {
                item._id = item._id || generateUUID();
                const key = `${this.colName}/${this.colName}${DELIMITER}${item._id}`;
                return this.__store.put(key, JSON.stringify(item));
            });
            return Promise.all(insertPromises);
        }
        if (typeof doc === 'object' && doc !== null) {
            doc._id = doc._id || generateUUID();
            const key = `${this.colName}/${this.colName}${DELIMITER}${doc._id}`;
            return this.__store.put(key, JSON.stringify(doc));
        }
        throw new Error(
            'Invalid input: input must be an object or an array of objects',
        );
    }

    // Find documents based on a query
    async find(query = {}) {
        if (query._id) {
            const doc = await this.__store.get(
                `${this.colName}/${this.colName}${DELIMITER}${query._id}`,
            );
            if (doc) {
                const parsedDoc = await doc.json();
                return [parsedDoc];
            }
            return [];
        }

        const listed = await this.__store.list({
            prefix: `${this.colName}/${this.colName}${DELIMITER}`,
        });
        let truncated = listed.truncated;
        let cursor = truncated ? listed.cursor : undefined;
        // this is a workaround for the list method not returning all the keys (default limit is 1000)
        while (truncated) {
            const next = await this.__store.list({
                prefix: `${this.colName}/${this.colName}${DELIMITER}`,
                cursor: cursor,
            });
            listed.objects.push(...next.objects);
            truncated = next.truncated;
            cursor = next.cursor;
        }
        const fetchPromises = listed.objects.map(async (file) => {
            const doc = await this.__store.get(`${file.key}`);
            return doc.json();
        });
        const fetchedDocs = await Promise.all(fetchPromises);
        const docs = fetchedDocs.filter((doc) => _matchesQuery(doc, query));
        return docs;
    }

    // Find documents based on a query
    async findOne(query = {}) {
        const docs = await this.find(query);
        return docs[0];
    }

    // Update documents based on a query
    async update(query = {}, update = {}) {
        const docs = await this.find(query);
        const updatePromises = docs.map(async (doc) => {
            const updatedDoc = { ...doc, ...update };
            const key = `${this.colName}/${this.colName}${DELIMITER}${doc._id}`;
            return this.__store.put(key, JSON.stringify(updatedDoc));
        });
        return Promise.all(updatePromises);
    }

    // Update a single document based on a query
    async updateOne(query = {}, update = {}) {
        const doc = await this.findOne(query);
        const updatedDoc = { ...doc, ...update };
        const key = `${this.colName}/${this.colName}${DELIMITER}${doc._id}`;
        return this.__store.put(key, JSON.stringify(updatedDoc));
    }

    // Delete documents based on a query
    async delete(query = {}) {
        const docs = await this.find(query);
        const deletePromises = docs.map(async (doc) => {
            const key = `${this.colName}/${this.colName}${DELIMITER}${doc._id}`;
            return this.__store.delete(key);
        });
        return Promise.all(deletePromises);
    }
}

export default class lowstorage {
    constructor(env, storeName) {
        checkArgs(env);
        this.__store = getStore(env, storeName);
    }
    collection(colName) {
        return new Collection(colName, this.__store);
    }
}

// Uncomment the following line if using CommonJS
// module.exports = lowstorage;
