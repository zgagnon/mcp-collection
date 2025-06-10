# Project Management MCP Server

A Model Context Protocol (MCP) server for managing user stories and project tasks.

## Features

The server offers tools for project management tasks:

- **add_user_story**: Adds a new user story to the project management system
- **list_user_stories**: Lists user stories with optional filtering by status, priority, or assignee

## Installation

The server can be run directly using npx without installation:

```bash
npx @modelcontextprotocol/server-project-management
```

Or you can install it globally:

```bash
npm install -g @modelcontextprotocol/server-project-management
mcp-server-project-management
```

## Usage Options

```bash
# Basic usage with default settings
npx @modelcontextprotocol/server-project-management

# Specify data directory
npx @modelcontextprotocol/server-project-management --dataDir ~/my-project-data

# Show help
npx @modelcontextprotocol/server-project-management --help
```

### Command Line Options

- `-t, --transport <type>`: Transport type: stdio (default), sse, http
- `-d, --dataDir <path>`: Path to data directory (default: .project-mcp-data in current directory)
- `-h, --help`: Show help message

### With MCP Inspector (for debugging)

```bash
npx @modelcontextprotocol/inspector npx @modelcontextprotocol/server-project-management
```

### VS Code Integration

Add to your VS Code settings.json:

```json
{
  "mcp": {
    "servers": {
      "project-management": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-project-management"]
      }
    }
  }
}
```

## API

### `add_user_story`

Adds a new user story to the project management system.

**Input:**
- `title` (string, required): Short description of the user story
- `description` (string, required): Longer description in "As a... I want... So that..." format
- `status` (enum, optional): Current status - New, In Progress, In Review, Done, Blocked (default: New)
- `priority` (enum, optional): Importance level - Low, Medium, High, Critical (default: Medium)
- `assignee` (string, optional): Person assigned to this story
- `points` (number, optional): Story points / effort estimation

**Output:**
- Confirmation message with the ID of the created user story

### `list_user_stories`

Lists user stories from the project management system with optional filtering.

**Input:**
- `status` (enum, optional): Filter by status - New, In Progress, In Review, Done, Blocked
- `priority` (enum, optional): Filter by priority - Low, Medium, High, Critical
- `assignee` (string, optional): Filter by assignee

**Output:**
- List of user stories matching the provided filters, or all stories if no filters are provided

## Data Storage

User stories are stored as JSON in the specified data directory. By default, this is a `.project-mcp-data` directory in the current working directory.

## Development

```bash
# Clone the repository
git clone <repository-url>
cd project-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```