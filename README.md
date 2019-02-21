# @subiz/ajax
* *exception-free*
* simple
* tiny
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

// try to making GET https://app.subiz.net/v4/ping

let req = new ajax.newRequest()
  .setBase("https://app.subiz.net/v4/")
  .setPath("ping")
  .setMethod("GET")

// or

let req = new ajax.newRequest().get("https://app.subiz.net/v4/", "ping")

// or even shorter

let req = new ajax.get("https://app.subiz.net/v4/", "ping")

```

### Derived from old object
```
req = req.post(undefined, "ping")
// POST https://app.subiz.net/v4/ping

// send get request to https://app.subiz.net/v4/ping
let [code,body, err] = await req.setPath("ping").send()
// [200, '{"message":"pong from dashboard backend"}', undefined]

// tell Ajax to parse json for us
[code, body, err] = await req.setPath("ping").setParser("json").send()
// [200, {message: "ping from dashboard backend"}, undefined

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
create a new derived object by removing all before hooks and inject hooks

#### `injectHook(promise)`
create a new derived object by registering (appending) a inject hook

#### `setPath(path)`
create a new derived object by changing old request path. New request url will be compose from `base` and `path`.

#### `setHeader(header)`
create a new derived object by merging old header with new header

examples:
```js
req = req.setHeader({"x-real-ip": "193.155.45.3"})
```
#### `get(base, path)`
#### `post(base, path)`
#### `put(base, path)`
#### `del(base, path)`
#### `head(base, path)`
#### `patch(base, path)`
#### `setBase`
#### `setMethod`
#### `contentTypeJson`
#### `contentTypeForm`
#### `setContentType`
#### `setParser`
#### `send`

### Ajax object (singleton)
Ajax object is lets you create request object. Available requests:
+ `newRequest()`: // create new empty request
+ `get([base, path])`: // create new GET request to address (base+path)
+ `post([base, path])`: // create new POST request to address (base+path)
+ `put([base, path])`: // create new PUT request to address (base+path)
+ `del([base, path])`: // create new DELETE request to address (base+path)
+ `head([base, path])`: // create new HEAD request to address (base+path)
+ `patch([base, path])`: // create new PATCH request to address (base+path)

### Before hook
*before hooks* let you modify the request right before sending it.
You register a *before hook* by calling `beforeHook`. beforeHook function return a promise and take in a reference to the request object as parameter.

for examples: to add query `?a=5` and `?b=6` right before sending the request
```js
let req = ajax.get("https://google.com")

req = req.beforeHook(async param => {
  param.request = param.request.addQuery('a', 5)
}).beforeHook(async param => {
  param.request = param.request.addQuery('b', 6)
})

await req.send() // https://google.com?a=5&b=6
```

before hook is called one by one in registered order, which hook registered first will be called
first.

### With hooks
```
const apireq = new ajax.Request()
  .setBase("https://appv4.subiz.com/4.0/")
  .setMethod("GET")
  .injectHook(async param => {
    if (param.code == 200) return true
    let err
    try {
      err = JSON.parse(param.body)
    } catch (e) {}

    if (!err) return true
    if (err.code !== 'invalid_access_token' &&
	  err.code !== 'invalid_credential') return true

    if (refreshing_state === 'normal') {
      refreshing_state = 'refreshing'
      let [code, body] = await new ajax.Request()
        .setMethod('post')
        .setBase("http://app.subiz.net/v4/refresh-token")
        .send()

      if (code != 200) {
        refreshing_state = 'dead'
        return true
      }

      refreshing_state = 'normal'
    } else if (refreshing_state == 'dead') {
      return true
    } else {
      for (; refreshing_state != 'refreshing';) await sleep(200)
      if (refreshing_state == 'dead') return true
    }

    // resent
    let [code, body, err1] = await param.req.send()

    if (err1) return true
    param.code = code
    param.body = JSON.stringify(body)

    return true
})

let [code, body, err] = await apireq.setPath("me").send()

```
