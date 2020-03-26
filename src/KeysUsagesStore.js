const Usages = require('./Usages')

class KeysUsagesStore {
  constructor() {
    this._usages = {}
  }

  add(usage) {
    if (this._isNewKey(usage))
      this._addNewKeyUsage(usage)
    else
      this._addExistingKeyUsage(usage)
  }

  get() {
    return Object.entries(this._usages).reduce((acc, [key, info]) => {
      return {
        ...acc,
        [key]: new Usages({
          key,
          issuers: info.issuers,
          argumentKeys: info.argumentKeys,
        })
      }
    }, {})
  }

  _isNewKey(usage) {
    return this._usages[usage.key] === undefined
  }

  _addNewKeyUsage(usage) {
    const {key, argumentKeys, issuer} = usage

    this._usages[key] = {
      argumentKeys: [argumentKeys],
      issuers: [issuer],
    }
  }

  _addExistingKeyUsage(usage) {
    this._usages[usage.key] = {
      argumentKeys: [...this._usages[usage.key].argumentKeys, usage.argumentKeys],
      issuers: [...this._usages[usage.key].issuers, usage.issuer]
    }
  }
}

module.exports = KeysUsagesStore
