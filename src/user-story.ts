export enum StoryStatus {
  NEW = "New",
  IN_PROGRESS = "In Progress",
  REVIEW = "In Review",
  DONE = "Done",
  BLOCKED = "Blocked",
}

export enum StoryPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical",
}

export enum StoryProgressState {
  UNSTARTED = "Unstarted",
  STARTED = "Started",    // Preparing for future story
  PLAYED = "Played"
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  status: StoryStatus;
  priority: StoryPriority;
  assignee?: string;
  points?: number;
  played?: boolean; // Kept for backward compatibility
  progressState?: StoryProgressState; // New field to track story progress state
  createdAt: Date;
  updatedAt: Date;
}
