var METHODS = ['put', 'head', 'patch', 'delete', 'post', 'get']
var CONTENT_TYPE = 'Content-Type'
var CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded'
var CONTENT_TYPE_JSON = 'application/json; charset=utf-8'

function combineUrl(base, newurl) {
	base = norm(base)
	newurl = norm(newurl)

	if (!newurl || !base) return base + newurl

	if (newurl.startsWith('http://') || newurl.startsWith('https://') || newurl.startsWith('//')) {
		return newurl
	}

	if (!base.endsWith('/')) base += '/'
	if (newurl.startsWith('/')) newurl = newurl.substring(1)
	return base + newurl
}

function merge(req, obj) {
	return Object.assign(req.clone(), obj)
}

function newRequest() {
	var r = {
		parser: '',
		beforehooks: [],
		afterhooks: [],
		baseurl: '',
		query: {},
		meta: {},
	}

	r.clone = function() {
		return Object.assign({}, this, {
			query: Object.assign({}, this.query),
			meta: Object.assign({}, this.meta),
		})
	}

	r.addQuery = function(key, val) {
		var req = this.clone()
		req.query[key] = val
		return req
	}

	r.removeQuery = function(key) {
		var req = this.clone()
		if (req.query[key] !== undefined) req.query[key] = undefined
		return req
	}

	r.withCredentials = function(credential) {
		return merge(this, {_withCredentials: credential})
	}

	r.setQuery = function(query) {
		return merge(this, {query: query})
	}

	r.clearHooks = function() {
		return merge(this, {beforehooks: [], afterhooks: []})
	}

	r.beforeHook = function(cb) {
		var beforehooks = this.beforehooks.slice()
		beforehooks.push(cb)
		return merge(this, {beforehooks: beforehooks})
	}

	r.afterHook = function(cb) {
		var afterhooks = this.afterhooks.slice()
		afterhooks.push(cb)
		return merge(this, {afterhooks: afterhooks})
	}

	r.setHeader = function(headers) {
		headers = Object.assign({}, this.headers, headers)
		headers[CONTENT_TYPE] = undefined
		return merge(this, {headers: headers})
	}

	METHODS.map(function(method) {
		r[method] = function(url, data, cb) {
			return send(merge(this, {method: method, baseurl: combineUrl(this.baseurl, url)}), data, cb)
		}
	})

	// pass // to clean
	r.setBaseUrl = function(url) {
		return merge(this, {baseurl: url})
	}

	r.contentTypeJson = function() {
		return merge(this, {content_type: CONTENT_TYPE_JSON})
	}

	r.contentTypeForm = function() {
		return merge(this, {content_type: CONTENT_TYPE_FORM})
	}

	r.setContentType = function(ty) {
		return merge(this, {content_type: norm(ty)})
	}

	r.setParser = function(parser) {
		return merge(this, {parser: norm(parser)})
	}

	r.setBody = function(body) {
		return merge(this, {body: body})
	}

	r.setMeta = function(k, v) {
		var req = this.clone()
		req.meta[k] = v
		return req
	}

	return r
}

function send(req, data, cb) {
	cb = cb || function() {}
	if (isFunc(data)) {
		cb = data
		data = undefined
	}

	var rs
	var promise = new Promise(function(resolve) {
		rs = function(res) {
			try {
				cb(res.error, res.body, res.code)
			} catch (_) {}
			resolve(res)
		}
	})

	if (data) {
		req = req.clone()
		req.body = data
		if (req.content_type === CONTENT_TYPE_JSON) req.body = env.Jsonify(data)
		if (req.content_type === CONTENT_TYPE_FORM) {
			req.body = querify(data)
		}
	}

	waterfall(req.beforehooks.slice(), {request: req}, function(bp) {
		if (bp.error) return rs({body: undefined, code: 0, error: bp.error})
		dosend(bp.request, function(err, body, code) {
			waterfall(req.afterhooks.slice(), {request: req, code: code, body: body, err: err}, function(param) {
				var body = param.body

				if (req.parser == 'json' && param.body) {
					try {
						body = env.ParseJson(param.body)
					} catch (e) {
						param.err = param.err || 'invalid json'
					}
				}
				var err = param.err
				if (code < 200 || code > 299) err = 'not 200'
				rs({body: body, code: param.code, error: err})
			})
		})
	})
	return promise
}

var dofetch = function(req, cb, q) {
	var headers = Object.assign({}, req.headers)
	if (req.content_type) {
		headers[CONTENT_TYPE] = req.content_type
	}

	fetch(req.baseurl + q, {
		method: req.method,
		headers: headers,
		credentials: req._withCredentials,
		body: req.body,
	})
		.then((res) => res.text().then((text) => cb(undefined, text, res.status)))
		.catch((err) => cb('network_error', err, -1))
}

var dosend = function(req, cb) {
	let q = querify(req.query)
	if (q) q = '?' + q
	if (!env.XMLHttpRequest) return dofetch(req, cb, q)
	var request = new env.XMLHttpRequest()
	request.onreadystatechange = function(e) {
		if (request.readyState !== 4) return
		if (request.status === 0) {
			cb('network_error', request.responseText, request.status) // network error
		} else {
			cb(undefined, request.responseText, request.status)
		}
	}

	request.open(req.method, req.baseurl + q)
	request.withCredentials = req._withCredentials // for cloudflare to work correctly
	for (var i in req.headers) request.setRequestHeader(i, req.headers[i])
	if (req.content_type) {
		request.setRequestHeader(CONTENT_TYPE, req.content_type)
	}
	request.send(req.body)
}

function norm(str) {
	return (str || '').trim()
}

function isFunc(f) {
	return f && {}.toString.call(f) === '[object Function]'
}

function waterfall(ps, param, cb) {
	if (!ps || ps.length === 0) return cb(param)

	var fp = ps.shift()
	if (!isFunc(fp)) return waterfall(ps, param, cb)
	fp(param, function(out) {
		return out === false ? cb(param) : waterfall(ps, param, cb)
	})
}

// more stringent in adhering to RFC 3986 (which reserves !, ', (, ), and *), even
// though these characters have no formalized URI delimiting uses, see
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
// for more details
function encodeURICom(str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
		return '%' + c.charCodeAt(0).toString(16)
	})
}

function querify(obj) {
	if (!obj) return ''
	var keys = Object.keys(obj)
	//  keys.sort(options.sort)
	var out = []
	for (var k = 0; k < keys.length; k++) {
		var key = keys[k]
		var param = ''
		var value = obj[key]
		if (value === undefined) continue
		if (value === null) {
			param = encodeURICom(key)
		} else if (!Array.isArray(value)) {
			param = encodeURICom(key) + '=' + encodeURICom(value)
		} else {
			// array
			var arr = []
			for (var i = 0; i < value.length; i++) {
				if (value[i] === undefined) continue
				arr.push(encoderForArrayFormat(key, value[i], arr.length))

				arr.push(out)
			}
			param = arr.join('&')
		}
		if (param.length > 0) out.push(param)
	}
	return out.join('&')
}

function encoderForArrayFormat(key, value) {
	if (value === null) return encodeURICom(key)
	return [encodeURICom(key), '=', encodeURICom(value)].join('')
}

var ajax = newRequest()
var env = {
	Jsonify: JSON.stringify,
	ParseJson: JSON.parse,
}
ajax.env = env
ajax.waterfall = waterfall
module.exports = ajax
