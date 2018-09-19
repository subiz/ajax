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

function newRequest () {
	var r = {
		parse: asis,
		hooks: [],
		base: '',
		path: '',
		credentials: 'same-origin',
		query: '',
	}

	r.merge = function (obj) {
		return Object.assign(this.clone(), obj)
	}

	r.clone = function () {
		return Object.assign(newRequest(), this, { hooks: this.hooks.slice() })
	}

	r.setQuery = function (query) {
		if (!query) return this
		return this.merge({ query: '?' + serializeQuery(query) })
	}

	r.setCredentials = function (credentials) {
		return this.merge({ credentials: credentials })
	}

	r.injectHook = function (f) {
		var req = this.clone()
		req.hooks.push(f)
		return req
	}

	r.setPath = function (newpath) {
		var req = this.clone()
		req.path = newpath
		return makeUrl(req)
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
		return makeUrl(req)
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
			if (this.content_type === 'json') {
				req.body = JSON.stringify(data)
			} else if (this.content_type === 'form') {
				req.body = querystring.stringify(data)
			} else {
				req.body = data
			}
		}
		req.url += (req.query || '')
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

var makeUrl = function (req) {
	req.url = (req.base || '') + (req.path || '')
	return req
}

var dosend = function (req) {
	return new Promise(function (rs, rj) {
		req.content_type = getRealType(req.content_type)
		if (req.content_type) {
			req.headers = Object.assign(req.headers || {}, {
				'Content-Type': req.content_type,
			})
		}
		var resp
		var param
		env.fetch
			.bind(env.window)(req.url, req)
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

var getRealType = function (type) {
	type = norm(type)
	switch (type) {
	case 'json':
		return 'application/json; charset=utf-8'
	case 'form':
		return 'application/x-www-form-urlencoded'
	}
	return type
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
