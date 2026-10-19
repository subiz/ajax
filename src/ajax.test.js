const assert = require('node:assert/strict')
const {test} = require('node:test')
const ajax = require('./ajax.js')

// Exercise both transport adapters without relying on external HTTP services.
function mockTransport(t, transport) {
	const requests = []
	const originalXHR = ajax.env.XMLHttpRequest
	t.after(() => {
		ajax.env.XMLHttpRequest = originalXHR
	})
	function respond(url, options) {
		requests.push({url, ...options})
		const parsed = new URL(url)
		const status = Number(parsed.pathname.slice(1)) || 200
		const text = parsed.pathname === '/echo'
			? JSON.stringify({args: Object.fromEntries(parsed.searchParams), json: options.body && JSON.parse(options.body)})
			: {200: '200 OK', 404: '404 Not Found', 500: '500 Internal Server Error'}[status]
		return {status, text}
	}
	if (transport === 'fetch') {
		ajax.env.XMLHttpRequest = undefined
		t.mock.method(global, 'fetch', async (url, options) => {
			const response = respond(url, options)
			return {status: response.status, text: async () => response.text}
		})
	} else {
		ajax.env.XMLHttpRequest = class {
			open(method, url) {
				this.method = method
				this.url = url
				this.headers = {}
			}
			setRequestHeader(key, value) {
				this.headers[key] = value
			}
			send(body) {
				const response = respond(this.url, {method: this.method, headers: this.headers, body})
				queueMicrotask(() => {
					this.status = response.status
					this.responseText = response.text
					this.readyState = 4
					this.onreadystatechange()
				})
			}
		}
	}
	return requests
}

test('waterfall passes state through asynchronous steps', async () => {
	const seen = []
	const result = await new Promise((resolve) => {
		ajax.waterfall([
			(param, cb) => {
				seen.push(param.a)
				param.a = 2
				setImmediate(cb)
			},
			(param, cb) => {
				seen.push(param.a)
				param.a = 3
				setImmediate(cb)
			},
		], {a: 1}, resolve)
	})
	assert.deepEqual(seen, [1, 2])
	assert.deepEqual(result, {a: 3})
})

test('setMeta does not mutate the parent request', () => {
	const parent = ajax.setMeta('retry', 1)
	const child = parent.setMeta('retry', 2)
	assert.deepEqual(ajax.meta, {})
	assert.deepEqual(parent.meta, {retry: 1})
	assert.deepEqual(child.meta, {retry: 2})
})

for (const transport of ['xhr', 'fetch']) {
	test(`${transport}: calls a throwing callback only once and resolves`, async (t) => {
		mockTransport(t, transport)
		let calls = 0
		const result = await ajax.get('https://example.invalid/200', () => {
			calls++
			throw new Error('sample err')
		})
		assert.equal(calls, 1)
		assert.deepEqual(result, {error: undefined, body: '200 OK', code: 200})
	})

	for (const [status, body] of [[200, '200 OK'], [404, '404 Not Found'], [500, '500 Internal Server Error']]) {
		test(`${transport}: get ${status}`, async (t) => {
			mockTransport(t, transport)
			const callbacks = []
			const cb = (...args) => callbacks.push(args)
			const url = `https://example.invalid/${status}`
			const result = await (status === 500 ? ajax.get(url, undefined, cb) : ajax.get(url, cb))
			assert.equal(result.code, status)
			assert.equal(result.body, body)
			if (status === 200) assert.equal(result.error, undefined)
			else {
				assert.equal(result.error.code, 'not_200,retry')
				assert.equal(result.error.number, 'SBZ-EQCN200')
			}
			// Assertions belong outside callbacks: the library deliberately catches callback errors.
			assert.deepEqual(callbacks, [[result.error, body, status]])
		})
	}

	test(`${transport}: serializes arrays without repeating previous query parameters`, async (t) => {
		const requests = mockTransport(t, transport)
		const data = {a: 1, tags: ['x', 'y', undefined, null, 'a & b'], empty: [], omitted: [undefined], z: 2}
		const encoded = 'a=1&tags=x&tags=y&tags&tags=a%20%26%20b&z=2'
		await ajax.setQuery(data).get('https://example.invalid/200')
		assert.equal(requests[0].url, `https://example.invalid/200?${encoded}`)
		// Form bodies share the same serializer.
		await ajax.contentTypeForm().post('https://example.invalid/200', data)
		assert.equal(requests[1].body, encoded)
	})

	test(`${transport}: post JSON 200`, async (t) => {
		const requests = mockTransport(t, transport)
		const result = await ajax.contentTypeJson().setParser('json')
			.post('https://example.invalid/echo', {a: 5, b: 6})
		assert.equal(result.error, undefined)
		assert.equal(result.code, 200)
		assert.deepEqual(result.body.json, {a: 5, b: 6})
		assert.equal(requests[0].method, 'post')
		assert.equal(requests[0].body, '{"a":5,"b":6}')
	})

	test(`${transport}: before hook error prevents sending`, async (t) => {
		const requests = mockTransport(t, transport)
		const result = await ajax.beforeHook((param, cb) => {
			param.error = 'just a sample error'
			cb(false)
		}).setParser('json').get('https://example.invalid/echo')
		assert.deepEqual(result, {code: 0, error: 'just a sample error', body: {error: 'just a sample error'}})
		assert.equal(requests.length, 0)
	})

	test(`${transport}: before hook can skip remaining hooks and still send`, async (t) => {
		mockTransport(t, transport)
		let skippedHookCalls = 0
		const result = await ajax.beforeHook((param, cb) => {
			param.request = param.request.addQuery('a', 'xinchao')
			cb()
		}).beforeHook((param, cb) => cb(false)).beforeHook((param, cb) => {
			skippedHookCalls++
			cb()
		}).setParser('json').get('https://example.invalid/echo')
		assert.equal(result.code, 200)
		assert.equal(result.error, undefined)
		assert.deepEqual(result.body.args, {a: 'xinchao'})
		assert.equal(skippedHookCalls, 0)
	})

	for (const succeeds of [false, true]) {
		test(`${transport}: after hook retry ${succeeds ? 'success' : 'failure'}`, async (t) => {
			const requests = mockTransport(t, transport)
			let count = 0
			const result = await ajax.afterHook((param, cb) => {
				if (param.code !== 500) return cb()
				count++
				const retry = param.request.meta.retry || 0
				if (retry === 3) return cb()
				let req = param.request.setMeta('retry', retry + 1)
				if (succeeds && retry === 2) req = req.setBaseUrl('https://example.invalid/200')
				req[req.method]('', (err, body, code) => {
					param.code = code
					param.body = body
					param.err = err
					cb()
				})
			}).get('https://example.invalid/500')
			assert.equal(count, succeeds ? 3 : 4)
			assert.equal(requests.length, 4)
			assert.equal(result.code, succeeds ? 200 : 500)
			assert.equal(result.body, succeeds ? '200 OK' : '500 Internal Server Error')
			if (succeeds) assert.equal(result.error, undefined)
			else {
				assert.equal(result.error.code, 'not_200,retry')
				assert.equal(result.error.number, 'SBZ-EQCN200')
			}
		})
	}
}

test('setHeader leaves content type to setContentType without mutating input or parent', () => {
	const input = {'Content-Type': 'ignored', 'content-type': 'also ignored', 'X-Test': 'keep'}
	const parent = ajax.setHeader(input)
	const child = parent.setHeader({'User-Agent': 'Subiz/Android'})
	assert.deepEqual(parent.headers, {'X-Test': 'keep'})
	assert.deepEqual(child.headers, {'X-Test': 'keep', 'User-Agent': 'Subiz/Android'})
	assert.equal(input['Content-Type'], 'ignored')
	assert.equal(input['content-type'], 'also ignored')
})

for (const transport of ['xhr', 'fetch']) {
	test(`${transport}: sends one content type and skips undefined headers`, async () => {
		const originalXHR = ajax.env.XMLHttpRequest
		const originalFetch = global.fetch
		let sent
		class XMLHttpRequest {
			constructor() {
				this.headers = {}
				this.calls = []
			}
			open() {}
			setRequestHeader(key, value) {
				this.calls.push([key, value])
				key = key.toLowerCase()
				const existing = this.headers[key]
				this.headers[key] = existing === undefined ? String(value) : existing + ', ' + String(value)
			}
			send(body) {
				sent = {headers: this.headers, body, calls: this.calls}
				this.status = 200
				this.responseText = '{}'
				this.readyState = 4
				this.onreadystatechange()
			}
		}
		ajax.env.XMLHttpRequest = transport === 'xhr' ? XMLHttpRequest : undefined
		global.fetch = async (url, options) => {
			const calls = Object.entries(options.headers)
			sent = {
				headers: Object.fromEntries(calls.map(([key, value]) => [key.toLowerCase(), String(value)])),
				body: options.body,
				calls,
			}
			return {status: 200, text: async () => '{}'}
		}
		try {
			for (const contentType of ['text/plain', 'application/json; charset=utf-8', '']) {
				const request = ajax
					.setContentType(contentType)
					.setHeader({'X-Keep': 'yes', 'X-Omit': undefined})
					.beforeHook((param, done) => {
						param.request = param.request.setHeader({'User-Agent': 'Subiz/Android'})
						done(true)
					})
				await request.post(
					'https://example.invalid/test',
					contentType.startsWith('application/json') ? {ok: true} : '{"ok":true}',
				)
				assert.equal(sent.headers['content-type'], contentType || undefined)
				assert.equal(sent.calls.filter(([key]) => key.toLowerCase() === 'content-type').length, contentType ? 1 : 0)
				assert.equal(sent.headers['user-agent'], 'Subiz/Android')
				assert.equal(sent.headers['x-keep'], 'yes')
				assert.equal('x-omit' in sent.headers, false)
				assert.equal(sent.body, '{"ok":true}')
			}
			// Hooks may supply headers directly; the configured content type still wins.
			await ajax
				.setContentType('text/plain')
				.beforeHook((param, done) => {
					param.request.headers = {'content-type': 'wrong', 'Content-Type': undefined, 'X-Omit': undefined}
					done(true)
				})
				.post('https://example.invalid/test', 'body')
			assert.deepEqual(sent.calls, [['Content-Type', 'text/plain']])
		} finally {
			ajax.env.XMLHttpRequest = originalXHR
			global.fetch = originalFetch
		}
	})
}
