# lowstorage

> Zero-dependency, simple pseudo-database on Cloudflare R2, strongly inspired by lowdb 🤗(https://github.com/typicode/lowdb/).

## Sponsors

[Become a sponsor and have your company logo here](https://github.com/sponsors/good-lly) 👉 [GitHub Sponsors](https://github.com/sponsors/good-lly)

### Usage

_lowstorage is a pure ESM package. If you're having trouble using it in your project, please [read this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)._

```js
import lowstorage from 'lowstorage';
// Initialize object and get users collection
const usersCol = await lowstorage(env, 'MY_TESTING_BUCKET').collection('users');

// Add new user
const newUser = await usersCol.insert({
	name: 'Kevin',
	gender: 'whatever',
	posts: [],
});

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

But after all, it seems quite slow ...

## API

- insert (object {} or array [] of objects) - return array

- find(query object eg. {\_id: id}) - return array of objects
- findOne - same as find, but return only array of one object, equivalent to the db.collection.find(query)

- update - (query{} , update {}) - return promise of updated objects
- updateOne - same as update, but very limited

- delete (query {}) delete specific file or all inside collection

- remove () - removing all files inside collection

- count () - is equivalent to the db.collection.find(query).count() construct

## Examples

Check out 👉 [dummy examples](https://github.com/good-lly/lowstorage/examples)

## Limitations

- no test coverage, use carefully
- inserting 1000+ entries results in hitting request limit:

```python
	Error: Too many API requests by single worker invocation.
```
