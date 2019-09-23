var test = require('tape')
var ajax = require('./ajax.js')

test('waterfall', t => {
	ajax.waterfall([function(param, cb) {
		t.equal(param.a, 1)
		param.a = 2
		setTimeout(cb)
	}, function(param, cb) {
		t.equal(param.a, 2)
		param.a = 3
		setTimeout(cb)
	}], {a: 1}, param => {
		t.equal(param.a, 3)
		t.end()
	})
})
