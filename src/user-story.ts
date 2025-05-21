export interface UserStory {
  id: string;             // Unique identifier (auto-generated)
  title: string;          // Short description
  description: string;    // Longer description in "As a... I want... So that..." format
  status: StoryStatus;    // Current status
  priority: StoryPriority;// Importance level
  assignee?: string;      // Person assigned to this story (optional)
  points?: number;        // Story points / effort estimation (optional)
  createdAt: Date;        // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}

export enum StoryStatus {
  NEW = "New",
  IN_PROGRESS = "In Progress",
  REVIEW = "In Review",
  DONE = "Done",
  BLOCKED = "Blocked"
}

export enum StoryPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical"
}