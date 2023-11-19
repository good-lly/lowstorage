# lowstorage

> Zero-dependency, simple pseudo-database on Cloudflare R2, strongly inspired by lowdb 🤗(https://github.com/typicode/lowdb/).

Example:

```js
// Initialize object and get users collection
const usersCol = await LowStorage(env, 'MY_TESTING_BUCKET').collection('users');

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

-   **Lightweight**
-   **Minimalist**
-   **Familiar API**
-   **plain JavaScript**
-   **Zero-dependency**

## Install

```sh
npm install lowstorage
```

#### Why Cloudflare R2?

> Seamless migration, robust free tier, Nonee gress fees. Dive into the future of data storage with Cloudflare R2 https://developers.cloudflare.com/r2/

## API

##### C

-   insert(object {} or array [] of objects) - return array

##### R

-   find(query object eg. {\_id: id}) - return array of objects
-   findOne - same as find, but return only array of one object

##### U

-   update
-   updateOne

##### D

-   remove

##### Utils

-   count (not implemented)
