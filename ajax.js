'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
		this.credentials = 'same-origin';
		this.query = '';
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
			req.credentials = this.credentails;
			req.query = this.query;
			return req;
		}
	}, {
		key: 'setQuery',
		value: function setQuery(query) {
			if (!query) return this;
			var req = this.clone();
			req.query = "?" + serializeQuery(query);
			return req;
		}
	}, {
		key: 'setCredentials',
		value: function setCredentials(cred) {
			var req = this.clone();
			req.credentials = cred;
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
		value: function send(data) {
			var req = this.clone();
			if (data) {
				if (this.content_type == 'json') {
					req.body = JSON.stringify(data);
				} else if (this.content_type == 'form') {
					req.body = stringify(data);
				} else {
					req.body = data;
				}
			}
			req.url += req.query;
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

var dosend = function () {
	var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req) {
		var resp, body, param, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, f, err;

		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						req.content_type = getRealType(req.content_type);
						if (req.content_type) {
							req.headers = Object.assign(req.headers || {}, {
								'Content-Type': req.content_type
							});
						}
						resp = void 0;
						_context.prev = 3;
						_context.next = 6;
						return env.fetch.bind(env.window)(req.url, req);

					case 6:
						resp = _context.sent;
						_context.next = 12;
						break;

					case 9:
						_context.prev = 9;
						_context.t0 = _context['catch'](3);
						return _context.abrupt('return', [0, undefined, _context.t0]);

					case 12:
						_context.next = 14;
						return resp.text();

					case 14:
						body = _context.sent;
						param = {
							req: req,
							code: resp.status,
							body: body
						};
						_iteratorNormalCompletion = true;
						_didIteratorError = false;
						_iteratorError = undefined;
						_context.prev = 19;
						_iterator = req.hooks[Symbol.iterator]();

					case 21:
						if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
							_context.next = 30;
							break;
						}

						f = _step.value;
						_context.next = 25;
						return f(param);

					case 25:
						if (_context.sent) {
							_context.next = 27;
							break;
						}

						return _context.abrupt('break', 30);

					case 27:
						_iteratorNormalCompletion = true;
						_context.next = 21;
						break;

					case 30:
						_context.next = 36;
						break;

					case 32:
						_context.prev = 32;
						_context.t1 = _context['catch'](19);
						_didIteratorError = true;
						_iteratorError = _context.t1;

					case 36:
						_context.prev = 36;
						_context.prev = 37;

						if (!_iteratorNormalCompletion && _iterator.return) {
							_iterator.return();
						}

					case 39:
						_context.prev = 39;

						if (!_didIteratorError) {
							_context.next = 42;
							break;
						}

						throw _iteratorError;

					case 42:
						return _context.finish(39);

					case 43:
						return _context.finish(36);

					case 44:

						body = param.body;
						err = void 0;

						try {
							body = req.parse(body);
						} catch (e) {
							err = e;
						}
						return _context.abrupt('return', [param.code, body, err]);

					case 48:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, undefined, [[3, 9], [19, 32, 36, 44], [37,, 39, 43]]);
	}));

	return function dosend(_x) {
		return _ref.apply(this, arguments);
	};
}();

var norm = function norm(str) {
	return (str || "").trim();
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
	fetch: {},
	window: {}
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