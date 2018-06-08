const path = require('path');

module.exports = {
	entry: {
		html_editor: './src/index.ts'
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
		minimize: true
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
	}
};