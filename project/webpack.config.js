const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const devMode = process.env.NODE_ENV !== 'production';

const path = require('path');

const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

module.exports = {
    entry: {
        app: './src/main.js',
      },
    output: {
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        filename: 'main.[contenthash].js',
    },
    module: {
        rules: [
            {
              test: /\.css$/i,
              use: [
                devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                'css-loader',
              ],
            },
            // {
            //   test: /\.(svg)$/i,
            //   type: 'asset',
            // },
            {
              test: /\.svg$/,
              use: ['raw-loader'],
            },
            {
              test: /\.(?:js|mjs|cjs)$/,
              exclude: /node_modules/,
              use: {
                    loader: 'babel-loader',
                    options: {
                      presets: [
                        ['@babel/preset-env', { targets: 'defaults' }]
                      ]
                    }
                  },
            },
            {
              test: /\.js$/,
              use: 'babel-loader',
              exclude: /node_modules/,
            },
        ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        title: 'Форма оплаты',
        attributes: {

        },
      }),
    ],
    devServer: {
      historyApiFallback: true,
      // contentBase: './dist',
      static: './src',
      port: 9000,
      hot: true,
      clean: true,
      watchFiles: path.join(__dirname, 'src'),
      port: 9000,
      overlay: {
        warnings: true,
        errors: true,
      },
    },
    optimization: {
        minimizer: [
          '...',
          new ImageMinimizerPlugin({
            minimizer: {
              implementation: ImageMinimizerPlugin.svgoMinify,
              options: {
                encodeOptions: {
                  // Pass over SVGs multiple times to ensure all optimizations are applied. False by default
                  multipass: true,
                  plugins: [
                    // set of built-in plugins enabled by default
                    // see: https://github.com/svg/svgo#default-preset
                    'preset-default',
                  ],
                },
              },
            },
          }),
        ],
      },
};
