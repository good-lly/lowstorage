const DELIMITER = '____';
const _checkArgs = (...args) => {
	for (const arg of args) {
		if (typeof arg !== 'object' || arg === null) {
			throw new Error('lowstorage: missing args or args not an object');
		}
	}
};

const _matchesQuery = (document, query) => {
	return Object.keys(query).every((key) => document[key] === query[key]);
};

const _generateUUID = () => {
	// using the crypto implementation by Cloudflare -> https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
	return crypto.randomUUID();
};

const _getStore = (env, storeName = null) => {
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
};

class Collection {
	constructor(colName, store) {
		this._colName = colName;
		this._store = store;
		this._data = this._loadData().then((data) => {
			this._data = data;
		});
	}

	async _loadData() {
		try {
			const doc = await this._store.get(`${this._colName}/${this._colName}.json`);
			if (doc) {
				return doc.json();
			}
			return [];
		} catch (error) {
			if (error.code === 'ENOENT') {
				// File not found, create a new empty object
				return [];
			} else {
				throw error;
			}
		}
	}

	async _saveData() {
		const key = `${this._colName}/${this._colName}.json`;
		return this._store.put(key, JSON.stringify(this._data));
	}

	// Insert a single document or an array of documents
	async insert(doc) {
		if (!Array.isArray(doc)) {
			doc = [doc];
		}
		await this._data;
		for (let item of doc) {
			if (typeof item !== 'object' || item === null) {
				throw new Error('Invalid input: input must be an object or an array of objects');
			}
			item._id = item._id || _generateUUID();
			this._data.push(item);
		}
		await this._saveData();
	}

	// Find documents based on a query
	async find(query = {}) {
		await this._data;
		return this._data.filter((doc) => _matchesQuery(doc, query));
	}

	// Find documents based on a query
	async findOne(query = {}) {
		return (await this.find(query))[0] || null;
	}

	// Update documents based on a query
	async update(query = {}, update = {}) {
		const docsToUpdate = await this.find(query);
		docsToUpdate.forEach((doc) => {
			Object.assign(doc, update);
		});
		await this._saveData();
		return docsToUpdate.length;
	}

	// Update a single document based on a query
	async updateOne(query = {}, update = {}) {
		const doc = await this.findOne(query);
		if (doc) {
			Object.assign(doc, update);
			await this._saveData();
			return 1;
		}
		return 0;
	}

	// Delete documents based on a query
	async delete(query = {}) {
		await this._data;
		const initialLength = this._data.length;
		this._data = this._data.filter((doc) => !_matchesQuery(doc, query));
		await this._saveData();
		return initialLength - this._data.length;
	}

	async count(query = {}) {
		return (await this.find(query)).length;
	}

	async remove() {
		await this._data;
		const deletedCount = this._data.length;
		this._data = [];
		await this._saveData();
		return deletedCount;
	}
}

class lowstorage {
	constructor(env, storeName) {
		_checkArgs(env);
		this._store = _getStore(env, storeName);
	}
	collection(colName) {
		return new Collection(colName, this._store);
	}
}

export default lowstorage;
