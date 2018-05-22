const path = require('path');
module.exports = {
	entry: {
		html_editor: './src/html-editor.ts'
	},
	plugins: [
	],
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'build'),
		library: "html_editor"
	},
	mode: "development",
	optimization: {
		minimize: false
	},
	devtool: 'inline-source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js']
	},

};