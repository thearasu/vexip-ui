import { readFileSync } from 'fs'
import { resolveModule } from 'local-pkg'
import { toKebabCase } from '@vexip-ui/utils'

import type { ComponentInfo, ComponentResolver } from 'unplugin-vue-components/types'

export interface VexipUIResolverOptions {
  /**
   * import css or sass styles with components
   *
   * @default 'css'
   */
  importStyle?: boolean | 'css' | 'sass',
  /**
   * import the dark theme preset styles
   *
   * @default false
   */
  importDarkTheme?: boolean,
  /**
   * prefix for name of components
   *
   * @default ''
   */
  prefix?: string,
  /**
   * auto import for directives
   *
   * @default true
   */
  directives?: boolean
}

let components: string[] | undefined
let directives: Record<string, string[]> | undefined

function queryMetaData() {
  try {
    const root = resolveModule('vexip-ui') || process.cwd()
    const path =
      resolveModule('vexip-ui/meta-data.json') ||
      resolveModule('vexip-ui/meta-data.json', { paths: [root] })
    const metaData = JSON.parse(readFileSync(path!, 'utf-8'))

    components = metaData.components
    directives = metaData.directives
  } catch (e) {
    console.error(e)
    throw new Error('[vexip-ui:plugins] failed to load vexip-ui, have you installed it?')
  }
}

function getSideEffects(name: string, options: VexipUIResolverOptions) {
  const { importStyle, importDarkTheme } = options

  if (!importStyle) return

  name = toKebabCase(name)

  if (importStyle === 'sass') {
    return [
      'vexip-ui/style/preset.scss',
      ...(importDarkTheme ? ['vexip-ui/style/dark/preset.scss'] : []),
      `vexip-ui/style/${name}.scss`
    ]
  } else if (importStyle === true || importStyle === 'css') {
    return [
      'vexip-ui/css/preset.css',
      ...(importDarkTheme ? ['vexip-ui/theme/dark/index.css'] : []),
      `vexip-ui/css/${name}.css`
    ]
  }
}

function resolveComponent(
  name: string,
  options: VexipUIResolverOptions
): ComponentInfo | undefined {
  if (!components) return

  const { prefix } = options

  if (prefix) {
    if (!name.startsWith(prefix)) return

    name = name.substring(prefix.length)
  }

  if (!components.includes(name)) return

  return {
    name,
    from: 'vexip-ui',
    sideEffects: getSideEffects(name, options)
  }
}

function resolveDirective(
  name: string,
  options: VexipUIResolverOptions
): ComponentInfo | undefined {
  if (!options.directives || !directives) return

  name = `v${name}`
  const relatedComponents = directives[name]

  if (!relatedComponents) return

  return {
    name,
    from: 'vexip-ui',
    sideEffects: relatedComponents.length
      ? [
          ...new Set(
            relatedComponents.map(component => getSideEffects(component, options) || []).flat()
          )
        ]
      : undefined
  }
}

/**
 * The unplugin-vue-components Resolver for Vexip UI
 */
export function VexipUIResolver(options: VexipUIResolverOptions = {}): ComponentResolver[] {
  options = { importStyle: 'css', directives: true, ...options }

  return [
    {
      type: 'component',
      resolve: (name: string) => {
        if (!components) {
          queryMetaData()
        }

        return resolveComponent(name, options)
      }
    },
    {
      type: 'directive',
      resolve: (name: string) => {
        if (!directives) {
          queryMetaData()
        }

        return resolveDirective(name, options)
      }
    }
  ]
}