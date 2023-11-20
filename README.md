# lowstorage

> Zero-dependency, simple pseudo-database on Cloudflare R2, strongly inspired by lowdb 🤗(https://github.com/typicode/lowdb/).

Usage:
_lowstorage is a pure ESM package. If you're having trouble using it in your project, please [read this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)._

```js
import lowstorage from 'lowstorage';
// Initialize object and get users collection
const usersCol = await lowStorage(env, 'MY_TESTING_BUCKET').collection('users');

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

// Add post to newUser
await newUser.posts.insert({ title: 'this is awesome' });
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

## API

- insert (object {} or array [] of objects) - return array

- find(query object eg. {\_id: id}) - return array of objects
- findOne - same as find, but return only array of one object

- update
- updateOne

- remove

- count (not implemented)
