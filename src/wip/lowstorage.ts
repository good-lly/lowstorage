// **Interfaces & Types**

interface R2Store {
	get(key: string): Promise<any | null>;
	put(key: string, value: any): Promise<void>;
	delete(key: string): Promise<void>;
	list(): Promise<R2ListResult>;
	list(options: R2ListOptions): Promise<R2ListResult>;
}

interface R2ListOptions {
	cursor?: string;
}

interface R2ListResult {
	objects: R2Object[];
	truncated: boolean;
	cursor?: string;
}

interface R2Object {
	key: string;
	version: string;
	size: number;
	etag: string;
	httpEtag: string;
	// checksums: R2Checksums;
	uploaded: Date;
	// httpMetadata?: R2HTTPMetadata;
	customMetadata?: Record<string, string>;
	// range?: R2Range;
	writeHttpMetadata: (headers: Headers) => void;
}

interface Document {
	_id: string;
	[key: string]: any; // Allow additional properties for flexibility
}

// **Helper Functions**

// Ensures required arguments are objects
const _checkArgs = (...args: object[]): void => {
	for (const arg of args) {
		if (typeof arg !== 'object' || arg === null) {
			throw new Error('lowstorage: missing args or args not an object');
		}
	}
};

// Checks if a document matches a query object
const _matchesQuery = (document: Document, query: object): boolean => {
	return Object.keys(query).every((key) => document[key] === query[key]);
};

// Generates a unique ID for new documents
const _generateUUID = (): string => {
	return crypto.randomUUID();
};

const _isR2Store = (obj: unknown): obj is R2Store => {
	let hasMethod = (obj: unknown, name: any) => {
		return typeof obj !== 'undefined' && obj !== null && typeof obj[name] === 'function';
	};

	return (
		typeof obj === 'object' &&
		obj !== null &&
		hasMethod(obj, 'get') &&
		hasMethod(obj, 'put') &&
		hasMethod(obj, 'delete') &&
		hasMethod(obj, 'list')
	);
};

// Retrieves the appropriate R2 store from the environment
const _getStore = (env: any, storeName?: string): R2Store => {
	let store = storeName ? env[storeName] ?? null : null; // Use ?? if storeName is provided
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

// **Collection Class**

class Collection {
	private _colName: string;
	private _store: R2Store;
	private _skip?: number;
	private _limit?: number;

	constructor(colName: string, store: R2Store) {
		this._colName = colName;
		this._store = store;
	}

	// Adds a skip function for chaining
	skip(numToSkip: number): Collection {
		this._skip = numToSkip;
		return this;
	}

	// Adds a limit function for chaining
	limit(numToLimit: number): Collection {
		this._limit = numToLimit;
		return this;
	}

	// Loads all documents from the collection
	private async _loadData(): Promise<Document[]> {
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

	// Saves data back to the collection file
	private async _saveData(data: Document[]): Promise<void> {
		const key = `${this._colName}/${this._colName}.json`;
		return this._store.put(key, JSON.stringify(data));
	}

	// Inserts new documents
	async insert(doc: Document | Document[]): Promise<void> {
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

	// Finds documents based on a query, applies skip & limit
	async find(query: object = {}): Promise<Document[]> {
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

	// Similar to find, but returns the first result or null
	async findOne(query: object = {}): Promise<Document | null> {
		return (await this.find(query))[0] || null;
	}

	// Updates documents matching a query
	async update(query: object = {}, update: object = {}): Promise<number> {
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

	// Updates a single matching document
	async updateOne(query: object = {}, update: object = {}): Promise<number> {
		const data = await this._loadData();
		const docIndex = data.findIndex((doc) => _matchesQuery(doc, query));

		if (docIndex !== -1) {
			Object.assign(data[docIndex], update);
			await this._saveData(data);
			return 1;
		}
		return 0;
	}

	// Deletes documents matching a query
	async delete(query: object = {}): Promise<number> {
		const data = await this._loadData();
		const initialLength = data.length;
		const newData = data.filter((doc) => !_matchesQuery(doc, query));
		await this._saveData(newData);
		return initialLength - newData.length;
	}

	// Counts documents matching a query
	async count(query: object = {}): Promise<number> {
		return (await this.find(query)).length;
	}

	// Deletes all documents in the collection
	async remove(): Promise<number> {
		const data = await this._loadData();
		const deletedCount = data.length;
		await this._saveData([]);
		return deletedCount;
	}
}

// **lowstorage Class**

class lowstorage {
	private _store: R2Store;

	constructor(env: any, storeName?: string) {
		_checkArgs(env);
		this._store = _getStore(env, storeName);
	}

	// Creates a Collection instance
	collection(colName: string): Collection {
		return new Collection(colName, this._store);
	}

	// Lists available collections
	async listCollections(): Promise<string[]> {
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
