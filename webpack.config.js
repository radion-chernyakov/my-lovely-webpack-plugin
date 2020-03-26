const path = require('path')
const KekPlugin = require('./src/KekPlugin')

module.exports = {
  entry: './random/index.js',
  mode: 'production',
  devtool: false,
  optimization: {
    minimize: false,
  },
  plugins: [
    new KekPlugin({
      source: {
        root: './random/locales',
        locales: {
          en: ['en.yml', 'en-US.yml'],
          ru: ['localization.ru.yml', 'translations.ru.yml'],
        },
      },
      translationsModule: './random/translations.js',
      ignoreKeys: [],
      minimizeKeys: true,
    }),
  ],
  // module: {
  //   rules: [
  //     {
  //       test: /\.js$/,
  //       use: [
  //         {
  //           loader: KekPlugin.loader,
  //         },
  //       ],
  //     },
  //   ],
  // },
}
