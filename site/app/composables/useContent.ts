import manifestJson from '../generated/manifest.json'
import type { LessonFull, LessonMeta, Manifest, ModuleMeta, SearchEntry } from '~/types/content'

const manifest = manifestJson as unknown as Manifest

const lessonLoaders = import.meta.glob<LessonFull>('../generated/lessons/*/*.json', { import: 'default' })
const moduleLoaders = import.meta.glob<{ html: string }>('../generated/modules/*.json', { import: 'default' })

export interface FlatLesson extends LessonMeta {
  module: ModuleMeta
  index: number
}

const flat: FlatLesson[] = manifest.modules.flatMap(m => m.lessons.map(l => ({ ...l, module: m, index: 0 })))
flat.forEach((l, i) => (l.index = i))
const byId = new Map(flat.map(l => [l.id, l]))

export function useContent() {
  const getModule = (slug: string) => manifest.modules.find(m => m.slug === slug)
  const getLesson = (id: string) => byId.get(id)
  const lessonPath = (id: string) => `/modules/${id}`
  const neighbors = (id: string) => {
    const l = byId.get(id)
    if (!l) return { prev: undefined, next: undefined }
    return { prev: flat[l.index - 1], next: flat[l.index + 1] }
  }
  async function loadLesson(moduleSlug: string, lessonSlug: string) {
    const loader = lessonLoaders[`../generated/lessons/${moduleSlug}/${lessonSlug}.json`]
    return loader ? await loader() : null
  }
  async function loadModuleIntro(moduleSlug: string) {
    const loader = moduleLoaders[`../generated/modules/${moduleSlug}.json`]
    return loader ? await loader() : null
  }
  async function loadSearch(): Promise<SearchEntry[]> {
    const mod = await import('../generated/search.json')
    return mod.default as SearchEntry[]
  }
  return { manifest, flat, getModule, getLesson, lessonPath, neighbors, loadLesson, loadModuleIntro, loadSearch }
}

export const pluralize = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}

export const formatHours = (minutes: number) => {
  if (minutes < 60) return `${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}
