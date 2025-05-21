import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { UserStory } from './user-story.js';
import { v4 as uuidv4 } from 'uuid';

// Define the data file paths (defaults)
let DATA_DIR = path.join(process.cwd(), '.project-mcp-data');
let USER_STORIES_FILE = path.join(DATA_DIR, 'user-stories.json');

// Set custom data directory if needed
export function setDataDirectory(dirPath: string): void {
  // Use the provided path or default to a directory in user's home
  DATA_DIR = dirPath || path.join(os.homedir(), '.project-mcp-data');
  USER_STORIES_FILE = path.join(DATA_DIR, 'user-stories.json');
  
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
    const data = await fs.readFile(USER_STORIES_FILE, 'utf-8');
    return JSON.parse(data) as UserStory[];
  } catch (error) {
    // If file doesn't exist or has invalid JSON, return empty array
    if (
      error instanceof Error && 
      ('code' in error && error.code === 'ENOENT') || 
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
    'utf-8'
  );
}

// Add a new user story
export async function addUserStory(
  storyData: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UserStory> {
  const stories = await readUserStories();
  
  const now = new Date();
  const newStory: UserStory = {
    ...storyData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now
  };
  
  stories.push(newStory);
  await writeUserStories(stories);
  
  return newStory;
}