'use strict'
var ajax = require('./src/ajax.js')
ajax.env.fetch = window.fetch
ajax.env.window = window
module.exports = ajax
