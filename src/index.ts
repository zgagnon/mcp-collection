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
import { StoryStatus, StoryPriority, StoryProgressState } from './user-story.js';
import { addUserStory, readUserStories, setDataDirectory, markStoryPlayed, reorderStory, updateStoryProgressState, editUserStory } from './storage.js';

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options: {
    transport: string,
    dataDir: string | undefined,
    help: boolean
  } = {
    transport: 'stdio',
    dataDir: undefined,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--transport' || arg === '-t') {
      if (i + 1 < args.length) {
        options.transport = args[++i];
      }
    } else if (arg === '--dataDir' || arg === '-d') {
      if (i + 1 < args.length) {
        options.dataDir = args[++i];
      }
    }
  }

  return options;
};

// Process command line arguments
const options = parseArgs();

// Show help if requested
if (options.help) {
  console.log(`
Project Management MCP Server

Usage: npx @modelcontextprotocol/server-project-management [options]

Options:
  -t, --transport <type>  Transport type: stdio (default), sse, http
  -d, --dataDir <path>    Path to data directory (default: .project-mcp-data)
  -h, --help              Show this help message
  `);
  process.exit(0);
}

// Set data directory if provided
if (options.dataDir) {
  setDataDirectory(options.dataDir);
}

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
  assignee: z.string().optional(),
  played: z.boolean().optional(), // Kept for backward compatibility
  progressState: z.enum([
    StoryProgressState.UNSTARTED,
    StoryProgressState.STARTED,
    StoryProgressState.PLAYED
  ]).optional() // New field to filter by progress state
});

const MarkStoryPlayedArgsSchema = z.object({
  storyId: z.string(),
  played: z.boolean()
});

const ReorderStoryArgsSchema = z.object({
  storyId: z.string(),
  newPosition: z.number().int().min(0)
});

const UpdateStoryProgressStateArgsSchema = z.object({
  storyId: z.string(),
  progressState: z.enum([
    StoryProgressState.UNSTARTED,
    StoryProgressState.STARTED,
    StoryProgressState.PLAYED
  ])
});

const EditUserStoryArgsSchema = z.object({
  storyId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
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
  assignee: z.string().optional(),
  points: z.number().optional()
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
          "Returns all user stories if no filters are provided. " +
          "Use progressState to filter by Unstarted, Started, or Played states, or use played=true/false for backward compatibility.",
        inputSchema: zodToJsonSchema(ListUserStoriesArgsSchema) as ToolInput,
      },
      {
        name: "mark_story_played",
        description:
          "Marks a user story as played or unplayed. " +
          "Set played=true to mark as played, played=false to mark as unplayed.",
        inputSchema: zodToJsonSchema(MarkStoryPlayedArgsSchema) as ToolInput,
      },
      {
        name: "update_story_progress_state",
        description:
          "Updates a user story's progress state to Unstarted, Started, or Played. " +
          "This provides more fine-grained control over a story's lifecycle than the played flag.",
        inputSchema: zodToJsonSchema(UpdateStoryProgressStateArgsSchema) as ToolInput,
      },
      {
        name: "reorder_story",
        description:
          "Reorders an unstarted user story to a new position. " +
          "Only stories in the Unstarted state can be reordered. " +
          "Position is zero-based and refers to the position among unstarted stories only.",
        inputSchema: zodToJsonSchema(ReorderStoryArgsSchema) as ToolInput,
      },
      {
        name: "edit_user_story",
        description:
          "Edits an existing user story in the project management system. " +
          "Provide the storyId and any fields you want to update. " +
          "Only the provided fields will be updated.",
        inputSchema: zodToJsonSchema(EditUserStoryArgsSchema) as ToolInput,
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
        // Filter by progressState if provided (takes precedence over played)
        if (parsed.data.progressState !== undefined) {
          filteredStories = filteredStories.filter(story =>
            story.progressState === parsed.data.progressState
          );
        }
        // Filter by played status if provided and progressState not provided
        else if (parsed.data.played !== undefined) {
          filteredStories = filteredStories.filter(story =>
            story.played === parsed.data.played
          );
        }

        // Format the output
        const formattedStories = filteredStories.map(story => {
          return `ID: ${story.id}\nTitle: ${story.title}\nStatus: ${story.status}\nPriority: ${story.priority}\nAssignee: ${story.assignee || 'Unassigned'}\nPoints: ${story.points || 'Not estimated'}\nProgress State: ${story.progressState || (story.played ? StoryProgressState.PLAYED : StoryProgressState.UNSTARTED)}\nPlayed: ${story.played ? 'Yes' : 'No'}\n${story.description}\n---`;
        }).join('\n');

        return {
          content: [{
            type: "text",
            text: filteredStories.length > 0 ? formattedStories : "No user stories found matching the criteria"
          }],
        };
      }

      case "mark_story_played": {
        const parsed = MarkStoryPlayedArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for mark_story_played: ${parsed.error}`);
        }

        const { storyId, played } = parsed.data;
        const updatedStory = await markStoryPlayed(storyId, played);

        if (!updatedStory) {
          throw new Error(`User story with ID ${storyId} not found`);
        }

        return {
          content: [{
            type: "text",
            text: `User story '${updatedStory.title}' has been marked as ${played ? 'played' : 'unplayed'}`
          }],
        };
      }

      case "update_story_progress_state": {
        const parsed = UpdateStoryProgressStateArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for update_story_progress_state: ${parsed.error}`);
        }

        const { storyId, progressState } = parsed.data;
        const updatedStory = await updateStoryProgressState(storyId, progressState);

        if (!updatedStory) {
          throw new Error(`User story with ID ${storyId} not found`);
        }

        return {
          content: [{
            type: "text",
            text: `User story '${updatedStory.title}' progress state has been updated to ${progressState}`
          }],
        };
      }

      case "reorder_story": {
        const parsed = ReorderStoryArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for reorder_story: ${parsed.error}`);
        }

        const { storyId, newPosition } = parsed.data;
        
        try {
          const updatedStory = await reorderStory(storyId, newPosition);

          if (!updatedStory) {
            throw new Error(`User story with ID ${storyId} not found`);
          }

          return {
            content: [{
              type: "text",
              text: `User story '${updatedStory.title}' has been moved to position ${newPosition}`
            }],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to reorder story: ${errorMessage}`);
        }
      }

      case "edit_user_story": {
        const parsed = EditUserStoryArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for edit_user_story: ${parsed.error}`);
        }

        const { storyId, ...updates } = parsed.data;
        const updatedStory = await editUserStory(storyId, updates);

        if (!updatedStory) {
          throw new Error(`User story with ID ${storyId} not found`);
        }

        // Construct a message about what was updated
        const updatedFields = Object.keys(updates).length > 0 
          ? `Updated fields: ${Object.keys(updates).join(', ')}`
          : "No fields were changed";

        return {
          content: [{
            type: "text",
            text: `User story '${updatedStory.title}' has been updated. ${updatedFields}`
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

// Start server with appropriate transport
async function runServer() {
  const transportType = options.transport;
  let transport;

  switch (transportType) {
    case 'stdio':
      transport = new StdioServerTransport();
      break;
    case 'sse':
      // Add SSE transport support
      console.error('SSE transport not yet implemented');
      process.exit(1);
      break;
    case 'http':
      // Add HTTP transport support
      console.error('HTTP transport not yet implemented');
      process.exit(1);
      break;
    default:
      console.error(`Unknown transport: ${transportType}`);
      process.exit(1);
  }

  await server.connect(transport);
  console.error(`Project Management Server running with ${transportType} transport`);
}

// Handle termination signals
process.on('SIGINT', () => {
  console.error('Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Server shutting down...');
  process.exit(0);
});

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
