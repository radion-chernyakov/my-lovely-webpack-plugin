class KeysZipper {
  constructor(keysStore) {
    this._keyStore = keysStore
    this._zip_meta = {}
  }

  zip() {
    const usagesMap = this._usagesMap()
    const priorities = this._priorityCounter(usagesMap)
    const keysMap = this._mapKeys(priorities)

    return keysMap
  }

  _usagesMap() {
    return Object.keys(this._keyStore.get()).reduce((acc, key) => {
      return {
        ...acc,
        [key]: this._keyStore.get()[key].argumentKeys.length,
      }
    }, {})
  }

  _priorityCounter(map) {
    return Object.entries(map).map(([key, usagesCount]) => ({
      key,
      priority: key.length * usagesCount,
    }))
  }

  _mapKeys(priorities) {
    return priorities.sort((first, second) => (
      first.priority < second.priority
    )).reduce((acc, item, index) => {
      return {
        ...acc,
        [item.key]: index.toString(36),
      }
    }, {})
  }
}

module.exports = KeysZipper
