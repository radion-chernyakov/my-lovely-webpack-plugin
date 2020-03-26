const yaml = require('js-yaml')
const fs = require('fs')
const R = require('ramda')

const {resolve} = require('path')

const appLocales = (localesConfig) => (
  Object.keys(localesConfig.locales)
)

const localeFilesPaths = (localesConfig, locale) => {
  const relativePaths = localesConfig.locales[locale]

  const localesFolder = localesConfig.root

  return relativePaths.map(path => resolve(localesFolder, path))
}

const localesFilesPaths = (localesConfig) => (
  appLocales(localesConfig).reduce((acc, locale) => ({
    ...acc,
    [locale]: localeFilesPaths(localesConfig, locale),
  }), {})
)

const localeContent = (locale, localePaths) => {
  const rawFilesJSONContent = localePaths.map(path => (
    yaml.safeLoad(fs.readFileSync(path, 'utf8'))
  ))

  const actualFilesContent = rawFilesJSONContent.map(rawJSON => {
    const rootKeys = Object.keys(rawJSON)

    if (rootKeys.length > 1) throw new Error('multiple root keys not supported!')

    const rootKey = rootKeys[0]
    return rawJSON[rootKey]
  })

  return {[locale]: R.mergeAll(actualFilesContent)}
}

const translationsExtractor = (localesConfig) => (
  Object.entries(localesFilesPaths(localesConfig)).reduce((acc, [locale, localePaths]) => ({
    ...acc,
    ...localeContent(locale, localePaths)
  }), {})
)

module.exports = translationsExtractor
