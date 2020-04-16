var querystring = require('./querystring.js')

var METHODS = ['put', 'head', 'patch', 'delete', 'post', 'get']
var CONTENT_TYPE = 'Content-Type'
var CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded'
var CONTENT_TYPE_JSON = 'application/json; charset=utf-8'

function combineUrl (base, newurl) {
	base = norm(base)
	newurl = norm(newurl)

	if (!newurl || !base) return base + newurl

	if (
		newurl.startsWith('http://') ||
		newurl.startsWith('https://') ||
		newurl.startsWith('//')
	) {
		return newurl
	}
	if (!base.endsWith('/')) base += '/'
	if (newurl.startsWith('/')) newurl = newurl.substring(1)
	return base + newurl
}

function merge (req, obj) {
	return Object.assign(req.clone(), obj)
}

function newRequest () {
	var r = {
		parse: asis,
		beforehooks: [],
		afterhooks: [],
		baseurl: '',
		query: {},
		meta: {},
	}

	r.clone = function () {
		return Object.assign({}, this, {
			query: Object.assign({}, this.query),
			meta: Object.assign({}, this.meta),
		})
	}

	r.addQuery = function (key, val) {
		var req = this.clone()
		req.query[key] = val
		return req
	}

	r.removeQuery = function (key) {
		var req = this.clone()
		if (req.query[key] !== undefined) req.query[key] = undefined
		return req
	}

	r.setQuery = function (query) {
		return merge(this, { query: query })
	}

	r.clearHooks = function () {
		var req = this.clone({ nohook: true })
		req.hooks = []
		req.beforehooks = []
		req.afterhooks = []
		return req
	}

	r.beforeHook = function (cb) {
		var req = this.clone()
		req.beforehooks = req.beforehooks.slice()
		req.beforehooks.push(cb)
		return req
	}

	r.afterHook = function (cb) {
		var req = this.clone()
		req.afterhooks = req.afterhooks.slice()
		req.afterhooks.push(cb)
		return req
	}

	r.setHeader = function (headers) {
		var req = this.clone()
		req.headers = Object.assign({}, this.headers, headers)
		req.headers[CONTENT_TYPE] = undefined
		return req
	}

	METHODS.map(function (method) {
		r[method] = function (url, data, cb) {
			send(
				merge(this, { method: method, baseurl: combineUrl(this.baseurl, url) }),
				data,
				cb
			)
		}
	})

	// pass // to clean
	r.setBaseUrl = function (url) {
		return merge(this, { baseurl: url })
	}

	r.contentTypeJson = function () {
		return merge(this, { content_type: CONTENT_TYPE_JSON })
	}

	r.contentTypeForm = function () {
		return merge(this, { content_type: CONTENT_TYPE_FORM })
	}

	r.setContentType = function (ty) {
		return merge(this, { content_type: norm(ty) })
	}

	r.setParser = function (parser) {
		var req = this.clone()
		switch (norm(parser)) {
		case 'json':
			req.parse = function (data) {
				if (data === undefined) return
				return JSON.parse(data)
			}
			break
		default:
			req.parse = asis
			break
		}
		return req
	}

	r.setBody = function (body) {
		var req = this.clone()
		req.body = body
		return req
	}

	r.setMeta = function (k, v) {
		var req = this.clone()
		req.meta[k] = v
		return req
	}

	return r
}

function send (req, data, cb) {
	var rs
	var promise = new Promise(function (resolve) {
		rs = resolve
	})
	cb = cb || function () {}
	if (isFunc(data)) {
		cb = data
		data = undefined
	}

	if (data) {
		req = req.clone()
		if (req.content_type === CONTENT_TYPE_JSON) {
			req.body = JSON.stringify(data)
		} else if (req.content_type === CONTENT_TYPE_FORM) {
			req.body = querystring.stringify(data)
		} else {
			req.body = data
		}
	}

	waterfall(req.beforehooks.slice(), { request: req }, function (bp) {
		if (bp.error) {
			rs({ body: undefined, code: 0, error: bp.error })
			return cb(bp.error, undefined, 0)
		}

		dosend(bp.request, function (err, body, code) {
			waterfall(
				req.afterhooks.slice(),
				{ request: req, code: code, body: body, err: err },
				function (param) {
					var body
					try {
						body = req.parse(param.body)
					} catch (err) {
						param.err = err
					}
					try {
						rs({ body: body, code: param.code, error: param.err })
						cb(param.err, body, param.code)
					} catch (_) {}
				}
			)
		})
	})
	return promise
}

var dosend = function (req, cb) {

	var q = querystring.stringify(req.query)
	if (q) q = '?' + q

	var request = new env.XMLHttpRequest()
	request.onreadystatechange = function (e) {
		if (request.readyState !== 4) return
		cb && cb(undefined, request.responseText, request.status)
		cb = undefined // dont call cb anymore
	}

	request.onerror = function () {
		cb && cb('network_error', request.responseText)
		cb = undefined // dont call cb anymore
	}
	console.log("SENDING", req.baseurl + q)
	request.open(req.method, req.baseurl + q)
	for (var i in req.headers) request.setRequestHeader(i, req.headers[i])
	if (req.content_type) {
		request.setRequestHeader(CONTENT_TYPE, req.content_type)
	}
	request.send(req.body)
}

function norm (str) {
	return (str || '').trim()
}

function asis (data) {
	return data
}

var env = { XMLHttpRequest: {} }

function isFunc (f) {
	return f && {}.toString.call(f) === '[object Function]'
}

function waterfall (ps, param, cb) {
	if (!ps || ps.length === 0) return cb(param)

	var fp = ps.shift()
	if (!isFunc(fp)) return waterfall(ps, param, cb)
	fp(param, function (out) {
		if (out === false) return cb(param)
		else return waterfall(ps, param, cb)
	})
}

var ajax = newRequest()
ajax.env = env
ajax.waterfall = waterfall
module.exports = ajax
