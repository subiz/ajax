'use strict'
var ajax = require('./src/ajax.js')
ajax.env.XMLHttpRequest = window.XMLHttpRequest
ajax.env.window = window
module.exports = ajax
