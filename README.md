# Web MCP Server

A Model Context Protocol (MCP) server that provides web search and content retrieval capabilities for AI assistants.

## Features

The server offers two primary tools:

- **search_duckduckgo**: Performs web searches using DuckDuckGo and returns URLs of the search results
- **read_url**: Fetches and processes content from URLs, removing HTML markup for better readability

## Setup

```bash
# Install dependencies
npm install

# Development (with auto-reload)
npm run dev

# Production build
npm run build
npm start
```

## Running locally

use 

`npx https://zgagnon.com/webmcp`

or

`nix run github:zgagnon.com/webmcp`


## API

### `search_duckduckgo`

Performs a web search using DuckDuckGo and returns only the URLs of the search results.

**Input:**
- `query` (string, required): The search query to be executed
- `limit` (number, optional): Maximum number of results to return (default: 10)

**Output:**
- A list of URLs matching the search query

### `read_url`

Fetches and returns the text content of a specified URL, with HTML markup removed. Uses Mozilla's Readability to extract meaningful content.

**Input:**
- `url` (string, required): The URL to fetch content from
- `useReadabilityMode` (boolean, optional): Whether to use Mozilla's Readability to extract the main content (default: true)
- `maxLength` (number, optional): Maximum length of returned content in characters (default: 10000)

**Output:**
- The plain text content from the URL, potentially truncated to fit within context windows

## Error Handling

The server will return an error if:
- Invalid arguments are provided to any tool
- URL fetching fails
- Search execution fails

## Implementation Details

The server uses:
- JSDOM and Mozilla's Readability for HTML processing and content extraction
- Node-fetch for HTTP requests
- Zod for schema validation
