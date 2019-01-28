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

# Usage

### Simple
```
const ajax = require('@subiz/ajax')

const dashreq = new ajax.Request()
  .setBase("https://app.subiz.net/v4/")
  .setMethod("GET")

// send get request to https://app.subiz.net/v4/ping
let [code,body, err] = await dashreq.setPath("ping").send()
// [200, '{"message":"pong from dashboard backend"}', undefined]

// tell Ajax to parse json for us
[code, body, err] = await dashreq.setPath("ping").setParser("json").send()
// [200, {message: "ping from dashboard backend"}, undefined

```
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
