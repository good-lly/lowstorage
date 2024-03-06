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

const _isR2Store = (obj) => {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'get' in obj &&
		typeof obj.get === 'function' &&
		'put' in obj &&
		typeof obj.put === 'function' &&
		'delete' in obj &&
		typeof obj.delete === 'function' &&
		'list' in obj &&
		typeof obj.list === 'function'
	);
};

const _getStore = (env, storeName) => {
	let store = storeName ? env[storeName] ?? null : null;
	if (!store) {
		// Check for null directly
		for (const obj of Object.values(env)) {
			if (_isR2Store(obj)) {
				return obj;
			}
		}
	} else {
		if (store.get && store.put && store.delete && store.list) {
			return store;
		}
	}
	throw new Error('lowstorage: no valid store found');
};

class Collection {
	constructor(colName, store) {
		this._colName = colName;
		this._store = store;
	}

	// Adds a skip function
	skip(numToSkip) {
		this._skip = numToSkip;
		return this;
	}

	// Adds a limit function
	limit(numToLimit) {
		this._limit = numToLimit;
		return this;
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

	async _saveData(data) {
		const key = `${this._colName}/${this._colName}.json`;
		return this._store.put(key, JSON.stringify(data));
	}

	// Insert a single document or an array of documents
	async insert(doc) {
		if (!Array.isArray(doc)) {
			doc = [doc];
		}
		const data = await this._loadData();
		for (let item of doc) {
			if (typeof item !== 'object' || item === null) {
				throw new Error('Invalid input: input must be an object or an array of objects');
			}
			item._id = item._id || _generateUUID();
			data.push(item);
		}
		await this._saveData(data);
	}

	// Find documents based on a query
	async find(query = {}) {
		const data = await this._loadData();
		const filteredData = data.filter((doc) => _matchesQuery(doc, query));

		// Apply skip and limit if they have been set
		let resultData = filteredData;
		if (this._skip) {
			resultData = resultData.slice(this._skip);
		}
		if (this._limit) {
			resultData = resultData.slice(0, this._limit);
		}

		// Reset skip and limit
		this._skip = undefined;
		this._limit = undefined;

		return resultData;
	}

	// Find documents based on a query
	async findOne(query = {}) {
		return (await this.find(query))[0] || null;
	}

	// Update documents based on a query
	async update(query = {}, update = {}) {
		const data = await this._loadData();
		let updatedCount = 0;

		data.forEach((doc) => {
			if (_matchesQuery(doc, query)) {
				Object.assign(doc, update);
				updatedCount++;
			}
		});

		if (updatedCount > 0) {
			await this._saveData(data);
		}

		return updatedCount;
	}

	// Update a single document based on a query
	async updateOne(query = {}, update = {}) {
		const data = await this._loadData();
		const docIndex = data.findIndex((doc) => _matchesQuery(doc, query));

		if (docIndex !== -1) {
			Object.assign(data[docIndex], update);
			await this._saveData(data);
			return 1;
		}
		return 0;
	}

	// Delete documents based on a query
	async delete(query = {}) {
		const data = await this._loadData();
		const initialLength = data.length;
		const newData = data.filter((doc) => !_matchesQuery(doc, query));
		await this._saveData(newData);
		return initialLength - newData.length;
	}

	async count(query = {}) {
		return (await this.find(query)).length;
	}

	async remove() {
		const data = await this._loadData();
		const deletedCount = data.length;
		await this._saveData([]);
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

	// this is similar to list all files unfortunatelly -
	// it returns a list of "collections" but expect to have a .json file for each collection
	// return names of collections
	async listCollections() {
		const listed = await this._store.list();
		let truncated = listed.truncated;
		let cursor = truncated ? listed.cursor : undefined;
		// this is a workaround for the list method not returning all the keys (default limit is 1000)
		while (truncated) {
			const next = await this._store.list({
				cursor: cursor,
			});
			listed.objects.push(...next.objects);
			truncated = next.truncated;
			cursor = next.cursor;
		}
		const collections = listed.objects.filter((entry) => entry.key.endsWith('.json'));
		// return only the collection name
		return collections.map((entry) => entry.key.split('/')[0]);
	}
}

export default lowstorage;
