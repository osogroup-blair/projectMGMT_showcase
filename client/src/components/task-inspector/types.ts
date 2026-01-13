export type InspectorWidthPreset = 'S' | 'M' | 'L';

export interface NavigationStackItem {
  taskId: string;
  title: string;
}

export interface InspectorOriginContext {
  source: 'sprint' | 'epic' | 'milestone' | 'board' | 'list' | 'home' | 'other';
  sourceId?: string;
  sourceName?: string;
}

export interface TaskInspectorState {
  isOpen: boolean;
  taskId: string | null;
  projectId: string | null;
  originContext: InspectorOriginContext | null;
  navigationStack: NavigationStackItem[];
  widthPreset: InspectorWidthPreset;
}

export const WIDTH_PRESETS: Record<InspectorWidthPreset, number> = {
  S: 400,
  M: 520,
  L: 680,
};
