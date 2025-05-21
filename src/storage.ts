import fs from "fs/promises";
import path from "path";
import os from "os";
import { UserStory } from "./user-story.js";
import { v4 as uuidv4 } from "uuid";

// Define the data file paths (defaults)
let DATA_DIR = path.join(process.cwd(), ".project-mcp-data");
let USER_STORIES_FILE = path.join(DATA_DIR, "user-stories.json");

// Set custom data directory if needed
export function setDataDirectory(dirPath: string): void {
  // Use the provided path or default to a directory in user's home
  DATA_DIR = dirPath || path.join(os.homedir(), ".project-mcp-data");
  USER_STORIES_FILE = path.join(DATA_DIR, "user-stories.json");

  // Log the data directory for debugging
  console.error(`Using data directory: ${DATA_DIR}`);
}

// Ensure the data directory exists
async function ensureDataDirectory(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.error(`Created data directory: ${DATA_DIR}`);
  }
}

// Read user stories from file
export async function readUserStories(): Promise<UserStory[]> {
  await ensureDataDirectory();

  try {
    const data = await fs.readFile(USER_STORIES_FILE, "utf-8");
    return JSON.parse(data) as UserStory[];
  } catch (error) {
    // If file doesn't exist or has invalid JSON, return empty array
    if (
      (error instanceof Error && "code" in error && error.code === "ENOENT") ||
      error instanceof SyntaxError
    ) {
      return [];
    }
    throw error;
  }
}

// Write user stories to file
export async function writeUserStories(stories: UserStory[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(
    USER_STORIES_FILE,
    JSON.stringify(stories, null, 2),
    "utf-8",
  );
}

// Add a new user story
export async function addUserStory(
  storyData: Omit<UserStory, "id" | "createdAt" | "updatedAt" | "played">,
): Promise<UserStory> {
  const stories = await readUserStories();

  const now = new Date();
  const newStory: UserStory = {
    ...storyData,
    id: uuidv4(),
    played: false, // Initialize played status to false
    createdAt: now,
    updatedAt: now,
  };

  stories.push(newStory);
  await writeUserStories(stories);

  return newStory;
}

// Mark a user story as played or unplayed
export async function markStoryPlayed(
  storyId: string,
  played: boolean,
): Promise<UserStory | null> {
  const stories = await readUserStories();

  const storyIndex = stories.findIndex((story) => story.id === storyId);
  if (storyIndex === -1) {
    return null; // Story not found
  }

  // Update the story
  const now = new Date();
  stories[storyIndex] = {
    ...stories[storyIndex],
    played: played,
    updatedAt: now,
  };

  await writeUserStories(stories);
  return stories[storyIndex];
}

// Reorder an unplayed user story
export async function reorderStory(
  storyId: string,
  newPosition: number,
): Promise<UserStory | null> {
  const stories = await readUserStories();

  // Find the story by ID
  const storyIndex = stories.findIndex((story) => story.id === storyId);
  if (storyIndex === -1) {
    return null; // Story not found
  }

  const story = stories[storyIndex];
  
  // Verify the story is unplayed
  if (story.played) {
    throw new Error("Cannot reorder played user stories");
  }

  // Get all unplayed stories
  const unplayedStories = stories.filter((story) => !story.played);
  
  // Find the current position of the story in the unplayed array
  const currentUnplayedIndex = unplayedStories.findIndex((s) => s.id === storyId);
  
  // Validate the new position is within bounds
  if (newPosition < 0 || newPosition >= unplayedStories.length) {
    throw new Error(`New position must be between 0 and ${unplayedStories.length - 1}`);
  }
  
  // If same position, no change needed
  if (currentUnplayedIndex === newPosition) {
    return story;
  }
  
  // Remove story from current position
  const storyToMove = unplayedStories.splice(currentUnplayedIndex, 1)[0];
  
  // Insert at new position
  unplayedStories.splice(newPosition, 0, storyToMove);
  
  // Reconstruct the full story array with played stories in their original positions
  const playedStories = stories.filter((story) => story.played);
  const updatedStories = [...playedStories, ...unplayedStories];
  
  // Update timestamp
  const now = new Date();
  const updatedStory = {
    ...storyToMove,
    updatedAt: now,
  };
  
  // Find and update the story in the full array
  const updatedIndex = updatedStories.findIndex((s) => s.id === storyId);
  updatedStories[updatedIndex] = updatedStory;
  
  // Save updated stories
  await writeUserStories(updatedStories);
  
  // Return the updated story
  return updatedStory;
}
