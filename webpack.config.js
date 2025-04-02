const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.ts',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@core': path.resolve(__dirname, 'src/core'),
        '@adapters': path.resolve(__dirname, 'src/adapters'),
        '@plugins': path.resolve(__dirname, 'src/plugins'),
      },
    },
    output: {
      filename: isProduction ? 'ktrace.[contenthash].js' : 'ktrace.js',
      path: path.resolve(__dirname, 'dist'),
      library: {
        name: 'KTrace',
        type: 'umd',
        export: 'default'
      },
      globalObject: 'this',
      clean: true,
    },
    externals: {
      // 排除electron作为外部依赖，这样在没有安装electron的环境中也能正常工作
      'electron': 'commonjs electron'
    },
    optimization: {
      minimize: isProduction,
      minimizer: [new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction,
          },
        },
      })],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/demo/index.html',
        filename: 'index.html',
        inject: 'head', // 在头部注入脚本，确保在页面加载时可访问
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 9000,
      hot: true,
    },
  };
}; 