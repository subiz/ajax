'use strict';

var ajax = require('./ajax.js');
ajax.env.fetch = window.fetch;
module.exports = { Request: ajax.Request };
