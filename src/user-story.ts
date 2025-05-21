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

export interface UserStory {
  id: string;
  title: string;
  description: string;
  status: StoryStatus;
  priority: StoryPriority;
  assignee?: string;
  points?: number;
  played?: boolean; // New field to track if a story has been played
  createdAt: Date;
  updatedAt: Date;
}
