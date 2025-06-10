# Implementation Plan: Edit Existing User Story

This document outlines the plan for implementing the "Edit existing user story" feature.

## Overview

Currently, the project management system allows creating, listing, marking as played/unplayed, updating progress state, and reordering user stories. However, there's no way to edit the content of an existing story (title, description, status, etc.). This feature will add that functionality.

## Implementation Steps

### 1. Add `editUserStory` function to `storage.ts`

Add a new function that allows updating specific fields of a user story:

```typescript
export async function editUserStory(
  storyId: string,
  updates: Partial<Pick<UserStory, "title" | "description" | "status" | "priority" | "assignee" | "points">>
): Promise<UserStory | null> {
  const stories = await readUserStories();

  const storyIndex = stories.findIndex((story) => story.id === storyId);
  if (storyIndex === -1) {
    return null; // Story not found
  }

  // Update the story with provided fields
  const now = new Date();
  const updatedStory = {
    ...stories[storyIndex],
    ...updates,
    updatedAt: now,
  };

  stories[storyIndex] = updatedStory;
  await writeUserStories(stories);
  return updatedStory;
}
```

### 2. Add schema definition in `index.ts`

Create a Zod schema to validate the input for the edit operation:

```typescript
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
```

### 3. Add tool definition to the tools list

Add the new tool to the `ListToolsRequestSchema` handler:

```typescript
{
  name: "edit_user_story",
  description:
    "Edits an existing user story in the project management system. " +
    "Provide the storyId and any fields you want to update. " +
    "Only the provided fields will be updated.",
  inputSchema: zodToJsonSchema(EditUserStoryArgsSchema) as ToolInput,
},
```

### 4. Add handler for the tool

Add a case in the `CallToolRequestSchema` handler:

```typescript
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
```

## Edge Cases and Considerations

1. **Story Not Found**: Return an appropriate error if the story with the given ID doesn't exist.
2. **No Updates Provided**: If no update fields are provided, just update the `updatedAt` timestamp but don't change any other fields.
3. **Validation**: The Zod schema handles basic type validation, but consider adding business rules validation (e.g., non-empty title/description).
4. **Update Timestamp**: Always update the `updatedAt` timestamp when editing a story, even if only minor changes are made.
5. **Special Fields**: Don't allow editing of special fields like `id`, `createdAt`, `played`, and `progressState` which have specific functions or should not change.

## Design Principles

This implementation follows existing patterns in the codebase and adheres to modern API design principles:

1. **Resource-oriented**: Operates on a specific user story identified by ID
2. **Partial updates**: Only updates the fields that are provided (similar to HTTP PATCH)
3. **Consistency**: Follows the existing code patterns for error handling and response format
4. **Type safety**: Uses TypeScript and Zod to ensure type safety and validation

## Testing Considerations

When implementing this feature, test the following scenarios:

1. Editing a single field of a user story
2. Editing multiple fields simultaneously
3. Attempting to edit a non-existent story
4. Providing invalid values for fields
5. Providing no update fields
6. Verifying the `updatedAt` timestamp is updated