<h1>
  lowstorage | for edges & S3-compatible storages
  <br>
</h1>

> <strong>Simple, single-dependency (@aws-sdk based), object pseudo-database for S3-compatible storages, strongly inspired by lowdb 🤗(https://github.com/typicode/lowdb/).</strong> <br> ![AWS S3](https://img.shields.io/badge/AWS%20S3-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white) ![Cloudflare R2](https://img.shields.io/badge/Cloudflare%20R2-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white) [![GitHub issues](https://img.shields.io/github/issues/good-lly/lowstorage)](https://github.com/good-lly/lowstorage/issues/) [![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/good-lly/lowstorage/blob/master/LICENSE) <a href="https://github.com/good-lly/lowstorage/issues/"> <img src="https://img.shields.io/badge/contributions-welcome-red.svg" alt="Contributions welcome" /></a>

[[github](https://github.com/good-lly/lowstorage)] [[npm](https://www.npmjs.com/package/lowstorage)]

## Sponsors

[Become a sponsor and have your company logo here](https://github.com/sponsors/good-lly) 👉 [GitHub Sponsors](https://github.com/sponsors/good-lly)

### Important Notice

`lowstorage` is primarily designed for small, hobby, or personal projects. We advise extreme caution when using `lowstorage` for critical applications or production environments, as it may not offer the robustness or features required for such use cases.

### Breaking Changes

#### Version 2

Since version 2.0.0, `lowstorage` has undergone significant changes:

- **Constructor Changes**: The constructor now accepts S3-compatible configuration instead of being tied to Cloudflare R2.
- **Support for Multiple Storages**: Now supports any S3-compatible storage like AWS S3, Cloudflare R2, Minio, Ceph, etc.

If you are migrating from version 1.x.x, please review the new constructor parameters and usage examples below.

### Cloudflare R2 - S3 API Compatibility

R2 implements the S3 API to allow users and their applications to migrate with ease. When comparing to AWS S3, Cloudflare has removed some API operations’ features and added others. The S3 API operations are listed below with their current implementation status. Feature implementation is currently in progress. Refer back to this page for updates. The API is available via the `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` endpoint. Find your account ID in the Cloudflare dashboard.

#### Bucket region

When using the S3 API, the region for an R2 bucket is `auto`. For compatibility with tools that do not allow you to specify a region, an empty value and `us-east-1` will alias to the `auto` region.

### lowstorage Usage

```js
import lowstorage from 'lowstorage';
// Initialize object and get users collection
const storage = new lowstorage({
	endPoint: 'play.min.io',
	port: 80,
	region: 'auto',
	useSSL: true,
	accessKey: 'Q3AM3UQ867SPQQA43P2F',
	secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
	bucketName: 'mybucket',
});
const userCol = storage.collection('users');

// Add new user
const newUser = await userCol.insert({
	name: 'Kevin',
	gender: 'whatever',
	posts: [],
});

// Show all users
const allUsers = await userCol.find({});

// Find users with pagination (e.g., page 2, 10 users per page)
const secondPageUsers = await userCol.find({}, { skip: 10, limit: 10 });

// Find user by ID and update name
await userCol.update({ _id: id }, { name: 'Carlos' });
```

## Features

- **Lightweight**
- **Minimalist**
- **Familiar API**
- **S3-compatibility**
- **Plain JavaScript**
- **Signle-dependency ([@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3))**

## Install

```sh
npm install lowstorage
```

#### Why S3-Compatible Storage?

> S3-compatible storages provide a reliable, scalable, and widely supported option for object storage. Platforms like AWS S3, Cloudflare R2, Minio and Ceph offer robust infrastructure with various features and pricing models to suit different needs.

### Setup & config

To set up and bind your storage, configure your storage client with the appropriate credentials and bucket information. Here is an example setup for AWS S3:

```js
const storage = new lowstorage({
	endPoint: 's3.amazonaws.com',
	useSSL: true,
	region: 'YOUR-REGION',
	accessKey: 'YOUR-ACCESSKEYID',
	secretKey: 'YOUR-SECRETACCESSKEY',
	bucketName: 'your-bucket-name',
});
```

For Cloudflare R2, follow similar steps with your R2-specific endpoint and credentials.

## API

**collection(colName)**

- **Input**: A string representing the name of the collection.
- **Behavior**: Creates or accesses a collection with the given name.
- **Returns**: An instance of the Collection class corresponding to the specified collection name.

- **insert(doc)**

- **insert(doc)**

  - **Input**: A single object or an array of objects to insert into the collection.
  - **Behavior**: Inserts the given document(s) into the collection. If an `_id` is not provided, a unique identifier is automatically generated using `crypto.randomUUID()`.
  - **Returns**: The inserted document(s), with an `_id` property assigned to each if not already present.

- **find(query, options)**

  - **Input**:
    - `query`: A query object to match documents.
    - `options`: An optional object for pagination, containing `skip` and `limit` properties.
  - **Behavior**: Searches for documents matching the query. Supports pagination through `options`.
  - **Returns**: A promise that resolves to an array of matching documents, considering any pagination specified.

- **findOne(query)**

  - **Input**: A query object.
  - **Behavior**: Similar to `find`, but it returns only the first matching document.
  - **Returns**: A promise that resolves to a single document or `null` if no match is found.

- **update(query, update)**

  - **Input**: A query object and an update object.
  - **Behavior**: Updates all documents that match the query with the provided update data.
  - **Returns**: A promise that resolves to the number of documents updated.

- **updateOne(query, update)**

  - **Input**: A query object and an update object.
  - **Behavior**: Updates the first document that matches the query with the provided update data.
  - **Returns**: A promise that resolves to `1` if a document is updated, otherwise `0`.

- **delete(query)**

  - **Input**: A query object to match documents for deletion.
  - **Behavior**: Deletes documents matching the query.
  - **Returns**: A promise that resolves to the number of documents deleted.

- **remove()**

  - **Behavior**: Removes all documents from the collection.
  - **Returns**: A promise that resolves to the number of documents removed.

- **count(query)**
  - **Input**: A query object (optional).
  - **Behavior**: Counts the number of documents that match the query. If no query is provided, it counts all documents in the collection.
  - **Returns**: A promise that resolves to the count of matching documents.

**listCollections()**

- **Behavior**: Lists all collections stored in the Cloudflare R2 bucket associated with the lowstorage instance. (All files ending with .json)
- **Returns**: A promise that resolves to an array of collection names.

## Examples

Check out [dummy examples](https://github.com/good-lly/lowstorage/tree/master/examples)
Run:

```javascript
cd examples
npm install
npm run dev
```

for testing:

```javascript
npm run test
```

It starts local wrangler with ENV and toml config from your /examples folder to run tests.

## Limitations

- <s>no test coverage</s> (wip) lowstorage is using end to end tests via its examples
- response speed (no benchmarks so far)
- use carefully!

## Contribution

Feel free to dive in! [Open an issue](https://github.com/good-lly/lowstorage/issues/new) or submit PRs.

Standard Readme follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) [Code of Conduct](https://github.com/good-lly/lowstorage/blob/master/CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
