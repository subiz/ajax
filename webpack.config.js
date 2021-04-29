const path = require('path')

module.exports = {
	mode: 'production',
	entry: {
		app: ['./index.js'],
	},
	output: {
		library: 'beta',
		libraryTarget: 'umd',
		globalObject: "typeof self !== 'undefined' ? self : this",
		path: path.resolve(__dirname, 'dist'),
		filename: 'ajax.js',
	},
}
