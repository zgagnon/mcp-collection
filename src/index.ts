#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
// No filesystem imports needed anymore
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { searchDuckDuckGo } from './duckduckgo.js';
import { fetchUrlContent } from './url-content.js';

// No command line arguments needed anymore
// The web-mcp service doesn't require access to the file system

const SearchDuckDuckGoArgsSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(10),
});

const ReadUrlArgsSchema = z.object({
  url: z.string(),
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Server setup
const server = new Server(
  {
    name: "web-search-server",
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
        name: "search_duckduckgo",
        description:
          "Performs a web search using DuckDuckGo and returns only the URLs of the search results. " +
          "This tool is useful for finding relevant web resources without displaying the full search results content.",
        inputSchema: zodToJsonSchema(SearchDuckDuckGoArgsSchema) as ToolInput,
      },
      {
        name: "read_url",
        description:
          "Fetches and returns the text content of a specified URL, with HTML markup removed.",
        inputSchema: zodToJsonSchema(ReadUrlArgsSchema) as ToolInput,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "search_duckduckgo": {
        const parsed = SearchDuckDuckGoArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for search_duckduckgo: ${parsed.error}`);
        }
        const urls = await searchDuckDuckGo(parsed.data.query, parsed.data.limit);
        return {
          content: [{ 
            type: "text", 
            text: urls.length > 0 ? urls.join("\n") : "No search results found" 
          }],
        };
      }
      
      case "read_url": {
        const parsed = ReadUrlArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for read_url: ${parsed.error}`);
        }
        const content = await fetchUrlContent(parsed.data.url);
        return {
          content: [{ 
            type: "text", 
            text: content || "No content found at the specified URL" 
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
  console.error("Web Search Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});