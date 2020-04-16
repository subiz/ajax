var test = require('tape')
var ajax = require('./ajax.js')
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
ajax.env.XMLHttpRequest = XMLHttpRequest

test('call cb multiple time', t => {
	var flow = 0
	ajax.get('https://httpstat.us/200', () => {
		flow++
		throw new Error('sample err')
	})
	setTimeout(() => {
		t.equal(flow, 1)
		t.end()
	}, 3000)
})

test('waterfall', t => {
	ajax.waterfall(
		[
			function (param, cb) {
				t.equal(param.a, 1)
				param.a = 2
				setTimeout(cb)
			},
			function (param, cb) {
				t.equal(param.a, 2)
				param.a = 3
				setTimeout(cb)
			},
		],
		{ a: 1 },
		param => {
			t.equal(param.a, 3)
			t.end()
		}
	)
})

test('get 200', t => {
	ajax.get('https://httpstat.us/200', (err, body, code) => {
		t.equal(err, undefined)
		t.equal(body, '200 OK')
		t.equal(code, 200)
		t.end()
	})
})

test('get 404', t => {
	ajax.env.XMLHttpRequest = XMLHttpRequest
	ajax.get('https://httpstat.us/404', (err, body, code) => {
		t.equal(err, undefined)
		t.equal(body, '404 Not Found')
		t.equal(code, 404)
		t.end()
	})
})

test('get 500', t => {
	ajax.env.XMLHttpRequest = XMLHttpRequest
	ajax.get('https://httpstat.us/500', undefined, (err, body, code) => {
		t.equal(err, undefined)
		t.equal(body, '500 Internal Server Error')
		t.equal(code, 500)
		t.end()
	})
})

test('post JSON 200', t => {
	ajax.env.XMLHttpRequest = XMLHttpRequest
	ajax.
		contentTypeJson().
		setParser('json').
		post('https://httpbin.org/anything', { a: 5, b: 6 }, (err, body, code) => {
			t.equal(err, undefined)
			t.equal(body.json.a, 5)
			t.equal(body.json.b, 6)
			t.equal(code, 200)
			t.end()
		})
})

test('before hook error', t => {
	ajax.
		beforeHook((param, cb) => {
			param.request = param.request.addQuery('a', 'xinchao')
			cb()
		}).
		beforeHook((param, cb) => {
			param.error = 'just an sample error'
			cb(false)
		}).
		setParser('json').
		get('https://postman-echo.com/get', (err, body, code) => {
			t.equal(code, 0)
			t.equal(err, 'just an sample error')
			t.equal(body, undefined)
			t.end()
		})
})

test('before hook', t => {
	ajax.
		beforeHook((param, cb) => {
			param.request = param.request.addQuery('a', 'xinchao')
			cb()
		}).
		beforeHook((param, cb) => {
			cb(false)
		}).
		beforeHook((param, cb) => {
			param.request = param.request.addQuery('b', 6)
			cb()
		}).
		setParser('json').
		get('https://postman-echo.com/get', (err, body, code) => {
			t.equal(code, 200)
			t.equal(err, undefined)
			t.equal(body.args.a, 'xinchao')
			t.equal(body.args.b, undefined)
			t.end()
		})
})

test('after hook retry fail', t => {
	var count = 0
	let req = ajax.
		afterHook((param, cb) => {
			if (param.code !== 500) return cb()
			count++
			var retry = param.request.meta.retry || 0
			if (retry === 3) return cb()
			var req = param.request.setMeta('retry', retry + 1) // increase counter
			req[req.method]('', (err, body, code) => {
				// continue retry
				param.code = code
				param.body = body
				param.err = err
				cb()
			})
		}).
		get('https://httpstat.us/500', (err, body, code) => {
			t.equal(count, 4)
			t.equal(code, 500)
			t.equal(body, '500 Internal Server Error')
			t.equal(err, undefined)
			t.end()
		})
})

test('after hook retry success', t => {
	var count = 0
	let req = ajax.
		afterHook((param, cb) => {
			if (param.code !== 500) return cb()
			count++
			var retry = param.request.meta.retry || 0
			if (retry === 2) {
				param.request = param.request.setBaseUrl('https://httpstat.us/200')
			}
			if (retry === 3) return cb() // give up
			var req = param.request.setMeta('retry', retry + 1) // increase counter
			// continue retry
			req[req.method]('', (err, body, code) => {
				param.code = code
				param.body = body
				param.err = err
				cb()
			})
		}).
		get('https://httpstat.us/500', (err, body, code) => {
			t.equal(count, 3)
			t.equal(code, 200)
			t.equal(body, '200 OK')
			t.equal(err, undefined)
			t.end()
		})
})
