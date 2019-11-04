var querystring = require('./querystring.js')

var METHODS = ['put', 'head', 'patch', 'delete', 'post', 'get']
var CONTENT_TYPE = 'Content-Type'
var CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded'
var CONTENT_TYPE_JSON = 'application/json; charset=utf-8'

function init (root, method, base, path) {
	var req = root ? root.clone() : newRequest()
	req.method = method
	if (base) req.base = norm(base)
	if (path) req.path = norm(path)
	return req
}

function merge (req, obj) {
	return Object.assign(req, obj)
}

function newRequest () {
	var r = {
		parse: asis,
		beforehooks: [],
		afterhooks: [],
		base: '',
		path: '',
		query: {},
		meta: {},
	}

	r.clone = function () {
		return Object.assign({}, this, {
			query: merge({}, this.query),
			meta: merge({}, this.meta),
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

	r.setPath = function (newpath) {
		var req = this.clone()
		req.path = norm(newpath)
		return req
	}

	r.setHeader = function (headers) {
		var req = this.clone()
		req.headers = Object.assign({}, this.headers, headers)
		req.headers[CONTENT_TYPE] = undefined
		return req
	}

	METHODS.map(function (method) {
		r[method] = function (base, path) {
			return init(this, method, base, path)
		}
	})

	r.setMethod = function (method) {
		var req = this.clone()
		req.method = norm(method)
		return req
	}

	r.setBase = function (base) {
		var req = this.clone()
		req.base = norm(base)
		return req
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

	r.send = function (data, cb) {
		cb = cb || function () {}
		if (isFunc(data)) {
			cb = data
			data = undefined
		}

		var req = this
		if (data) {
			req = this.clone()
			if (this.content_type === CONTENT_TYPE_JSON) {
				req.body = JSON.stringify(data)
			} else if (this.content_type === CONTENT_TYPE_FORM) {
				req.body = querystring.stringify(data)
			} else {
				req.body = data
			}
		}

		waterfall(req.beforehooks.slice(), { request: req }, function (bp) {
			if (bp.error) return cb(bp.error, undefined, 0)
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
							cb(param.err, body, param.code)
						} catch (_) {}
					}
				)
			})
		})
	}
	return r
}

function getUrl (base, path) {
	if (!path || !base) return base + path

	if (!base.endsWith('/')) base += '/'
	if (path.startsWith('/')) path = path.substring(1)
	return base + path
}

var dosend = function (req, cb) {
	var q = querystring.stringify(req.query)
	if (q) q = '?' + q
	var url = getUrl(req.base, req.path) + q

	cb = cb || function () {}

	var request = new env.XMLHttpRequest()
	request.onreadystatechange = function (e) {
		if (request.readyState !== 4) return
		cb(undefined, request.responseText, request.status)
	}

	request.onerror = function () {
		cb(request.responseText)
		cb = function () {} // dont call cb anymore
	}

	request.open(req.method, url)
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

module.exports = {
	env: env,
	waterfall: waterfall,
}

METHODS.map(function (method) {
	module.exports[method] = function (base, path, root) {
		return init(root, method, base, path)
	}
})
