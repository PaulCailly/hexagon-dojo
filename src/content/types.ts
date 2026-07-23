export type TagColor = "cyan" | "amber" | "violet" | "emerald" | "slate";

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface ReviewIssue {
  text: string;
  correct: boolean;
  why: string;
}

export interface ReviewMission {
  title: string;
  intro: string;
  code: string;
  issues: ReviewIssue[];
  fix: string;
}

export type DrillAnswer = "Port" | "Adapter" | "Use case" | "Composition root";

export interface DrillItem {
  code: string;
  answer: DrillAnswer;
  why: string;
}

export interface TalkCard {
  cat: string;
  color: TagColor;
  q: string;
  a: string;
}

export interface QuizSet {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface DrillSet {
  id: string;
  title: string;
  items: DrillItem[];
}

export interface TestMission {
  id: string;
  title: string;
  brief: string;
  checklist: string[];
  solution: string;
}

export interface BookPart {
  title: string;
  from: number;
  to: number;
}

export type BookBlock =
  | { t: "p"; c: string }
  | { t: "code"; c: string }
  | { t: "take"; c: string }
  | { t: "li"; c: string[] };

export interface BookChapter {
  title: string;
  blocks: BookBlock[];
}
