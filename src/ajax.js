'use strict';

class Request {
	constructor() {
		this.parse = _ => _
		this.hooks = []
		this.base = ''
		this.path = ''
	}

	clone() {
		let req = new Request()
		req.method = this.method
		req.url = this.url
		req.base = this.base
		req.data = this.data
		req.headers = this.headers
		req.parse = this.parse
		req.content_type = this.content_type
		req.hooks = this.hooks.slice()
		req.body = this.body
		return req
	}

	injectHook(f) {
		let req = this.clone()
		req.hooks.push(f)
		return req
	}

	setPath(newpath) {
		let req = this.clone()
		req.path = newpath
		makeUrl(req)
		return req
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
		makeUrl(req)
		return req
	}

	setContentType(ty) {
		let req = this.clone()
		req.content_type = norm(ty)
		return req
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

	async send(data) {
		let req = this.clone()
		if (data) {

			if (this.method == 'post') {
				if (this.content_type == 'json') {
					req.body = JSON.stringify(data)
				} else if (this.content_type == 'form') {
					req.body = stringify(data)
				} else {
					req.body = data
				}
			} else {
				if (data) {
					req.url += '?' + serializeQuery(data)
				}
			}
		}
		return dosend(req)
	}
}

const serializeQuery = obj => {
	var str = [];
	for (var p in obj)
		if (obj.hasOwnProperty(p)) {
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
	return str.join("&");
}

const makeUrl = req => {
	req.url = req.base + req.path
}

const dosend = async (req) => {
	req.content_type = getRealType(req.content_type)
	if (req.content_type) {
		req.headers = Object.assign(req.headers || {}, {
			'Content-Type': req.content_type
		})
	}
	let resp
	console.log("url", req.url, req.headers)
	try {
		resp = await env.fetch(req.url, req)
	} catch (e) {
		return [0, undefined, e]
	}

	let txt = await resp.text()

	let param = {
		req,
		code: resp.status,
		body: txt
	}
	for (let f of req.hooks) {
		if (!await f(param)) break
	}

	let err;
	try {
		txt = req.parse(txt)
	} catch (e) {
		err = e
	}
	return [param.code, txt, err]
}

const norm = (str) => (str || "").toLowerCase().trim()

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
	fetch: {}
}
module.exports = {
	Request,
	env
}


// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



const stringifyPrimitive = v => {
	switch (typeof v) {
		case 'string':
			return v;

		case 'boolean':
			return v ? 'true' : 'false';

		case 'number':
			return isFinite(v) ? v : '';

		default:
			return '';
	}
};

const stringify = (obj, sep, eq, name) => {
	sep = sep || '&';
	eq = eq || '=';
	if (obj === null) {
		obj = undefined;
	}

	if (typeof obj === 'object') {
		return Object.keys(obj).map(function (k) {
			var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
			if (Array.isArray(obj[k])) {
				return obj[k].map(function (v) {
					return ks + encodeURIComponent(stringifyPrimitive(v));
				}).join(sep);
			} else {
				return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
			}
		}).join(sep);

	}

	if (!name) return '';
	return encodeURIComponent(stringifyPrimitive(name)) + eq +
		encodeURIComponent(stringifyPrimitive(obj));
};