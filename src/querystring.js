// more stringent in adhering to RFC 3986 (which reserves !, ', (, ), and *), even
// though these characters have no formalized URI delimiting uses, see
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
// for more details
function fixedEncodeURIComponent (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16)
	})
}

function encode (value, options) {
	if (!options.encode) return value
	return options.strict
		? fixedEncodeURIComponent(value)
		: encodeURIComponent(value)
}

function encoderForArrayFormat (options) {
	switch (options.arrayFormat) {
	case 'index':
		return function (key, value, index) {
			var encodedkey = encode(key, options)
			if (value === null) return [encodedkey, '[', index, ']'].join('')

			var encodedindex = encode(index, options)
			var encodedvalue = encode(value, options)
			return [encodedkey, '[', encodedindex, ']=', encodedvalue].join('')
		}
	case 'bracket':
		return (key, value) => {
			return value === null
				? [encode(key, options), '[]'].join('')
				: [encode(key, options), '[]=', encode(value, options)].join('')
		}
	default:
		return (key, value) => {
			return value === null
				? encode(key, options)
				: [encode(key, options), '=', encode(value, options)].join('')
		}
	}
}

function stringify (obj) {
	if (!obj) return ''
	var options = { encode: true, strict: true, arrayFormat: 'none' }

	const formatter = encoderForArrayFormat(options)
	const keys = Object.keys(obj)

	if (options.sort !== false) keys.sort(options.sort)

	return keys
		.map(function (key) {
			const value = obj[key]

			if (value === undefined) return ''
			if (value === null) return encode(key, options)

			if (!Array.isArray(value)) {
				return encode(key, options) + '=' + encode(value, options)
			}

			// array
			const result = []
			for (const value2 of value.slice()) {
				if (value2 === undefined) continue

				result.push(formatter(key, value2, result.length))
			}

			return result.join('&')
		})
		.filter(function (x) {
			return x.length > 0
		})
		.join('&')
}

module.exports = { stringify: stringify }
