export type Accent = "sky" | "lavender" | "mint" | "peach" | "butter" | "rose";

export interface SectionRef {
  id: string;
  text: string;
}

export interface LessonMeta {
  id: string;
  slug: string;
  number: number;
  shortTitle: string;
  title: string;
  emoji: string;
  minutes: number;
  questions: number;
  description: string;
  sections: SectionRef[];
}

export interface ModuleMeta {
  slug: string;
  number: number;
  title: string;
  shortTitle: string;
  emoji: string;
  accent: Accent;
  description: string;
  minutes: number;
  lessons: LessonMeta[];
}

export interface Manifest {
  generatedAt: string;
  stats: {
    modules: number;
    lessons: number;
    diagrams: number;
    questions: number;
    minutes: number;
  };
  modules: ModuleMeta[];
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface LessonFull extends LessonMeta {
  module: string;
  toc: TocItem[];
  html: string;
}

export interface SearchEntry {
  type: "module" | "lesson" | "section";
  id: string;
  sid: string | null;
  title: string;
  lesson?: string;
  module: string;
  text: string;
}
