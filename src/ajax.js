var querystring = require('querystring')

function get(base, path) {
	return new Request().setMethod('GET').setBase(base).setPath(path)
}

function post(base, path) {
	return new Request().setMethod('POST').setBase(base).setPath(path)
}

function del(base, path) {
	return new Request().setMethod('DELETE').setBase(base).setPath(path)
}

function patch(base, path) {
	return new Request().setMethod('PATCH').setBase(base).setPath(path)
}

function head(base, path) {
	return new Request().setMethod('HEAD').setBase(base).setPath(path)
}

class Request {
	constructor() {
		this.parse = _ => _
		this.hooks = []
		this.base = ''
		this.path = ''
		this.credentials = 'same-origin'
		this.query = ''
	}

	merge(obj) {
		return Object.assign(this.clone(), obj)
	}

	clone() {
		return Object.assign(new Request(), this, {hooks: this.hooks.slice()})
	}

	setQuery(query) {
		if (!query) return this
		return this.merge({query: "?" + serializeQuery(query)})
	}

	setCredentials(credentials) {
		return this.merge({credentials})
	}

	injectHook(f) {
		let req = this.clone()
		req.hooks.push(f)
		return req
	}

	setPath(newpath) {
		let req = this.clone()
		req.path = newpath
		return makeUrl(req)
	}

	setHeader(headers) {
		let req = this.clone()
		req.headers = Object.assign({}, this.headers, headers)
		req.headers['Content-Type'] = undefined
		return req
	}

	setMethod(method) {
		let req = this.clone()
		req.method = norm(method)
		return req
	}

	setBase(base) {
		let req = this.clone()
		req.base = norm(base)
		return makeUrl(req)
	}

	setContentType(ty) {
		return this.merge({content_type: norm(ty)})
	}

	setParser(parser) {
		let req = this.clone()
		switch (norm(parser)) {
			case 'json':
				req.parse = _ => JSON.parse(_)
				break
			default:
				req.parse = _ => _
				break
		}
		return req
	}

	send(data) {
		let req = this.clone()
		if (data) {
			if (this.content_type == 'json') {
				req.body = JSON.stringify(data)
			} else if (this.content_type == 'form') {
				req.body = querystring.stringify(data)
			} else {
				req.body = data
			}
		}
		req.url += req.query
		return dosend(req)
	}
}

const serializeQuery = obj => {
	var str = [];
	for (var p in obj) if (obj.hasOwnProperty(p)) {
		str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	}
	return str.join("&");
}

const makeUrl = req => {
	req.url = req.base + req.path
	return req
}

const dosend = async req => {
	req.content_type = getRealType(req.content_type)
	if (req.content_type) {
		req.headers = Object.assign(req.headers || {}, {
			'Content-Type': req.content_type,
		})
	}
	let resp
	try {
		resp = await env.fetch.bind(env.window)(req.url, req)
	} catch (e) {
		return [0, undefined, e]
	}

	let body = await resp.text()
	let param = {
		req,
		code: resp.status,
		body,
	}
	for (let f of req.hooks)
		if (!await f(param)) break

	body = param.body
	let err;
	try {
		body = req.parse(body)
	} catch (e) {
		err = e
	}
	return [param.code, body, err]
}

const norm = str => (str || "").trim()

const getRealType = type => {
	type = norm(type)
	switch (type) {
		case 'json':
			return 'application/json; charset=utf-8';
		case 'form':
			return 'application/x-www-form-urlencoded';
	}
	return type
}

var env = {
	fetch: {},
	window: {},
}
module.exports = { post,del,head,patch,Request,env,get}
