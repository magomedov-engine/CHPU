// Сборка учебного контента: Obsidian-заметки → JSON для сайта.
// Запуск: node scripts/build-content.mjs [--watch]
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'app', 'generated')
const IMG_OUT = path.join(ROOT, 'public', 'content', 'img')
const ACCENTS = ['sky', 'lavender', 'mint', 'peach', 'butter', 'rose']
const MODULE_DIR_RE = /^(\d{2})\. (.+)$/

// ---------- транслитерация и slug ----------
const TR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
export function slugify(s) {
  return s
    .toLowerCase()
    .split('')
    .map(c => (c in TR ? TR[c] : c))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EMOJI_RE = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s*/u
function splitEmoji(text) {
  const m = text.match(EMOJI_RE)
  return m ? { emoji: m[1], rest: text.slice(m[0].length) } : { emoji: '', rest: text }
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const stripTags = html =>
  html
    .replace(/<pre class="mermaid-src"[\s\S]*?<\/pre>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<\/(p|li|h\d|div|tr|td|th|pre|summary|figure)>|<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?…)»])/g, '$1')
    .trim()
const clip = (text, n) => {
  if (text.length <= n) return text
  const cut = text.slice(0, n)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '))
  return end > n * 0.6 ? cut.slice(0, end) + (cut[end] === '.' ? '.' : '…') : cut.replace(/[\s,;:—-]+\S*$/, '') + '…'
}

// ---------- иконки выносок (lucide, inline) ----------
const svg = d =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
const ICONS = {
  abstract: svg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'),
  info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
  tip: svg('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'),
  example: svg('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>'),
  warning: svg('<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
  danger: svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.4.5 1.2 1.5 2.4 2.5 2.9"/>'),
  question: svg('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
  quote: svg('<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>'),
  success: svg('<path d="M21.8 10A10 10 0 1 1 17 3.3"/><path d="m9 11 3 3L22 4"/>'),
  todo: svg('<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>'),
}
const CHEVRON = svg('<path d="m6 9 6 6 6-6"/>')
const COPY = svg('<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>')
const KIND = {
  abstract: 'abstract', summary: 'abstract', tldr: 'abstract',
  info: 'info', note: 'info',
  tip: 'tip', hint: 'tip', important: 'tip',
  success: 'success', check: 'success', done: 'success',
  question: 'question', help: 'question', faq: 'question',
  warning: 'warning', caution: 'warning', attention: 'warning',
  danger: 'danger', error: 'danger', failure: 'danger', fail: 'danger', bug: 'danger',
  example: 'example', quote: 'quote', cite: 'quote', todo: 'todo',
}
const DEFAULT_TITLE = {
  abstract: 'Кратко', info: 'Справка', tip: 'Совет', success: 'Готово', question: 'Вопрос',
  warning: 'Внимание', danger: 'Опасно', example: 'Пример', quote: 'Цитата', todo: 'Задание',
}

// ---------- подсветка G-кода ----------
const GC_CLASS = { N: 'n', G: 'g', M: 'm', X: 'x', U: 'x', Y: 'y', V: 'y', Z: 'z', W: 'z', A: 'a', B: 'a', C: 'a', I: 'p', J: 'p', K: 'p', R: 'p', Q: 'p', P: 'p', L: 'p', F: 'f', S: 'f', T: 't', H: 't', D: 't', O: 'o', E: 'p' }
function hlCodePart(part) {
  let out = ''
  let last = 0
  const re = /([A-Za-z])(-?\d+(?:\.\d*)?|-?\.\d+)|(#\d+)/g
  let m
  while ((m = re.exec(part))) {
    out += esc(part.slice(last, m.index))
    if (m[3]) out += `<span class="gc-v">${esc(m[3])}</span>`
    else {
      const cls = GC_CLASS[m[1].toUpperCase()]
      out += cls ? `<span class="gc-${cls}">${esc(m[0])}</span>` : esc(m[0])
    }
    last = re.lastIndex
  }
  return out + esc(part.slice(last))
}
function hlGcode(code) {
  return code
    .replace(/\n$/, '')
    .split('\n')
    .map(line => {
      if (/^\s*%\s*$/.test(line)) return `<span class="gc-o">${esc(line)}</span>`
      let out = ''
      let buf = ''
      for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (c === '(') {
          out += hlCodePart(buf)
          buf = ''
          const end = line.indexOf(')', i)
          const j = end === -1 ? line.length : end + 1
          out += `<span class="gc-c">${esc(line.slice(i, j))}</span>`
          i = j - 1
        } else if (c === ';') {
          out += hlCodePart(buf)
          buf = ''
          out += `<span class="gc-c">${esc(line.slice(i))}</span>`
          i = line.length
        } else buf += c
      }
      return out + hlCodePart(buf)
    })
    .join('\n')
}

// ---------- markdown-it ----------
function createMd() {
  const md = new MarkdownIt({ html: true, linkify: false, typographer: false })

  // Выноски Obsidian: > [!type]± Заголовок
  md.core.ruler.before('inline', 'callouts', state => {
    const tokens = state.tokens
    const stack = []
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (t.type === 'blockquote_open') {
        const p = tokens[i + 1]
        const inl = tokens[i + 2]
        if (p?.type === 'paragraph_open' && inl?.type === 'inline') {
          const m = inl.content.match(/^\[!(\w+)\]([+-]?)[ \t]*([^\n]*)\n?([\s\S]*)$/)
          if (m) {
            const kind = KIND[m[1].toLowerCase()] || 'info'
            t.meta = { callout: { kind, fold: m[2], title: m[3].trim() } }
            inl.content = m[4]
            if (!m[4].trim()) tokens.splice(i + 1, 3)
          }
        }
        stack.push(t)
      } else if (t.type === 'blockquote_close') {
        const open = stack.pop()
        if (open?.meta?.callout) t.meta = { callout: open.meta.callout }
      }
    }
  })

  // id заголовков + оглавление
  md.core.ruler.push('heading_ids', state => {
    const used = new Map()
    state.env.toc = []
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (t.type !== 'heading_open') continue
      const inline = tokens[i + 1]
      const text = (inline.children || [])
        .filter(c => c.type === 'text' || c.type === 'code_inline')
        .map(c => c.content)
        .join('')
        .trim()
      let id = slugify(text) || 'section'
      const n = used.get(id) || 0
      used.set(id, n + 1)
      if (n) id = `${id}-${n + 1}`
      t.attrSet('id', id)
      const level = Number(t.tag.slice(1))
      if (level === 2 || level === 3) state.env.toc.push({ id, text, level })
    }
  })

  md.renderer.rules.blockquote_open = (tokens, idx) => {
    const c = tokens[idx].meta?.callout
    if (!c) return '<blockquote>'
    const title = c.title ? md.renderInline(c.title) : DEFAULT_TITLE[c.kind]
    const head = `<span class="callout-icon">${ICONS[c.kind]}</span><span class="callout-title-text">${title}</span>`
    if (c.fold) {
      return `<details class="callout callout-${c.kind}"${c.fold === '+' ? ' open' : ''}><summary class="callout-title">${head}<span class="callout-chevron">${CHEVRON}</span></summary><div class="callout-body">`
    }
    return `<div class="callout callout-${c.kind}"><div class="callout-title">${head}</div><div class="callout-body">`
  }
  md.renderer.rules.blockquote_close = (tokens, idx) => {
    const c = tokens[idx].meta?.callout
    if (!c) return '</blockquote>'
    return c.fold ? '</div></details>' : '</div></div>'
  }
  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>'
  md.renderer.rules.table_close = () => '</table></div>'
  md.renderer.rules.fence = (tokens, idx) => {
    const t = tokens[idx]
    const lang = t.info.trim().split(/\s+/)[0] || 'text'
    if (lang === 'mermaid') {
      return `<div class="mermaid-block"><pre class="mermaid-src" hidden>${esc(t.content)}</pre><div class="mermaid-out" aria-label="Схема"></div></div>`
    }
    const label = lang === 'gcode' ? 'G-код' : lang === 'text' ? 'текст' : lang
    const body = lang === 'gcode' ? hlGcode(t.content) : esc(t.content.replace(/\n$/, ''))
    return `<div class="code-block" data-lang="${esc(lang)}"><div class="code-head"><span class="code-lang">${esc(label)}</span><button class="code-copy" type="button" aria-label="Скопировать код">${COPY}<span>Копировать</span></button></div><pre><code>${body}</code></pre></div>`
  }
  const defaultLink = md.renderer.rules.link_open || ((tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts))
  md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
    const t = tokens[idx]
    const href = t.attrGet('href') || ''
    if (href.startsWith('/')) {
      t.attrSet('href', `__BASE__${href.slice(1)}`)
      t.attrSet('data-internal', '')
    } else if (/^https?:/.test(href)) {
      t.attrSet('target', '_blank')
      t.attrSet('rel', 'noopener')
    }
    return defaultLink(tokens, idx, opts, env, self)
  }
  return md
}

// ---------- основная сборка ----------
function build() {
  const t0 = Date.now()
  const md = createMd()
  const moduleDirs = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && MODULE_DIR_RE.test(d.name))
    .map(d => d.name)
    .sort()

  fs.rmSync(OUT, { recursive: true, force: true })
  fs.rmSync(IMG_OUT, { recursive: true, force: true })
  fs.mkdirSync(path.join(OUT, 'lessons'), { recursive: true })
  fs.mkdirSync(path.join(OUT, 'modules'), { recursive: true })
  fs.mkdirSync(IMG_OUT, { recursive: true })

  // Проход 1: карта ссылок и копирование картинок
  const linkMap = new Map()
  const images = new Set()
  const plan = moduleDirs.map((dir, mi) => {
    const [, num, name] = dir.match(MODULE_DIR_RE)
    const mslug = `${num}-${slugify(name)}`
    const files = fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith('.md')).sort()
    const att = path.join(ROOT, dir, 'attachments')
    if (fs.existsSync(att)) {
      for (const f of fs.readdirSync(att)) {
        if (!/\.(svg|png|jpe?g|webp|gif)$/i.test(f)) continue
        fs.copyFileSync(path.join(att, f), path.join(IMG_OUT, f))
        images.add(f)
      }
    }
    const lessons = []
    let indexFile = null
    for (const f of files) {
      const base = f.replace(/\.md$/, '')
      const fm = base.match(/^(\d{2})\. (.+)$/)
      if (!fm) continue
      if (fm[1] === '00') {
        indexFile = f
        const route = `/modules/${mslug}`
        linkMap.set(base, route)
        linkMap.set(`${dir}/${base}`, route)
        continue
      }
      const lslug = `${fm[1]}-${slugify(fm[2])}`
      const route = `/modules/${mslug}/${lslug}`
      linkMap.set(base, route)
      linkMap.set(`${dir}/${base}`, route)
      lessons.push({ file: f, base, number: Number(fm[1]), shortTitle: fm[2], slug: lslug })
    }
    return { dir, num: Number(num), name, mslug, accent: ACCENTS[mi % ACCENTS.length], indexFile, lessons }
  })

  // Подготовка markdown под markdown-it
  function prepare(raw, dir) {
    const { content, data } = matter(raw)
    let text = content.replace(/\r\n/g, '\n')
    // Навигация Obsidian внизу/вверху — у сайта своя
    text = text
      .split('\n')
      .filter(l => !/^\s*(⬅️|➡️)/.test(l))
      .join('\n')
    text = text.replace(/(\n\s*(---)?\s*)+$/, '\n')
    // H1
    let h1 = ''
    text = text.replace(/^# (.+)\n/m, (_, t) => {
      h1 = t.trim()
      return ''
    })
    // Встроенные картинки ![[file.svg]]
    text = text.replace(/!\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]/g, (_, file) => {
      const name = path.basename(file.trim())
      if (!images.has(name)) return ''
      return `<figure class="diagram" data-zoom><img src="__BASE__content/img/${encodeURI(name)}" alt="Схема" loading="lazy" decoding="async"></figure>`
    })
    // Вики-ссылки [[Цель|подпись]] (в таблицах — с экранированной чертой)
    text = text.replace(/\[\[([^\]]+?)\]\]/g, (_, inner) => {
      const [targetRaw, alias] = inner.split(/\\?\|/)
      const target = targetRaw.replace(/\\$/, '').split('#')[0].trim()
      const route = linkMap.get(target) || linkMap.get(target.split('/').pop())
      const label = (alias || target.split('/').pop().replace(/^\d{2}\. /, '')).trim()
      return route ? `[${label}](${route})` : label
    })
    return { text, h1, data, dir }
  }

  function minutesFrom(text) {
    const m = text.match(/⏱\s*~?\s*(\d+)\s*мин/)
    return m ? Number(m[1]) : null
  }

  const manifest = { generatedAt: new Date().toISOString(), stats: {}, modules: [] }
  const search = []
  let totalQuestions = 0
  let totalLessons = 0

  for (const mod of plan) {
    // Оглавление модуля
    let modTitle = mod.name
    let modEmoji = '📘'
    let modDescription = ''
    const tableMinutes = new Map()
    if (mod.indexFile) {
      const raw = fs.readFileSync(path.join(ROOT, mod.dir, mod.indexFile), 'utf8')
      const prep = prepare(raw, mod.dir)
      const { emoji, rest } = splitEmoji(prep.h1)
      modEmoji = emoji || modEmoji
      modTitle = rest.replace(/^Модуль\s+\d+\.\s*/, '') || mod.name
      for (const line of raw.split('\n')) {
        const m = line.match(/\[\[([^\]|\\]+)[^\]]*\]\].*?(\d+)\s*мин/)
        if (m) tableMinutes.set(m[1].trim(), Number(m[2]))
      }
      const env = {}
      const html = md.render(prep.text, env)
      const abstract = html.match(/<div class="callout callout-abstract">[\s\S]*?<div class="callout-body">([\s\S]*?)<\/div><\/div>/)
      modDescription = abstract ? clip(stripTags(abstract[1]), 240) : ''
      fs.writeFileSync(path.join(OUT, 'modules', `${mod.mslug}.json`), JSON.stringify({ html }))
    }

    const lessonsOut = []
    fs.mkdirSync(path.join(OUT, 'lessons', mod.mslug), { recursive: true })
    for (const l of mod.lessons) {
      const raw = fs.readFileSync(path.join(ROOT, mod.dir, l.file), 'utf8')
      const prep = prepare(raw, mod.dir)
      const env = {}
      const html = md.render(prep.text, env)
      const { emoji, rest } = splitEmoji(prep.h1)
      const title = rest.replace(/^Урок\s+\d+\.\s*/, '') || l.shortTitle
      const minutes = minutesFrom(raw) || tableMinutes.get(l.base) || 20
      const questions = (raw.match(/\[!question\]/g) || []).length
      totalQuestions += questions
      const sections = env.toc.filter(t => t.level === 2).map(({ id, text }) => ({ id, text }))
      const abstract = html.match(/<div class="callout callout-abstract">[\s\S]*?<div class="callout-body">([\s\S]*?)<\/div><\/div>/)
      const description = clip((abstract ? stripTags(abstract[1]) : stripTags(html)).replace(/⏱.*$/, '').trim(), 200)
      const id = `${mod.mslug}/${l.slug}`
      const lesson = {
        id, module: mod.mslug, slug: l.slug, number: l.number, shortTitle: l.shortTitle, title,
        emoji: emoji || '📄', minutes, questions, description, toc: env.toc, sections, html,
      }
      fs.writeFileSync(path.join(OUT, 'lessons', mod.mslug, `${l.slug}.json`), JSON.stringify(lesson))
      lessonsOut.push({ id, slug: l.slug, number: l.number, shortTitle: l.shortTitle, title, emoji: lesson.emoji, minutes, questions, description, sections })
      totalLessons++

      // Поисковый индекс: урок + разделы
      search.push({ type: 'lesson', id, sid: null, title: l.shortTitle, module: modTitle, text: description })
      const parts = html.split(/<h2 id="/)
      for (const part of parts.slice(1)) {
        const sid = part.slice(0, part.indexOf('"'))
        const sec = sections.find(s => s.id === sid)
        search.push({ type: 'section', id, sid, title: sec ? sec.text : sid, lesson: l.shortTitle, module: modTitle, text: stripTags('<h2 id="' + part).slice(0, 1400) })
      }
    }

    manifest.modules.push({
      slug: mod.mslug, number: mod.num, title: modTitle, shortTitle: mod.name, emoji: modEmoji,
      accent: mod.accent, description: modDescription,
      minutes: lessonsOut.reduce((s, l) => s + l.minutes, 0), lessons: lessonsOut,
    })
    search.push({ type: 'module', id: mod.mslug, sid: null, title: modTitle, module: modTitle, text: modDescription })
  }

  manifest.stats = {
    modules: manifest.modules.length,
    lessons: totalLessons,
    diagrams: images.size,
    questions: totalQuestions,
    minutes: manifest.modules.reduce((s, m) => s + m.minutes, 0),
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest))
  fs.writeFileSync(path.join(OUT, 'search.json'), JSON.stringify(search))
  console.log(`[content] ${manifest.stats.modules} модулей, ${totalLessons} уроков, ${images.size} схем, ${totalQuestions} вопросов — ${Date.now() - t0} мс`)
}

build()

if (process.argv.includes('--watch')) {
  let timer = null
  console.log('[content] слежу за изменениями заметок…')
  fs.watch(ROOT, { recursive: true }, (_, file) => {
    if (!file || !MODULE_DIR_RE.test(file.split(/[\\/]/)[0])) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      try { build() } catch (e) { console.error('[content] ошибка:', e.message) }
    }, 250)
  })
}
