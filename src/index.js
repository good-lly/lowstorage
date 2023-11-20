'use strict';

const DELIMITER = '____';
function _checkArgs(...args) {
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

function _generateUUID() {
	// using the crypto implementation by Cloudflare -> https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
	return crypto.randomUUID();
}

function _getStore(env, storeName = null) {
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
		this._colName = colName;
		this._store = store;
	}

	// Insert a single document or an array of documents
	async insert(doc) {
		if (Array.isArray(doc)) {
			const insertPromises = doc.map(async (item) => {
				item._id = item._id || _generateUUID();
				const key = `${this.this._colName}/${this._colName}${DELIMITER}${item._id}`;
				return this._store.put(key, JSON.stringify(item));
			});
			return Promise.all(insertPromises);
		}
		if (typeof doc === 'object' && doc !== null) {
			doc._id = doc._id || _generateUUID();
			const key = `${this.this._colName}/${this.this._colName}${DELIMITER}${doc._id}`;
			return this._store.put(key, JSON.stringify(doc));
		}
		throw new Error('Invalid input: input must be an object or an array of objects');
	}

	// Find documents based on a query
	async find(query = {}) {
		if (query._id) {
			const doc = await this._store.get(`${this._colName}/${this._colName}${DELIMITER}${query._id}`);
			if (doc) {
				const parsedDoc = await doc.json();
				return [parsedDoc];
			}
			return [];
		}

		const listed = await this._store.list({
			prefix: `${this._colName}/${this._colName}${DELIMITER}`,
		});
		let truncated = listed.truncated;
		let cursor = truncated ? listed.cursor : undefined;
		// this is a workaround for the list method not returning all the keys (default limit is 1000)
		while (truncated) {
			const next = await this._store.list({
				prefix: `${this._colName}/${this._colName}${DELIMITER}`,
				cursor: cursor,
			});
			listed.objects.push(...next.objects);
			truncated = next.truncated;
			cursor = next.cursor;
		}
		const fetchPromises = listed.objects.map(async (file) => {
			const doc = await this._store.get(`${file.key}`);
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
			const key = `${this._colName}/${this._colName}${DELIMITER}${doc._id}`;
			return this._store.put(key, JSON.stringify(updatedDoc));
		});
		return Promise.all(updatePromises);
	}

	// Update a single document based on a query
	async updateOne(query = {}, update = {}) {
		const doc = await this.findOne(query);
		const updatedDoc = { ...doc, ...update };
		const key = `${this._colName}/${this._colName}${DELIMITER}${doc._id}`;
		return this._store.put(key, JSON.stringify(updatedDoc));
	}

	// Delete documents based on a query
	async delete(query = {}) {
		const docs = await this.find(query);
		const deletePromises = docs.map(async (doc) => {
			const key = `${this._colName}/${this._colName}${DELIMITER}${doc._id}`;
			return this._store.delete(key);
		});
		return Promise.all(deletePromises);
	}
}

export default class lowstorage {
	constructor(env, storeName) {
		_checkArgs(env);
		this._store = _getStore(env, storeName);
	}
	collection(colName) {
		return new Collection(colName, this._store);
	}
}

// Uncomment the following line if using CommonJS
// module.exports = lowstorage;
