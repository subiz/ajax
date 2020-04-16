[![npm][npm]][npm-url]
[![deps][deps]][deps-url]
[![size][size]][size-url]

# @subiz/ajax@1.0.29
* *exception-free*
* simple
* tiny (2K Gzipped)
* zero dependencies
* *immutable*

fetch api wrapper

# Work in progress
0. docs
1. add timeout options

## Usage

### Simple
```
const ajax = require('@subiz/ajax')

// try to making GET https://httpstat.us/200

let res = await ajax.get("https://httpstat.us/200")
console.log(req.body, res.code, res.error) // "200, OK" 200 undefined

```

### Derived from old object
```
var req = ajax.setBaseUrl("https://httpstat.us")
res = await req.post("200")
// POST https://httpstat.us/200

```
## References
### Request object
Request objects represences HTTP request.

Request object are immutable, which mean, you cannot change its current state or data. Immutiblity makes object behavious more predictable, reducing bug.

The object's state is initialize once when creating the object. You can create request object by either using Ajax object or making a derived object from old one.

Available methods:
#### `addQuery(key, value)`
create a new derived object by appending new (key, value) pair into old request query

#### `removeQuery(key)`
create a new derived object by removing a (key, value) pair from old request query

#### `setQuery(query)`
create a new derived object by replacing old query with new one.

examples:
```js
req = req.setQuery({a:"xin chao", b: 6})
```

#### `beforeHook(promise)`
create a new derived object by registering (appending) a before hook

#### `clearHooks`
create a new derived object by removing all before hooks and after hooks

#### `afterHook(promise)`
create a new derived object by registering (appending) a hook

#### `setBaseUrl(url)`
create a new derived object by changing old request base url. New derived request with relative url will be append to this base url.

#### `setHeader(header)`
create a new derived object by merging old header with new header

#### `setMeta(key, value)`
attach hidden metadata to request, those key-value will not be sent to the server, designed to keep state in hooks

examples:
```js
req = req.setHeader({"x-real-ip": "193.155.45.3"})
```
#### `get(url, data, cb)`
#### `post(url, data, cb)`
#### `put(url, data, cb)`
#### `del(url, data, cb)`
#### `head(url, data, cb)`
#### `patch(url, data, cb)`
#### `setBaseUrl`
#### `setMethod`
#### `contentTypeJson`
#### `contentTypeForm`
#### `setContentType`
#### `setParser`
#### `send`
#### `setMeta`

### Ajax object (singleton)
Ajax object is lets you create request object. Available requests:
+ `get(url)`: // create new GET request to address
+ `post(url)`: // create new POST request to address
+ `put(url)`: // create new PUT request to address
+ `del(url)`: // create new DELETE request to address
+ `head(url)`: // create new HEAD request to address
+ `patch(url)`: // create new PATCH request to address

### Before hook
*before hooks* let you modify the request right before sending it.
You register a *before hook* by calling `beforeHook`. beforeHook function return a promise and take in a reference to the request object as parameter.

for examples: to add query `?a=5` and `?b=6` right before sending the request
```js
let req = ajax.setBaseUrl("https://google.com")

req = req.beforeHook(async param => {
  param.request = param.request.addQuery('a', 5)
}).beforeHook(async param => {
  param.request = param.request.addQuery('b', 6)
})

await req.get() // https://google.com?a=5&b=6
```

before hook is called one by one in registered order, which hook registered first will be called
first.

### With after hook
```
const apireq = ajax
  .setBaseUrl("https://appv4.subiz.com/4.0/")
  .afterHook(param => {
		if (param.code !== 500) return
		var retry = param.request.meta.retry || 0
		if (retry === 3) return
		var req = param.request.setMeta('retry', retry + 1) // increase number of attempt
		// continue retry
		return req.get().then(out => {
			var [code, body, err] = out
			param.code = code
			param.body = body
			param.err = err
		})
	})
})

let [code, body, err] = await apireq.get("me")

```

[npm]: https://img.shields.io/npm/v/@subiz/ajax.svg
[npm-url]: https://npmjs.com/package/@subiz/ajax
[deps]: https://david-dm.org/@subiz/ajax.svg
[deps-url]: https://david-dm.org/@subiz/ajax
[size]: https://packagephobia.now.sh/badge?p=@subiz/ajax
[size-url]: https://packagephobia.now.sh/result?p=@subiz/ajax
