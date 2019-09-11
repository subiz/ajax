var test = require('tape')
var fetch = require('node-fetch')
var ajax = require('./src/ajax.js')
ajax.env.fetch = fetch
// ajax.env.window = {}

test('before hook error', async t => {
	let req = ajax.
		get().
		beforeHook(async param => {
			param.request = param.request.addQuery('a', 'xinchao')
		}).
		beforeHook(async param => {
			param.stop = true
			param.error = 'just an sample error'
		})

	let [code, body, err] = await req.
		get('https://postman-echo.com/get').
		setParser('json').
		send()

	t.equal(code, 0)
	t.equal(err, 'just an sample error')
	t.equal(body, undefined)
	t.end()
})

test('before hook', async t => {
	let req = ajax.
		get().
		beforeHook(async param => {
			param.request = param.request.addQuery('a', 'xinchao')
		}).
		beforeHook(async param => {
			param.stop = true
		}).
		beforeHook(async param => {
			param.request = param.request.addQuery('b', 6)
		})

	let [code, body, err] = await req.
		get('https://postman-echo.com/get').
		setParser('json').
		send()

	t.equal(code, 200)
	t.equal(err, undefined)
	t.equal(body.args.a, 'xinchao')
	t.equal(body.args.b, undefined)
	t.end()
})

test('normal case', async t => {
	var [code, body, err] = await ajax.get('https://httpstat.us/200').send()
	t.equal(code, 200)
	t.equal(body, '200 OK')
	t.equal(err, undefined)

	var [code, body, err] = await ajax.get('https://httpstat.us/400').send()
	t.equal(code, 400)
	t.equal(body, '400 Bad Request')
	t.equal(err, undefined)

	t.end()
})

test('after hook retry fail', async t => {
	var count = 0
	let req = ajax.get().afterHook(param => {
		if (param.code !== 500) return
		count++
		var retry = param.request.getMeta('retry') || 0
		if (retry === 3) return
		var req = param.request.setMeta('retry', retry + 1) // increase counter
		// continue retry
		return req.send().then(out => {
			var [code, body, err] = out
			param.code = code
			param.body = body
			param.err = err
		})
	})

	let [code, body, err] = await req.get('https://httpstat.us/500').send()
	t.equal(count, 4)
	t.equal(code, 500)
	t.equal(body, '500 Internal Server Error')
	t.equal(err, undefined)
	t.end()
})

test('after hook retry success', async t => {
	var count = 0
	let req = ajax.get().afterHook(param => {
		if (param.code !== 500) return
		count++
		var retry = param.request.getMeta('retry') || 0
		if (retry === 2) {
			param.request = param.request.get('https://httpstat.us/200')
		}
		if (retry === 3) return // give up
		var req = param.request.setMeta('retry', retry + 1) // increase counter
		// continue retry
		return req.send().then(out => {
			var [code, body, err] = out
			param.code = code
			param.body = body
			param.err = err
		})
	})

	let [code, body, err] = await req.get('https://httpstat.us/500').send()
	t.equal(count, 3)
	t.equal(code, 200)
	t.equal(body, '200 OK')
	t.equal(err, undefined)
	t.end()
})
