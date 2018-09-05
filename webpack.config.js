const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
	mode: 'production',
	entry: {
		app: ["@babel/polyfill", './index.js'],
	},
	output: {
		library: 'beta',
		libraryTarget: 'umd',
		globalObject: "typeof self !== 'undefined' ? self : this",
		path: path.resolve(__dirname, 'dist'),
    filename: 'ajax.js'
	},
	/*optimization: {
		splitChunks: {
			chunks: "all",
		},
		minimizer: [
			new UglifyJsPlugin({
				test: /\.js($|\?)/i
			})
		],
	},*/
	module: {
		rules: [{
		  type: 'javascript/auto',
			test: /\.mjs$/,
			use: [],
		}, {
			test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
      },
    },]
	},
}
