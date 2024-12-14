const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'development',
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'bundle.js',
    },
    devServer: {
        static: './dist',
        compress: false,
        port: 7200,
        hot: true,
    },
    entry: './src/index.ts',

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules)/,
                use: 'swc-loader'
            },
            {
                test: /\.html/,
                use: 'html-loader'
            },
            {
                test: /\.scss/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            }
        ]
    },
    plugins: [
        new HTMLWebpackPlugin({
            filename: './index.html',
            template: path.join(__dirname, 'src/index.html'),

        })
    ]
}