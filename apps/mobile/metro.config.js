const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

/**
 * 모노레포용 Metro 설정.
 *
 * ⚠️ 기본 설정은 앱 폴더만 감시하므로 `@kbokkang/shared` · `@kbokkang/assets` 를
 *    번들할 수 없다. 워크스페이스 루트를 watchFolders 에 넣어야 심볼릭 링크를 따라간다.
 *
 * ⚠️ `nodeModulesPaths` 에 루트 node_modules 도 넣는다 — `node-linker=hoisted` 라
 *    대부분의 패키지가 루트에 평평하게 깔린다.
 */
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
