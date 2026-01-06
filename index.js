'use strict'
var ajax = require('./src/ajax.js')
if (typeof window !== 'undefined') {
	ajax.env.XMLHttpRequest = window.XMLHttpRequest
}
module.exports = ajax
