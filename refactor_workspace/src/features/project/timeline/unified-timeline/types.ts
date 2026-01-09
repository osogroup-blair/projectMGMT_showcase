import type { Deliverable, Epic, Sprint, Milestone, ProjectStage, Project } from "@shared/schema";

export type ViewMode = "day" | "week" | "month" | "quarter" | "year";

export type LayerType = "sprints" | "milestones" | "stages" | "deliverables";

export interface LayerVisibility {
  sprints: boolean;
  milestones: boolean;
  stages: boolean;
  deliverables: boolean;
}

export interface TimelineConfig {
  dayWidth: number;
  rowHeight: number;
  headerHeight: number;
  subHeaderHeight: number;
}

export interface ViewModeConfig {
  dayWidth: number;
  tickInterval: (range: { start: Date; end: Date }) => Date[];
  format: (date: Date) => string;
  subFormat?: (date: Date) => string;
  add: (date: Date, amount: number) => Date;
  sub: (date: Date, amount: number) => Date;
}

export interface TimelineRange {
  start: Date;
  end: Date;
}

export interface TimelineItem {
  id: string;
  type: LayerType | "epic";
  name: string;
  startDate: Date;
  endDate?: Date;
  color?: string;
  progress?: number;
  status?: string;
  parentId?: string;
}

export interface UnifiedTimelineProps {
  project: Project;
  sprints?: Sprint[];
  milestones?: Milestone[];
  stages?: ProjectStage[];
  deliverables?: Deliverable[];
  epics?: Epic[];
  initialLayers?: Partial<LayerVisibility>;
  highlightItemId?: string;
}

export interface DeliverableWithEpics extends Deliverable {
  epics: Epic[];
  color: string;
}

export const LAYER_COLORS = {
  sprints: "#6366F1",
  milestones: "#F59E0B", 
  stages: "#10B981",
  deliverables: "#3B82F6",
};

export const DELIVERABLE_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
];

export const getDeliverableColor = (id: string): string => {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return DELIVERABLE_COLORS[hash % DELIVERABLE_COLORS.length];
};

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  sprints: true,
  milestones: true,
  stages: true,
  deliverables: true,
};
