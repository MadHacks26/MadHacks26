// src/lib/roadmapStore.ts
export const ROADMAP_DATA_KEY = "madhacks_roadmap_data_v1";
export const ROADMAP_CHECKS_KEY = "madhacks_roadmap_checks_v1";

export type RoadmapChecklistItem = {
  type: "study" | "pratice" | "practice" | string;
  title: string;
  url?: string;
  topic?: string;
  reason?: string;
  difficulty?: "easy" | "medium" | "hard" | string;
};

export type RoadmapDay = {
  day: number;
  date_placeholder: string;
  focus_area: string;
  hours_allocated: number;
  checklist: RoadmapChecklistItem[];
};

export type RoadmapPayload = RoadmapDay[];

export function saveRoadmapData(payload: RoadmapPayload) {
  localStorage.setItem(ROADMAP_DATA_KEY, JSON.stringify(payload));
}

export function loadRoadmapMeta() {
  const raw = localStorage.getItem(ROADMAP_DATA_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return {
      company: parsed.company ?? null,
      role: parsed.role ?? null,
      total_days: parsed.total_days ?? null,
      daily_hours: parsed.daily_hours ?? null,
    };
  } catch {
    return null;
  }
}

export type ChecksMap = Record<string, boolean>;

export function loadChecks(): ChecksMap {
  try {
    const raw = localStorage.getItem(ROADMAP_CHECKS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ChecksMap;
  } catch {
    return {};
  }
}

export function saveChecks(checks: ChecksMap) {
  localStorage.setItem(ROADMAP_CHECKS_KEY, JSON.stringify(checks));
}

export function makeTaskKey(day: number, index: number) {
  return `d${day}_i${index}`;
}