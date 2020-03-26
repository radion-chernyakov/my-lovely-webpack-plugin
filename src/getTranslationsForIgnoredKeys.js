const R = require('ramda')

function localeTranslationsForIgnoredKeys(originalLocaleTranslations, keysToIgnore) {
  const exactKeys = keysToIgnore.filter(key => !key.endsWith('*'))
  const keysRanges = keysToIgnore.filter(key => key.endsWith('*')).map(key => key.replace('.*', ''))

  return [...exactKeys, ...keysRanges].reduce((acc, key) => {
    const keyPath = key.split('.')
    return R.assocPath(keyPath, R.path(keyPath, originalLocaleTranslations), acc)
  }, {})
}

function getTranslationsForIgnoredKeys(originalTranslations, keysToIgnore) {
  return Object.keys(originalTranslations).reduce((acc, locale) => ({
    ...acc,
    [locale]: localeTranslationsForIgnoredKeys(originalTranslations[locale], keysToIgnore)
  }), {})
}

module.exports = getTranslationsForIgnoredKeys
