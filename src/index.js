var ajax = require('./ajax.js')
ajax.env.fetch = window.fetch
module.exports = {Ajax: ajax.Ajax}
