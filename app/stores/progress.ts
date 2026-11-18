import { defineStore } from "pinia";
import type { ModuleMeta } from "~/types/content";

const STORAGE_KEY = "chpu-progress-v1";

export interface ProgressSnapshot {
  version: 1;
  completed: Record<string, number>;
  sections: Record<string, string[]>;
  last: { id: string; at: number } | null;
  activity: Record<string, number>;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const useProgressStore = defineStore("progress", () => {
  const completed = ref<Record<string, number>>({});
  const sections = ref<Record<string, string[]>>({});
  const last = ref<{ id: string; at: number } | null>(null);
  const activity = ref<Record<string, number>>({});
  const ready = ref(false);

  // ---------- сохранение ----------
  function snapshot(): ProgressSnapshot {
    return {
      version: 1,
      completed: completed.value,
      sections: sections.value,
      last: last.value,
      activity: activity.value,
    };
  }
  function apply(data: Partial<ProgressSnapshot>) {
    completed.value =
      data.completed && typeof data.completed === "object"
        ? { ...data.completed }
        : {};
    sections.value =
      data.sections && typeof data.sections === "object"
        ? { ...data.sections }
        : {};
    last.value = data.last ?? null;
    activity.value =
      data.activity && typeof data.activity === "object"
        ? { ...data.activity }
        : {};
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) apply(JSON.parse(raw));
    } catch {
      /* приватный режим / битые данные */
    }
    ready.value = true;
  }
  function save() {
    if (!ready.value) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
    } catch {
      /* хранилище недоступно */
    }
  }

  function bump() {
    const d = today();
    activity.value = { ...activity.value, [d]: (activity.value[d] || 0) + 1 };
  }

  // ---------- уроки ----------
  const isDone = (id: string) => !!completed.value[id];
  function setLesson(id: string, done: boolean, sectionIds: string[] = []) {
    const next = { ...completed.value };
    if (done) {
      next[id] = Date.now();
      if (sectionIds.length)
        sections.value = { ...sections.value, [id]: [...sectionIds] };
      bump();
    } else {
      delete next[id];
    }
    completed.value = next;
  }
  function toggleLesson(id: string, sectionIds: string[] = []) {
    const done = !isDone(id);
    setLesson(id, done, sectionIds);
    return done;
  }

  // ---------- разделы ----------
  const sectionsOf = (id: string) => sections.value[id] || [];
  const isSectionDone = (id: string, sid: string) =>
    sectionsOf(id).includes(sid);
  /** Возвращает true, если после переключения весь урок оказался пройден */
  function toggleSection(id: string, sid: string, all: string[]) {
    const cur = new Set(sectionsOf(id));
    if (cur.has(sid)) cur.delete(sid);
    else {
      cur.add(sid);
      bump();
    }
    sections.value = { ...sections.value, [id]: [...cur] };
    const allDone = all.length > 0 && all.every((s) => cur.has(s));
    if (allDone && !isDone(id)) {
      setLesson(id, true);
      return true;
    }
    if (!allDone && isDone(id)) {
      const next = { ...completed.value };
      delete next[id];
      completed.value = next;
    }
    return false;
  }

  function visit(id: string) {
    last.value = { id, at: Date.now() };
    const d = today();
    if (!activity.value[d]) bump();
  }

  // ---------- расчёты ----------
  function lessonFraction(id: string, sectionCount: number) {
    if (isDone(id)) return 1;
    if (!sectionCount) return 0;
    return Math.min(1, sectionsOf(id).length / sectionCount);
  }
  function moduleStats(m: ModuleMeta) {
    const done = m.lessons.filter((l) => isDone(l.id)).length;
    const fraction =
      m.lessons.reduce(
        (s, l) => s + lessonFraction(l.id, l.sections.length),
        0,
      ) / Math.max(1, m.lessons.length);
    return {
      done,
      total: m.lessons.length,
      fraction,
      complete: done === m.lessons.length,
    };
  }
  const completedCount = computed(() => Object.keys(completed.value).length);
  const sectionsCount = computed(() =>
    Object.values(sections.value).reduce((s, a) => s + a.length, 0),
  );
  const studyDays = computed(() => Object.keys(activity.value).length);
  const streak = computed(() => {
    let n = 0;
    const d = new Date();
    const key = (x: Date) =>
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    if (!activity.value[key(d)]) d.setDate(d.getDate() - 1);
    while (activity.value[key(d)]) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  });

  // ---------- импорт / экспорт ----------
  function exportJson() {
    return JSON.stringify(
      { ...snapshot(), exportedAt: new Date().toISOString() },
      null,
      2,
    );
  }
  function importJson(text: string) {
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || !("completed" in data))
      throw new Error("Неверный формат файла");
    apply(data);
  }
  function reset() {
    apply({});
  }

  return {
    completed,
    sections,
    last,
    activity,
    ready,
    load,
    save,
    isDone,
    setLesson,
    toggleLesson,
    sectionsOf,
    isSectionDone,
    toggleSection,
    visit,
    lessonFraction,
    moduleStats,
    completedCount,
    sectionsCount,
    studyDays,
    streak,
    exportJson,
    importJson,
    reset,
  };
});
