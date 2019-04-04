// more stringent in adhering to RFC 3986 (which reserves !, ', (, ), and *), even
// though these characters have no formalized URI delimiting uses, see
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
// for more details
function encodeURICom (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16)
	})
}

function encoderForArrayFormat (key, value) {
	if (value === null) return encodeURICom(key)
	return [encodeURICom(key), '=', encodeURICom(value)].join('')
}

function stringify (obj) {
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
			}
			param = arr.join('&')
		}
		if (param.length > 0) out.push(param)
	}
	return out.join('&')
}

module.exports = { stringify: stringify }
