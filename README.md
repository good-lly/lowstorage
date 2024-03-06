<h1>
  lowstorage | for Workers using R2
  <br>
</h1>

> <strong>Simple, zero-dependency, object pseudo-database for Cloudflare Workers using R2 buckets, strongly inspired by lowdb 🤗(https://github.com/typicode/lowdb/).</strong> <br> ![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white) [![GitHub issues](https://img.shields.io/github/issues/good-lly/lowstorage)](https://github.com/good-lly/lowstorage/issues/) [![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/good-lly/lowstorage/blob/master/LICENSE) <a href="https://github.com/good-lly/lowstorage/issues/"> <img src="https://img.shields.io/badge/contributions-welcome-red.svg" alt="Contributions welcome" /></a>

[[github](https://github.com/good-lly/lowstorage)] [[npm](https://www.npmjs.com/package/lowstorage)]

## Sponsors

![GitHub Sponsors](https://img.shields.io/github/sponsors/good-lly)

[Become a sponsor and have your company logo here](https://github.com/sponsors/good-lly) 👉 [GitHub Sponsors](https://github.com/sponsors/good-lly)

### Important Notice

While Cloudflare R2 operates on a strongly consistent model ([reference](https://developers.cloudflare.com/r2/reference/consistency/)), it's important to note that `lowstorage` is primarily designed for small, hobby, or personal projects. We advise extreme caution when using `lowstorage` for critical applications or production environments, as it may not offer the robustness or features required for such use cases.

### Usage

```js
import lowstorage from 'lowstorage';
// Initialize object and get users collection
const usersCol = await lowstorage(env, 'MY_TESTING_BUCKET').collection('users');

// Add new user
// you can provide _id or it will be generated as crypto.randomUUID();  -> https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
const newUser = await usersCol.insert({
	name: 'Kevin',
	gender: 'whatever',
	posts: [],
});

// Find users with pagination (e.g., page 2, 10 users per page)
const secondPageUsers = await usersCol.find().skip(10).limit(10);

// Show all users
const allUsers = usersCol.find({});

// Find user by ID and update name
await usersCol.update({ _id: id }, { name: 'Carlos' });
```

## Features

- **Lightweight**
- **Minimalist**
- **Familiar API**
- **plain JavaScript**
- **Zero-dependency**

## Install

```sh
npm install lowstorage
```

#### Why Cloudflare R2?

> Seamless migration, robust free tier, Nonee gress fees. Dive into the future of data storage with Cloudflare R2 https://developers.cloudflare.com/r2/

#### Included features in Forever Free R2 tier

> - Storage: 10 GB/month
> - Class A operations (mutate state): 1,000,000 / month
> - Class B operations (read state): 10,000,000 / month
> - [more details on pricing R2](https://www.cloudflare.com/plans/developer-platform/#overview)

### Setup & binding R2 to your worker

1. In the Cloudflare console, go to R2 (left navigation)
2. Click Create Bucket
3. Enter any bucket name you want (we use testing-lowstorage)
4. Click Create Bucket (bottom)
5. Go to 'Worker & Pages'
6. Click on your worker (or create new one)
7. Go to 'Settings' -> Variables
8. In section 'R2 Bucket Bindings' click EDIT VARIABLES
9. Hit '+ Add Binding' and pick variable name (we use 'MY_TESTING_BUCKET') and select your R2 bucket
10. Click 'Save & Deploy'

Check out [wrangler.toml from examples](https://github.com/good-lly/lowstorage/blob/master/examples/wrangler.toml#L22)

> Insctructions with pictures https://github.com/gfodor/p2pcf/blob/master/INSTALL.md#set-up-the-r2-bucket

## API

**collection(colName)**

- **Input**: A string representing the name of the collection.
- **Behavior**: Creates or accesses a collection with the given name.
- **Returns**: An instance of the Collection class corresponding to the specified collection name.

- **insert(doc)**

  - **Input**: A single object or an array of objects.
  - **Behavior**: Inserts the given document(s) into the collection. Each document is assigned a unique identifier if it doesn't already have one.
  - **Returns**: A promise that resolves when the insert operation is complete.

- **find(query)**

  - **Input**: A query object (e.g., `{_id: id}`).
  - **Behavior**: Searches for documents that match the query.
  - **Returns**: A promise that resolves to an array of matching documents.

- **_skip(numToSkip)_** Skips the specified number of documents in query results. Use this for pagination (e.g., skipping the first page of results). Returns the updated collection instance to allow chaining.

- **_limit(numToLimit)_** Limits the number of documents returned by query results. Use this for pagination (e.g., limiting to 10 results per page). Returns the updated collection instance to allow chaining.

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

  - **Input**: A query object.
  - **Behavior**: Deletes documents that match the query.
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

## Limitations

- no test coverage, use carefully
- response speed (no benchmarks so far)

## Contribution

Feel free to dive in! [Open an issue](https://github.com/good-lly/lowstorage/issues/new) or submit PRs.

Standard Readme follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) [Code of Conduct](https://github.com/good-lly/lowstorage/blob/master/CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
