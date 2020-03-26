const KeysUsagesStore = require('./KeysUsagesStore')
const KeysZipper = require('./KeysZipper')
const R = require('ramda')
const path = require('path')
const translationsExtractor = require('./translationsExtractor')
const getTranslationsForIgnoredKeys = require('./getTranslationsForIgnoredKeys')
const ReplaceDependency = require('./ReplaceDependency');

const PLUGIN_NAME = 'KekPlugin'
const translationMethodNames = ['t', 'translate']

function transformedLocale(originalLocale, keysMap, minimizeKeys) {
  return Object.entries(keysMap).reduce((acc, [originalKey, newKey]) => {
    const originalKeyPath = originalKey.split('.')
    const newPath = minimizeKeys ? [newKey] : originalKeyPath
    const translation = R.path(originalKeyPath, originalLocale)
    return R.assocPath(newPath, translation, acc)
  }, {})
}

function transformTranslationsJSON(originalTranslations, keysMap, minimizeKeys) {
  return Object.keys(originalTranslations).reduce((acc, language) => {
    return {
      ...acc,
      [language]: transformedLocale(originalTranslations[language], keysMap, minimizeKeys)
    }
  }, {})
}

class KekPlugin {
  constructor(config) {
    this.config = config
    this._usagesStore = new KeysUsagesStore()
  }

  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, factory => {
      factory.hooks.parser.for('javascript/auto').tap(PLUGIN_NAME, parser => {
        this.extractUsedKeys(parser);
      });
    });

    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.dependencyTemplates.set(
        ReplaceDependency,
        new ReplaceDependency.Template()
      )

      compilation.hooks.afterOptimizeChunks.tap(PLUGIN_NAME, () => {
        if(compilation.compiler.parentCompilation) return

        const keysMap = new KeysZipper(this._usagesStore).zip()
        const usagesMap = this._usagesStore.get()

        if (this.config.minimizeKeys) {
          this.replaceMarksWithRuntimeKeys(compilation, keysMap, usagesMap)
        }

        this.processTranslationsObject(compilation, keysMap)
      });
    });
  }

  extractUsedKeys(parser) {
    parser.hooks.callAnyMember
      .for('I18n')
      .tap(PLUGIN_NAME, (expression) => {
        if (!translationMethodNames.includes(expression.callee.property.name))
          return

        if (expression.arguments.length < 1) {
          this.omitError('At least one required')
          return
        }

        const translationKeyArgument = expression.arguments[0]
        if (translationKeyArgument.type !== 'Literal') {
          this.omitError('First argument should be a string')
          return
        }

        const usage = {
          key: translationKeyArgument.value,
          issuer: {
            path: parser.state.module.request,
            range: translationKeyArgument.range,
            loc: translationKeyArgument.loc,
          },
        }

        this.addTranslationKeyUsage(usage)
      });
  }

  addTranslationKeyUsage(usage) {
    this._usagesStore.add(usage)
  }

  replaceMarksWithRuntimeKeys(compilation, keysMap, usagesMap) {
    const modulesToTransform = Object.values(usagesMap).map(({issuers}) => issuers.map(({path}) => path)).flat()
    const uniqueModules = new Set(modulesToTransform)

    compilation.modules.filter(module => uniqueModules.has(module.userRequest))

    compilation.modules.forEach(module => {
      Object.entries(usagesMap).forEach(([key, info]) => {
        const issuers = info.issuers.filter(issuer => issuer.path === module.userRequest)
        if (issuers.length === 0) return
        console.log(module.userRequest, issuers, key)

        issuers.forEach(issuer => {
          const replaceDependency = new ReplaceDependency(
            issuer.range,
            keysMap[key],
          )
          module.addDependency(replaceDependency)
        })
      })
    })
  }

  processTranslationsObject(compilation, keysMap) {
    const expectedRequest = path.resolve(this.config.translationsModule)

    const translationsModule = compilation.modules.find((module) => (
      module.resource === expectedRequest
    ))

    if (!translationsModule) {
      this.omitError('translations not found')
      return
    }

    const originalTranslations = translationsExtractor(this.config.source)
    const translationsForIgnoredKeys = getTranslationsForIgnoredKeys(originalTranslations, this.config.ignoreKeys)
    const extractedTranslations = transformTranslationsJSON(originalTranslations, keysMap, this.config.minimizeKeys)

    const resultedTranslations = R.mergeDeepLeft(translationsForIgnoredKeys, extractedTranslations)

    translationsModule._source._value = translationsModule._source._value.replace('{}', JSON.stringify(resultedTranslations))
  }

  omitError(errorMessage) {
    console.error(errorMessage)
  }
}

module.exports = KekPlugin;
