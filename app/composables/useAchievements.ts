import { useProgressStore } from '~/stores/progress'

export interface Achievement {
  id: string
  title: string
  text: string
  icon: string
  unlocked: boolean
  progress: number
}

export function useAchievements() {
  const store = useProgressStore()
  const { manifest } = useContent()

  return computed<Achievement[]>(() => {
    const total = manifest.stats.lessons
    const done = store.completedCount
    const modulesDone = manifest.modules.filter(m => store.moduleStats(m).complete).length
    const nightOwl = Object.values(store.completed).some(ts => {
      const h = new Date(ts).getHours()
      return h >= 23 || h < 5
    })
    const make = (id: string, title: string, text: string, icon: string, value: number, goal: number): Achievement => ({
      id, title, text, icon, progress: Math.min(1, value / goal), unlocked: value >= goal,
    })
    return [
      make('first', 'Первый шаг', 'Пройдите первый урок', '🚀', done, 1),
      make('five', 'Разогрев шпинделя', 'Пройдите 5 уроков', '🌀', done, 5),
      make('twenty', 'Уверенная подача', 'Пройдите 20 уроков', '⚙️', done, 20),
      make('module', 'Модуль закрыт', 'Завершите целый модуль', '🏁', modulesDone, 1),
      make('half', 'Половина пути', 'Пройдите половину курса', '🧭', done, Math.ceil(total / 2)),
      make('sections', 'Внимательный читатель', 'Отметьте 50 разделов', '📌', store.sectionsCount, 50),
      make('streak3', 'Три дня подряд', 'Занимайтесь 3 дня подряд', '🔥', store.streak, 3),
      make('streak7', 'Неделя без пропусков', 'Занимайтесь 7 дней подряд', '💎', store.streak, 7),
      make('owl', 'Ночная смена', 'Закончите урок после 23:00', '🦉', nightOwl ? 1 : 0, 1),
      make('all', 'Готов к собеседованию', 'Пройдите весь курс', '🎓', modulesDone, manifest.modules.length),
    ]
  })
}
