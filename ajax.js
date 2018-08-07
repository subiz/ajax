'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Request = function () {
	function Request() {
		_classCallCheck(this, Request);

		this.parse = function (_) {
			return _;
		};
		this.hooks = [];
		this.base = '';
		this.path = '';
	}

	_createClass(Request, [{
		key: 'clone',
		value: function clone() {
			var req = new Request();
			req.method = this.method;
			req.url = this.url;
			req.base = this.base;
			req.data = this.data;
			req.headers = this.headers;
			req.parse = this.parse;
			req.content_type = this.content_type;
			req.hooks = this.hooks.slice();
			req.body = this.body;
			return req;
		}
	}, {
		key: 'injectHook',
		value: function injectHook(f) {
			var req = this.clone();
			req.hooks.push(f);
			return req;
		}
	}, {
		key: 'setPath',
		value: function setPath(newpath) {
			var req = this.clone();
			req.path = newpath;
			makeUrl(req);
			return req;
		}
	}, {
		key: 'setHeader',
		value: function setHeader(headers) {
			var req = this.clone();
			req.headers = Object.assign({}, this.headers, headers);
			req.headers['Content-Type'] = undefined;
			return req;
		}
	}, {
		key: 'setMethod',
		value: function setMethod(method) {
			var req = this.clone();
			req.method = norm(method);
			return req;
		}
	}, {
		key: 'setBase',
		value: function setBase(base) {
			var req = this.clone();
			req.base = norm(base);
			makeUrl(req);
			return req;
		}
	}, {
		key: 'setContentType',
		value: function setContentType(ty) {
			var req = this.clone();
			req.content_type = norm(ty);
			return req;
		}
	}, {
		key: 'setParser',
		value: function setParser(parser) {
			var req = this.clone();
			switch (norm(parser)) {
				case 'json':
					req.parse = function (_) {
						return JSON.parse(_);
					};
					break;
				default:
					req.parse = function (_) {
						return _;
					};
					break;
			}
			return req;
		}
	}, {
		key: 'send',
		value: async function send(data) {
			var req = this.clone();
			if (data) {

				if (this.method == 'post') {
					if (this.content_type == 'json') {
						req.body = JSON.stringify(data);
					} else if (this.content_type == 'form') {
						req.body = stringify(data);
					} else {
						req.body = data;
					}
				} else {
					if (data) {
						req.url += '?' + serializeQuery(data);
					}
				}
			}
			return dosend(req);
		}
	}]);

	return Request;
}();

var serializeQuery = function serializeQuery(obj) {
	var str = [];
	for (var p in obj) {
		if (obj.hasOwnProperty(p)) {
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
	}return str.join("&");
};

var makeUrl = function makeUrl(req) {
	req.url = req.base + req.path;
};

var dosend = async function dosend(req) {
	req.content_type = getRealType(req.content_type);
	if (req.content_type) {
		req.headers = Object.assign(req.headers || {}, {
			'Content-Type': req.content_type
		});
	}
	var resp = void 0;
	console.log("url", req.url, req.headers);
	try {
		resp = await env.fetch(req.url, req);
	} catch (e) {
		return [0, undefined, e];
	}

	var txt = await resp.text();

	var param = {
		req: req,
		code: resp.status,
		body: txt
	};
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = req.hooks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var f = _step.value;

			if (!(await f(param))) break;
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	var err = void 0;
	try {
		txt = req.parse(txt);
	} catch (e) {
		err = e;
	}
	return [param.code, txt, err];
};

var norm = function norm(str) {
	return (str || "").toLowerCase().trim();
};

var getRealType = function getRealType(type) {
	type = norm(type);
	switch (type) {
		case 'json':
			return 'application/json; charset=utf-8';
		case 'form':
			return 'application/x-www-form-urlencoded';
	}
	return type;
};

var env = {
	fetch: {}
};
module.exports = {
	Request: Request,
	env: env

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


};var stringifyPrimitive = function stringifyPrimitive(v) {
	switch (typeof v === 'undefined' ? 'undefined' : _typeof(v)) {
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

var stringify = function stringify(obj, sep, eq, name) {
	sep = sep || '&';
	eq = eq || '=';
	if (obj === null) {
		obj = undefined;
	}

	if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
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
	return encodeURIComponent(stringifyPrimitive(name)) + eq + encodeURIComponent(stringifyPrimitive(obj));
};