var querystring = require('querystring')

function get (base, path) {
	return newRequest()
		.setMethod('GET')
		.setBase(base)
		.setPath(path)
}

function post (base, path) {
	return newRequest()
		.setMethod('POST')
		.setBase(base)
		.setPath(path)
}

function del (base, path) {
	return newRequest()
		.setMethod('DELETE')
		.setBase(base)
		.setPath(path)
}

function patch (base, path) {
	return newRequest()
		.setMethod('PATCH')
		.setBase(base)
		.setPath(path)
}

function head (base, path) {
	return newRequest()
		.setMethod('HEAD')
		.setBase(base)
		.setPath(path)
}

function asis (data) {
	return data
}

// var g_relations = {}

function newRequest () {
	var r = {
		parse: asis,
		hooks: [],
		base: '',
		path: '',
		credentials: 'same-origin',
		query: {},
	}

	r.merge = function (obj) {
		return Object.assign(this.clone(), obj)
	}

	r.clone = function () {
		return Object.assign(newRequest(), this, {
			query: Object.assign({}, this,query),
			hooks: this.hooks.slice(),
		})
	}

	r.addQuery = function (key, val) {
		var req = this.clone()
		req.query[key] = val
		return req
	}

	r.removeQuery = function (key) {
		var req = this.clone()
		if (req.query[key] !== undefined) {
			req.query[key] = undefined
		}
		return req
	}

	r.setQuery = function (query) {
		var req = this.clone()
		req.query = query
		return req
	}

	r.setCredentials = function (credentials) {
		return this.merge({ credentials: credentials })
	}

	r.clearHooks = function () {
		var req = this.clone()
		req.hooks = []
		return req
	}

	r.injectHook = function (f) {
		var req = this.clone()
		req.hooks.push(f)
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
		req.headers['Content-Type'] = undefined
		return req
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
		return this.merge({ content_type: 'application/json; charset=utf-8' })
	}

	r.contentTypeForm = function () {
		return this.merge({ content_type: 'application/x-www-form-urlencoded' })
	}

	r.setContentType = function (ty) {
		return this.merge({ content_type: norm(ty) })
	}

	r.setParser = function (parser) {
		var req = this.clone()
		switch (norm(parser)) {
		case 'json':
			req.parse = function (data) {
				return JSON.parse(data)
			}
			break
		default:
			req.parse = asis
			break
		}
		return req
	}

	r.send = function (data) {
		var req = this.clone()
		if (data) {
			if (this.content_type === 'application/json; charset=utf-8') {
				req.body = JSON.stringify(data)
			} else if (this.content_type === 'application/x-www-form-urlencoded') {
				req.body = querystring.stringify(data)
			} else {
				req.body = data
			}
		}

		return dosend(req)
	}
	return r
}

var serializeQuery = function (obj) {
	var str = []
	for (var p in obj) {
		if (obj.hasOwnProperty(p)) {
			str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]))
		}
	}
	return str.join('&')
}

var getUrl = function (base, path) {
	if (!path || !base) return base + path

	if (!base.endsWith('/')) base += '/'
	if (path.startsWith('/')) path = path.substring(1)
	return base + path
}

var dosend = function (req) {
	return new Promise(function (rs, rj) {
		if (req.content_type) {
			req.headers = Object.assign(req.headers || {}, {
				'Content-Type': req.content_type,
			})
		}
		var resp
		var param
		var q = serializeQuery(req.query)
		if (q) q = '?' + q
		var url = getUrl(req.base, req.path) + q
		env.fetch
			.bind(env.window)(url, req)
			.then(function (r) {
				resp = r
				return resp.text()
			})
			.then(function (body) {
				param = { req: req, code: resp.status, body: body }
				return waterfall(req.hooks, param)
			})
			.then(function () {
				var body = param.body
				try {
					body = req.parse(body)
					rs([param.code, body])
				} catch (err) {
					rs([undefined, undefined, err])
				}
			})
			.catch(function (err) {
				rs([0, undefined, err])
			})
	})
}

var norm = function (str) {
	return (str || '').trim()
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
}
/*
var p1 = function () {
	return new Promise(function (r) {
		console.log('call p1')
		setTimeout(r, 1000, true)
	})
}
var p2 = function () {
	return new Promise(r => {
		console.log('call p2')
		setTimeout(r, 1000, false)
	})
}
var p3 = function () {
	return new Promise(r => {
		console.log('call p3')
		setTimeout(r, 1000, true)
	})
}
var ps = [p1, p2, p3]
*/

function waterfall (ps, param) {
	if (ps.length === 0) {
		return new Promise(function (r) {
			r(true)
		})
	}
	var fp = ps.shift()
	return fp(param).then(function (b) {
		if (!b) {
			return new Promise(function (r) {
				r(false)
			})
		}
		return waterfall(ps)
	})
}
/*
waterfall(ps).then(_ => {
	console.log('ok')
})
*/
