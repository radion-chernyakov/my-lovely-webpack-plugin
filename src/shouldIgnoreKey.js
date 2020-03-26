function isKeysRange(keyToIgnore) {
  return keyToIgnore.endsWith('*')
}

function isKeyFitsToRange(translationKey, keysRange) {
  return translationKey.startsWith(keysRange.replace('*', ''))
}

function ingoreKeysRange(translationKey, keysToIgnore) {
  return keysToIgnore.find(keyToIgnore => {
    if (!isKeysRange(keyToIgnore))
      return false

    return isKeyFitsToRange(translationKey, keyToIgnore)
  })
}

function ignoreExactKey(translationKey, keysToIgnore) {
  return keysToIgnore.includes(translationKey)
}

function shouldIgnoreKey(translationKey, keysToIgnore) {
  if (ignoreExactKey(translationKey, keysToIgnore))
    return true

  if (ingoreKeysRange(translationKey, keysToIgnore))
    return true

  return false
}

module.exports = shouldIgnoreKey
