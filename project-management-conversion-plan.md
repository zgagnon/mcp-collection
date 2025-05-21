# Project Conversion Plan: Web-MCP to Project Management MCP Server

Based on my analysis of the project, here's a detailed plan to convert the current web-based MCP server into a project management MCP server:

## 1. File Structure Changes

**Remove:**
- `src/duckduckgo.ts` - Web search functionality
- `src/url-content.ts` - URL content fetching functionality

**Add:**
- `src/user-story.ts` - User story data model
- `src/storage.ts` - File-based persistence for user stories

## 2. Implementation Details

### A. Create `user-story.ts`
```typescript
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
```

### B. Create `storage.ts`
```typescript
import fs from 'fs/promises';
import path from 'path';
import { UserStory } from './user-story.js';
import { v4 as uuidv4 } from 'uuid';

// Define the data file path
const DATA_DIR = path.join(process.cwd(), '.project-mcp-data');
const USER_STORIES_FILE = path.join(DATA_DIR, 'user-stories.json');

// Ensure the data directory exists
async function ensureDataDirectory(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(DATA_DIR, { recursive: true });
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
```

### C. Update `index.ts`
```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { StoryStatus, StoryPriority } from './user-story.js';
import { addUserStory, readUserStories } from './storage.js';

const AddUserStoryArgsSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.enum([
    StoryStatus.NEW,
    StoryStatus.IN_PROGRESS,
    StoryStatus.REVIEW,
    StoryStatus.DONE,
    StoryStatus.BLOCKED
  ]).default(StoryStatus.NEW),
  priority: z.enum([
    StoryPriority.LOW,
    StoryPriority.MEDIUM,
    StoryPriority.HIGH,
    StoryPriority.CRITICAL
  ]).default(StoryPriority.MEDIUM),
  assignee: z.string().optional(),
  points: z.number().optional()
});

const ListUserStoriesArgsSchema = z.object({
  status: z.enum([
    StoryStatus.NEW,
    StoryStatus.IN_PROGRESS,
    StoryStatus.REVIEW,
    StoryStatus.DONE,
    StoryStatus.BLOCKED
  ]).optional(),
  priority: z.enum([
    StoryPriority.LOW,
    StoryPriority.MEDIUM,
    StoryPriority.HIGH,
    StoryPriority.CRITICAL
  ]).optional(),
  assignee: z.string().optional()
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Server setup
const server = new Server(
  {
    name: "project-management-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_user_story",
        description:
          "Adds a new user story to the project management system. " +
          "A user story represents a feature or functionality from the user's perspective.",
        inputSchema: zodToJsonSchema(AddUserStoryArgsSchema) as ToolInput,
      },
      {
        name: "list_user_stories",
        description:
          "Lists user stories from the project management system with optional filtering. " +
          "Returns all user stories if no filters are provided.",
        inputSchema: zodToJsonSchema(ListUserStoriesArgsSchema) as ToolInput,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "add_user_story": {
        const parsed = AddUserStoryArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for add_user_story: ${parsed.error}`);
        }
        const newStory = await addUserStory(parsed.data);
        return {
          content: [{ 
            type: "text", 
            text: `User story created successfully with ID: ${newStory.id}` 
          }],
        };
      }
      
      case "list_user_stories": {
        const parsed = ListUserStoriesArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for list_user_stories: ${parsed.error}`);
        }
        const stories = await readUserStories();
        
        // Apply filters if provided
        let filteredStories = stories;
        if (parsed.data.status) {
          filteredStories = filteredStories.filter(story => story.status === parsed.data.status);
        }
        if (parsed.data.priority) {
          filteredStories = filteredStories.filter(story => story.priority === parsed.data.priority);
        }
        if (parsed.data.assignee) {
          filteredStories = filteredStories.filter(story => story.assignee === parsed.data.assignee);
        }
        
        // Format the output
        const formattedStories = filteredStories.map(story => {
          return `ID: ${story.id}\nTitle: ${story.title}\nStatus: ${story.status}\nPriority: ${story.priority}\nAssignee: ${story.assignee || 'Unassigned'}\nPoints: ${story.points || 'Not estimated'}\n${story.description}\n---`;
        }).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: filteredStories.length > 0 ? formattedStories : "No user stories found matching the criteria" 
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Project Management Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
```

### D. Update `package.json`
```json
{
  "name": "@modelcontextprotocol/server-project-management",
  "version": "0.1.0",
  "description": "MCP server for project management tasks",
  "license": "MIT",
  "author": "Anthropic, PBC (https://anthropic.com)",
  "homepage": "https://modelcontextprotocol.io",
  "bugs": "https://github.com/modelcontextprotocol/servers/issues",
  "type": "module",
  "bin": {
    "mcp-server-project-management": "dist/src/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc && shx chmod +x dist/src/*.js",
    "prepare": "npm run build",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.1.0",
    "uuid": "^9.0.0",
    "zod-to-json-schema": "^3.24.5"
  },
  "devDependencies": {
    "@types/node": "^22.15.3",
    "@types/uuid": "^9.0.2",
    "shx": "^0.3.4",
    "typescript": "^5.8.3"
  }
}
```

## 3. Implementation Steps

1. **Remove web capabilities**:
   - Delete `duckduckgo.ts` and `url-content.ts`
   - Remove web-related dependencies from package.json

2. **Add new files**:
   - Create `user-story.ts` with the user story data model
   - Create `storage.ts` with file-based persistence logic

3. **Update existing files**:
   - Update `index.ts` to remove web-search tools and add user story tools
   - Update `package.json` with new dependencies and metadata

4. **Install new dependencies**:
   - Run `npm install --save uuid`
   - Run `npm install --save-dev @types/uuid`

5. **Build and test**:
   - Run `npm run build` to compile the TypeScript code
   - Test the server with example user story operations

## 4. Future Enhancements (Optional)

- Implement `update_user_story` tool for modifying existing stories
- Implement `delete_user_story` tool for removing stories
- Add filtering by date ranges or text search
- Add support for attachments or comments on user stories
- Implement user story export to different formats (CSV, Markdown, etc.)