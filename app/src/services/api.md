# Chat API Documentation

## Base Node Structure
All nodes in the graph database have the following base structure:
```typescript
{
  id: string,      // Unique identifier for the node
  label: string,   // Type of node ('user', 'chat', or 'message')
  properties: {    // Additional properties specific to node type
    // ... properties vary by node type
  }
}
```

## Endpoints

### Create User
Creates a new user node in the graph database.

**Endpoint:** `create_user`

**Request Body:**
```json
{
  "cognito_id": string,   // AWS Cognito user ID
  "username": string      // User's display name
}
```

**Response:**
Returns the created user node with structure:
```json
{
  "id": string,
  "label": "user",
  "properties": {
    "username": string,
    "cognito_id": string,
    "created_at": string  // RFC3339 timestamp
  }
}
```

**Notes:**
- The user node is indexed by `cognito_id`
- `created_at` is automatically set to current UTC time

### Create Chat
Creates a new chat node in the graph database.

**Endpoint:** `create_chat`

**Request Body:**
```json
{
  "chat_name": string  // Name/title of the chat
}
```

**Response:**
Returns the ID of the created chat node:
```json
string  // Chat node ID
```

**Notes:**
- Chat nodes include an automatic `created_at` timestamp in RFC3339 format
- Chat nodes are not indexed by any property

### Add Message
Adds a new message to a chat and creates necessary relationships.

**Endpoint:** `add_message`

**Request Body:**
```json
{
  "cognito_id": string,  // User's Cognito ID
  "chat_id": string,     // ID of the chat to add message to
  "chat_name": string,   // Name of the chat (updates if different)
  "message_type": string,// whether the message is from the user ("user") or the ai ("assistant")
  "message": string      // Message content
}
```

**Response:**
Returns the ID of the created message node:
```json
string  // Message node ID
```

**Graph Operations:**
1. Creates a message node with the message content
2. Creates a "sent_message" edge from user to message
3. Creates a "chat_message" edge from chat to message
4. Updates chat name if different from existing

**Notes:**
- Creates relationships between user → message and chat → message
- Will update the chat name if it differs from existing
- All edges include `created_at` timestamps
- Returns error if chat doesn't exist or user not found

### Get Chats and Messages
Retrieves all chats and their messages for a specific user.

**Endpoint:** `get_chats_and_messages`

**Request Body:**
```json
{
  "cognito_id": string  // User's Cognito ID
}
```

**Response:**
Returns a map of chat IDs to chat details and messages:
```json
{
  [chat_id: string]: {
    "chat_id": string,
    "chat_name": string,
    "messages": {
        "message": string,
        "message_type": string,
        "created_at": string
    }  // Array of message contents
  }
}
```

**Notes:**
- Retrieves all chats associated with the user
- For each chat, retrieves all messages via "chat_message" edges
- Messages are returned in array order (presumably chronological)
- Empty messages array if chat has no messages

## Graph Structure
The API creates the following graph structure:

```
[User Node] --(sent_message)--> [Message Node] <--(chat_message)-- [Chat Node]
```

- **User Node**: Indexed by cognito_id
- **Chat Node**: Contains chat name and timestamp
- **Message Node**: Contains message content and timestamp
- **Edges**: Both contain created_at timestamps

## Error Handling
Most endpoints return `GraphError` in the following cases:
- Node not found
- Invalid node types
- Database transaction failures
- Invalid request body format