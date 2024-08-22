type S3Options = {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string;
    bucketName: string;
    region?: string;
    logger?: any;
    dirPrefix?: string;
    maxRequestSizeInBytes?: number;
};
type CollectionProps = {
    colName: string;
    schema: any;
    s3: S3;
    dirPrefix: string;
    safeWrite: boolean;
    chunkSize: number;
    avroParse: any;
    avroType: any;
};
import { S3 } from 'ultralight-s3';
import { lowstorage_ERROR_CODES, lowstorageError } from 'errors';
/**
 * lowstorage class for managing collections and performing operations on top of S3-compatible storages.
 * @class
 * @example
 * const storage = new lowstorage({
 * 	accessKeyId: 'YOUR_ACCESS_KEY',
 * 	secretAccessKey: 'YOUR_SECRET_KEY',
 * 	endpoint: 'YOUR_ENDPOINT',
 * 	bucketName: 'YOUR_BUCKET_NAME',
 * 	region: 'YOUR_REGION',
 * });
 *
 * // Create a collection
 * const userCol = await storage.collection('users');
 *
 * // Insert a document
 * await userCol.insert({
 * 	name: 'Kevin',
 * 	gender: 'whatever',
 * 	posts: [],
 * });
 *
 * // Show all users
 * const allUsers = await userCol.find({});
 *
 * // Find users with pagination (e.g., page 2, 10 users per page)
 * const secondPageUsers = await userCol.find({}, { skip: 10, limit: 10 });
 *
 * // Find user by ID and update name
 * await userCol.update({ _id: id }, { name: 'Carlos' });
 */
declare class lowstorage {
    /**
     * Create a new lowstorage instance.
     * @param {Object} options - Configuration options for lowstorage.
     * @param {string} options.accessKeyId - S3 access key ID.
     * @param {string} options.secretAccessKey - S3 secret access key.
     * @param {string} options.endpoint - S3 endpoint URL.
     * @param {string} options.bucketName - S3 bucket name.
     * @param {string} [options.region='auto'] - S3 region.
     * @param {Object} [options.logger=null] - Logger object.
     * @param {string} [options.dirPrefix=PROJECT_DIR_PREFIX] - Directory prefix for collections.
     * @param {Number} [options.maxRequestSizeInBytes=CHUNG_5MB] - Chunk size for reading and writing data. AWS S3 has a minimum of 5MB per object.
     * @returns {lowstorage} A new lowstorage instance.
     */
    private _schemas;
    private _s3;
    private _dirPrefix;
    private _avroParse;
    constructor(options: S3Options);
    _checkArgs: (args: S3Options) => void;
    /**
     * Check if a bucket exists.
     * @returns {Promise<boolean>} True if the bucket exists, false otherwise.
     * @throws {lowstorageError} If there's an error.
     */
    checkIfStorageExists(): Promise<boolean>;
    /**
     * Create a new storage bucket if it doesn't exist.
     * @returns {Promise<boolean>} A Promise that resolves to true if the bucket was created or already exists, false otherwise.
     * @throws {lowstorageError} If there's an error.
     */
    createStorage(): Promise<boolean>;
    /**
     * List all collections.
     * @returns {Promise<string[]>} An array of collection names.
     * @throws {S3OperationError} If there's an error during S3 operation.
     */
    listCollections(): Promise<string[]>;
    /**
     * Check if a collection exists.
     * @param {string} colName - The name of the collection.
     * @returns {Promise<boolean>} True if the collection exists, false otherwise.
     * @throws {lowstorageError} If there's an error.
     */
    collectionExists(colName?: string): Promise<boolean>;
    /**
     * Create a new collection.
     * @param {string} colName - The name of the collection.
     * @param {Object} [schema] - The schema for the collection.
     * @param {Array} [data=[]] - The initial data for the collection.
     * @returns {Promise<Collection>} A Promise that resolves to a Collection object.
     * @throws {lowstorageError} If there's an error.
     */
    createCollection(colName?: string, schema?: Object, data?: any[]): Promise<Collection>;
    /**
     * Remove a collection.
     * @param {string} colName - The name of the collection.
     * @returns {Promise<boolean>} A Promise that resolves to true if the collection is removed, false otherwise.
     * @throws {lowstorageError} If there's an error.
     */
    removeCollection(colName?: string): Promise<boolean>;
    /**
     * Get or create a collection.
     * @param {string} colName - The name of the collection.
     * @param {Object} [schema] - The schema for the collection.
     * @param {boolean} [autoCreate=true] - Whether to automatically create the collection if it doesn't exist.
     * @returns {Promise<Collection>} A Promise that resolves to a Collection object.
     * @throws {lowstorageError} If there's an error.
     */
    collection(colName?: string, schema?: object, autoCreate?: boolean): Promise<Collection>;
    /**
     * Get the S3 instance associated with the lowstorage instance.
     * @returns {S3} The S3 instance. Use this to perform S3 operations. Check for ultralight-s3 for more details.
     */
    s3: () => S3;
}
/**
 * Collection class for managing documents in a collection.
 * @class Collection
 * @example const storage = new lowstorage({
 * 	accessKeyId: 'YOUR_ACCESS_KEY',
 * 	secretAccessKey: 'YOUR_SECRET_KEY',
 * 	endpoint: 'YOUR_ENDPOINT',
 * 	bucketName: 'YOUR_BUCKET_NAME',
 * 	region: 'YOUR_REGION',
 * });
 *
 * // Create a collection
 * const userCol = await storage.collection('users');
 *
 * // Insert a document
 * await userCol.insert({
 * 	name: 'Kevin',
 * 	gender: 'whatever',
 * 	posts: [],
 * });
 *
 * // Show all users
 * const allUsers = await userCol.find({});
 *
 */
declare class Collection {
    /**
     * Create a new Collection instance.
     * @param {string} colName - The name of the collection.
     * @param {Object} [schema] - The Avro schema for the collection.
     * @param {S3} s3 - The S3 instance.
     * @param {string} [dirPrefix=PROJECT_DIR_PREFIX] - The directory prefix for the collection.
     * @param {boolean} [safeWrite=false] - Whether to perform a safe write operation. It doublechecks the ETag of the object before writing. False = overwrites the object, True = only writes if the object has not been modified.
     * @param {Number} [chunkSize=CHUNG_5MB] - The chunk size for reading and writing data. AWS S3 has a maximum of 5MB per object.
     * @returns {Collection} A new Collection instance.
     */
    private _colName;
    private _schema;
    private _s3;
    private _dirPrefix;
    private _safeWrite;
    private _chunkSize;
    private _avroParse;
    private _lastETag;
    private _dataCache;
    private _avroType;
    private _key;
    constructor(colName: string | undefined, schema: any, s3: S3, dirPrefix?: string, safeWrite?: boolean, chunkSize?: number);
    getProps: () => CollectionProps;
    setProps: (props: CollectionProps) => void;
    setSafeWrite: (safeWrite: boolean) => void;
    getSafeWrite: () => boolean;
    getAvroSchema: () => Object;
    setAvroSchema: (schema: Object) => void;
    getCollectionETag: () => string;
    inferAvroSchema: (data: any[] | {
        [s: string]: unknown;
    } | ArrayLike<unknown>, type?: string) => Object;
    forceLoadData(): Promise<boolean>;
    _loadData(): Promise<any[]>;
    _saveData(data: Object[]): Promise<boolean>;
    /**
     * Insert a document into the collection.
     * @param {Object|Array} doc - The document to insert.
     * @param {Object} [schema=undefined] - The schema for the document.
     * @returns {Promise<Array>} A Promise that resolves to the array of inserted document(s).
     * @throws {lowstorageError} If there's an error.
     */
    insert(doc: Object | Array<Object>, schema?: Object): Promise<Object[]>;
    /**
     * Find documents in the collection.
     * @param {Object} [query={}] - The query to filter documents.
     * @param {Object} [options={}] - The options for pagination.
     * @param {number} [options.skip=0] - The number of documents to skip. Default is 0.
     * @param {number} [options.limit=undefined] - The maximum number of documents to return. Default is undefined, which means no limit.
     * @returns {Promise<Array>} A Promise that resolves to an array of matching documents.
     * @throws {lowstorageError} If there's an error.
     */
    find(query?: Object, options?: Object): Promise<Object[]>;
    /**
     * Find the first document in the collection that matches the query.
     * @param {Object} [query={}] - The query to filter documents.
     * @returns {Promise<Object|null>} A Promise that resolves to the first matching document or null if no match is found.
     * @throws {lowstorageError} If there's an error.
     */
    findOne(query?: Object): Promise<Object | null>;
    /**
     * Update a single document in the collection that matches the query.
     * @param {Object} [query={}] - The query to filter the document to update.
     * @param {Object} [update={}] - The update operations to apply to the matching document.
     * @returns {Promise<number>} A Promise that resolves to number of documents updated.
     * @throws {lowstorageError} If the updateOne operation fails.
     * @throws {SchemaValidationError} If the schema is not defined for the collection.
     * @throws {DocumentValidationError} If the updated document is invalid.
     * @throws {S3OperationError} If the S3 operation fails.
     */
    update(query?: Object, update?: Object, options?: Object): Promise<number>;
    /**
     * Update a single document in the collection that matches the query.
     * @param {Object} [query={}] - The query to filter the document to update.
     * @param {Object} [update={}] - The update operations to apply to the matching document.
     * @returns {Promise<number>} A Promise that resolves to 1 if a document was updated, 0 otherwise.
     /**
     * Update a single document in the collection that matches the query.
     * @throws {lowstorageError} If the updateOne operation fails.
     * @throws {SchemaValidationError} If the schema is not defined for the collection.
     * @throws {DocumentValidationError} If the updated document is invalid.
     * @throws {S3OperationError} If the S3 operation fails.
     */
    updateOne(query?: Record<string, any>, update?: Record<string, any>, options?: Record<string, any>): Promise<number>;
    /**
     * Delete documents from the collection.
     * @param {Object} [query={}] - The query to filter documents to delete.
     * @returns {Promise<number>} A Promise that resolves to the number of documents deleted.
     * @throws {lowstorageError} If the delete operation fails.
     * @throws {S3OperationError} If the S3 operation fails.
     */
    delete(query?: Object): Promise<number>;
    /**
     * Delete all documents from the collection.
     * @returns {Promise<number>} A Promise that resolves to the number of documents deleted.
     * @throws {lowstorageError} If the delete operation fails.
     * @throws {S3OperationError} If the S3 operation fails.
     */
    deleteAll(): Promise<number>;
    /**
     * Count the number of documents in the collection.
     * @param {Object} [query={}] - The query to filter documents.
     * @returns {Promise<number>} A Promise that resolves to the number of documents in the collection.
     * @throws {lowstorageError} If the count operation fails.
     */
    count(query?: Object): Promise<number>;
    renameCollection(newColName: string, newSchema?: Object): Promise<Collection>;
}
export { lowstorage, lowstorageError, lowstorage_ERROR_CODES };
