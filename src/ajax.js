var querystring = require('./querystring.js')

function get (base, path, root) {
	return init(root, 'GET', base, path)
}

function post (base, path, root) {
	return init(root, 'POST', base, path)
}

function del (base, path, root) {
	return init(root, 'DELETE', base, path)
}

function patch (base, path, root) {
	return init(root, 'PATCH', base, path)
}

function head (base, path, root) {
	return init(root, 'HEAD', base, path)
}

function put (base, path, root) {
	return init(root, 'PUT', base, path)
}

function init (root, method, base, path) {
	var req
	if (!root) req = newRequest()
	else req = root.clone()

	req.method = method
	if (base) req.base = norm(base)
	if (path) req.path = norm(path)
	return req
}

function merge (req, obj) {
	return Object.assign(req, obj)
}

var CONTENT_TYPE = 'Content-Type'

function newRequest () {
	var r = {
		parse: asis,
		beforehooks: [],
		afterhooks: [],
		base: '',
		path: '',
		credentials: 'include',
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

	r.setMode = function (mode) {
		return merge(this, { mode: mode })
	}

	r.setCredentials = function (credentials) {
		return merge(this, { credentials: credentials })
	}

	r.clearHooks = function () {
		var req = this.clone({ nohook: true })
		req.hooks = []
		req.beforehooks = []
		req.afterhooks = []
		return req
	}

	r.beforeHook = function (promise) {
		var req = this.clone()
		req.beforehooks = req.beforehooks.slice()
		req.beforehooks.push(promise)
		return req
	}

	r.afterHook = function (promise) {
		var req = this.clone()
		req.afterhooks = req.afterhooks.slice()
		req.afterhooks.push(promise)
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

	r.put = function (base, path) {
		return put(base, path, this)
	}

	r.head = function (base, path) {
		return head(base, path, this)
	}

	r.patch = function (base, path) {
		return patch(base, path, this)
	}

	r.del = function (base, path) {
		return del(base, path, this)
	}

	r.post = function (base, path) {
		return post(base, path, this)
	}

	r.get = function (base, path) {
		return get(base, path, this)
	}

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
		return merge(this, { content_type: 'application/json; charset=utf-8' })
	}

	r.contentTypeForm = function () {
		return merge(this, { content_type: 'application/x-www-form-urlencoded' })
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
		var req = this
		if (data) {
			req = this.clone()
			if (this.content_type === 'application/json; charset=utf-8') {
				req.body = JSON.stringify(data)
			} else if (this.content_type === 'application/x-www-form-urlencoded') {
				req.body = querystring.stringify(data)
			} else {
				req.body = data
			}
		}


		cb = cb || function() {}
		var resolve
		var promise = new Promise(rs => {resolve = rs})
		waterfall(req.beforehooks.slice(), { request: req }, function (bp) {
			if (bp.error) {
				cb(bp.error, undefined, 0)
				resolve([0, undefined, bp.error])
				return
			}
			dosend(bp.request, function(err, body, code){
				waterfall(req.afterhooks.slice(), {request: req,code: code,body: body,err: err}, function(param) {
					try {
						var body = req.parse(param.body)
						cb(param.err, body, param.code)
						resolve([param.code, body, param.err])
					} catch (err) {
						cb(err, undefined, 0)
						resolve( [0, undefined, err])
					}
				})
			})
		})
		return promise
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
	if (req.content_type) {
		req.headers = Object.assign({}, req.headers)
		req.headers[CONTENT_TYPE] = req.content_type
	}
	var resp
	var q = querystring.stringify(req.query)
	if (q) q = '?' + q
	var url = getUrl(req.base, req.path) + q
	env.fetch.
		bind(env.window)(url, req).
		then(function (r) {
			resp = r
			return resp.text()
		}).
		then(function (body) {
			cb(undefined, body, resp.status)
		}).
		catch(function (err) {
			cb(err, undefined, 0)
		})
}

function norm (str) {
	return (str || '').trim()
}

function asis (data) {
	return data
}

var env = {
	fetch: {},
	window: {},
}

module.exports = {
	post: post,
	del: del,
	head: head,
	patch: patch,
	env: env,
	get: get,
	put: put,
	waterfall: waterfall
};

function isFunc(f) {
	return f && {}.toString.call(f) === "[object Function]"
}

function waterfall(ps, param, cb) {
	if (!ps || ps.length === 0) {
		cb(param);
		return Promise.resolve(param)
	}

	var fp = ps.shift()
	if (!isFunc(fp)) return waterfall(ps, param, cb)
	if (fp.length < 2) {
		var out = fp(param)
		if (out && out.then) {
			return out.then(function() {
				return param.stop ? Promise.resolve(param) : waterfall(ps, param, cb)
			})
		} else
			return param.stop ? Promise.resolve(param) : waterfall(ps, param, cb)
	}
	// callback
	fp(param, out => {
		if (param.stop) {
			cb(param)
			return Promise.resolve(param)
		} else return waterfall(ps, param, cb)
	})
}
