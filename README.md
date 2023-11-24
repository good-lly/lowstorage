<h1>
  lowstorage
  <br>
</h1>

> <strong>Zero-dependency, simple pseudo-database on Cloudflare R2, strongly inspired by lowdb 🤗(https://github.com/typicode/lowdb/).<strong>
> <br>

[![GitHub issues](https://img.shields.io/github/issues/good-lly/lowstorage)](https://github.com/good-lly/lowstorage/issues/)
[![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/good-lly/lowstorage/blob/master/LICENSE)
<a href="https://github.com/good-lly/lowstorage/issues/">
<img src="https://img.shields.io/badge/contributions-welcome-red.svg"
      alt="Contributions welcome" />
</a>

## Sponsors

![GitHub Sponsors](https://img.shields.io/github/sponsors/good-lly)

[Become a sponsor and have your company logo here](https://github.com/sponsors/good-lly) 👉 [GitHub Sponsors](https://github.com/sponsors/good-lly)

### Usage

_lowstorage is a pure ESM package. If you're having trouble using it in your project, please [read this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)._

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

- insert (object {} or array [] of objects) - return array - check #Limitations

- find(query object eg. {\_id: id}) - return array of objects
- findOne - same as find, but return only array of one object, equivalent to the db.collection.find(query)

- update - (query{} , update {}) - return promise of updated objects
- updateOne - same as update, but very limited

- delete (query {}) delete specific file or all inside collection

- remove () - removing all files inside collection

- count () - is equivalent to the db.collection.find(query).count() construct

## Examples

Check out [dummy examples](https://github.com/good-lly/lowstorage/tree/master/examples)

## Limitations

- no test coverage, use carefully
- response speed (no benchmarks so far)
- inserting 1000+ entries results in hitting request limit

```python
	Error: Too many API requests by single worker invocation.
```

## Contribution

Feel free to dive in! [Open an issue](https://github.com/good-lly/lowstorage/issues/new) or submit PRs.

Standard Readme follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) [Code of Conduct](https://github.com/good-lly/lowstorage/blob/master/CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
