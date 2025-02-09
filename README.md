# Rust AI Chat Assistant

A modern web application for getting help with Rust programming through AI assistance. Built with Next.js, TypeScript, and HelixDB.

## Features

- 🤖 AI-powered Rust programming assistance
- 🔐 AWS Cognito authentication
- 🌓 Dark/Light mode support
- 💻 Code syntax highlighting
- 📱 Responsive design
- 🌳 Chat history with tree structure
- ⚡ Real-time responses
- 🎨 Clean, modern UI with monospace font

## Prerequisites

- Node.js 18+ and npm
- AWS account with Cognito User Pool
- OpenAI API key

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_AWS_REGION=your_aws_region
NEXT_PUBLIC_AWS_USER_POOL_ID=your_user_pool_id
NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID=your_user_pool_client_id
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

The application is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and it will handle the rest.

Make sure to add the environment variables in your Vercel project settings.

## Tech Stack

- TypeScript
- Next.js 14
- Redux Toolkit
- Tailwind 
- AWS Amplify & Cognito
- OpenAI API
- HelixDB


### File Structure

```
app/
└── src/
      ├── app/              # Next.js app directory
      ├── components/       # React components
      ├── config/          # Configuration files
      ├── services/        # API services
      ├── store/           # Redux store and slices
      └── types/           # TypeScript types
```

## Backend

### Helix Queries
```js
QUERY create_user(cognito_id: String, username: String) => 
   user <- AddV<User>({username: username, cognito_id: cognito_id})::INDEX("cognito_id")
   RETURN user

QUERY create_chat(cognito_id: String, chat_name: String) => 
   chat <- AddV<Chat>({chat_name: chat_name})
   V<User>({"cognito_id": cognito_id})::AddE<CreatedChat>::From(chat)
   RETURN chat

QUERY add_message(chat_id: String, message: String, message_type: String) => 
   message <- AddV<Message>({message: message, message_type: message_type})
   V<Chat>(chat_id)::AddE<ChatMessage>::To(message)
   RETURN message

QUERY get_chats_and_messages(cognito_id: String) => 
   chats <- V<User>({"cognito_id": cognito_id})::Out<CreatedChat>
   RETURN chats::{
            chat_id: _::ID,
            chat_name: _::Props("chat_name"),
            messages: _::In<ChatMessage>::Props("message", "message_type", "created_at")
         }

QUERY update_chat_name(chat_id: String, chat_name: String) => 
   V<Chat>(chat_id)::UpdateProps({"chat_name": chat_name})
   RETURN "Success"

QUERY delete_chat(chat_id: String) => 
   V<Chat>(chat_id)::Drop()
   RETURN "Success"

```

### Generated rust code

```rust 
use get_routes::handler;
use helix_engine::graph_core::traversal::TraversalBuilder;
use helix_engine::graph_core::traversal_steps::{
    RSourceTraversalSteps, RTraversalSteps, WSourceTraversalSteps, WTraversalBuilderMethods,
    WTraversalSteps,
};
use helix_engine::props;
use helix_engine::types::GraphError;
use helix_gateway::router::router::HandlerInput;
use protocol::response::Response;
use protocol::traversal_value::TraversalValue;
use protocol::{filterable::Filterable, value::Value};
use sonic_rs::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

#[handler]
pub fn create_user(input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
    let db = Arc::clone(&input.graph.storage);

    #[derive(Serialize, Deserialize)]
    struct RSUser {
        cognito_id: String,
        username: String,
    }
    let data = sonic_rs::from_slice::<RSUser>(&input.request.body)?;

    let mut txn = db.graph_env.write_txn().unwrap();
    let mut tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);

    tr.add_v(
        &mut txn,
        "user",
        props! {
            "username" => data.username,
            "cognito_id" => data.cognito_id,
            "created_at" => chrono::Utc::now().to_rfc3339(),
        },
        Some(&["cognito_id".to_string()]),
    );
    let user = tr.result(txn)?;
    response.body = sonic_rs::to_vec(&user).unwrap();
    Ok(())
}

#[handler]
pub fn create_chat(input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
    let db = Arc::clone(&input.graph.storage);

    #[derive(Serialize, Deserialize)]
    struct Chat {
        cognito_id: String,
        chat_name: String,
    }
    let data = sonic_rs::from_slice::<Chat>(&input.request.body)?;

    let mut txn = db.graph_env.write_txn().unwrap();
    let mut tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);

    tr.add_v(
        &mut txn,
        "chat",
        props! {
            "chat_name" => data.chat_name,
            "created_at" => chrono::Utc::now().to_rfc3339(),
        },
        None,
    );
    let chat_id = match tr.finish()? {
        TraversalValue::NodeArray(nodes) => nodes.first().unwrap().id.clone(),
        _ => return Err(GraphError::InvalidNode),
    };

    let mut tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);

    tr.v_from_secondary_index(&txn, "cognito_id", &Value::String(data.cognito_id));
    tr.add_e_to(
        &mut txn,
        "created_chat",
        &chat_id,
        props! { "created_at" => chrono::Utc::now().to_rfc3339() },
    );

    tr.result(txn)?;

    response.body = sonic_rs::to_vec(&chat_id).unwrap();
    Ok(())
}

#[handler]
pub fn add_message(input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
    let db = Arc::clone(&input.graph.storage);

    #[derive(Serialize, Deserialize)]
    struct Message {
        chat_id: String,
        message: String,
        message_type: String,
    }
    let data = sonic_rs::from_slice::<Message>(&input.request.body)?;

    let mut txn = db.graph_env.write_txn().unwrap();
    let mut tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);

    tr.add_v(
        &mut txn,
        "message",
        props! {
            "message" => data.message,
            "message_type" => data.message_type,
            "created_at" => chrono::Utc::now().to_rfc3339(),
        },
        None,
    );
    let message_id = match tr.current_step {
        TraversalValue::NodeArray(nodes) => nodes.first().unwrap().id.clone(),
        _ => return Err(GraphError::InvalidNode),
    };

    let mut tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);

    tr.v_from_id(&txn, data.chat_id.as_str());
    tr.add_e_to(
        &mut txn,
        "chat_message",
        &message_id,
        props! { "created_at" => chrono::Utc::now().to_rfc3339() },
    );

    tr.result(txn)?;

    response.body = sonic_rs::to_vec(&message_id).unwrap();
    Ok(())
}

#[handler]
pub fn get_chats_and_messages(
    input: &HandlerInput,
    response: &mut Response,
) -> Result<(), GraphError> {
    let db = Arc::clone(&input.graph.storage);

    #[derive(Serialize, Deserialize)]
    struct ChatRequest {
        cognito_id: String,
    }
    let data = sonic_rs::from_slice::<ChatRequest>(&input.request.body)?;

    let txn = db.graph_env.read_txn().unwrap();
    let mut tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);

    tr.v_from_secondary_index(&txn, "cognito_id", &Value::String(data.cognito_id));
    tr.out(&txn, "created_chat");

    let chats = tr.finish()?;

    #[derive(Serialize)]
    struct Message {
        message: String,
        message_type: String,
        created_at: String,
    }

    #[derive(Serialize)]
    struct ChatMessage {
        chat_id: String,
        chat_name: String,
        messages: Vec<Message>,
    }

    let mut chat_messages = HashMap::new();

    match chats {
        TraversalValue::NodeArray(chats) => {
            for chat in chats {
                let mut tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);
                tr.v_from_id(&txn, &chat.id);
                tr.out(&txn, "chat_message");
                let messages = tr.finish()?;
                let messages: Vec<Message> = match messages {
                    TraversalValue::NodeArray(messages) => messages
                        .iter()
                        .map(|message| {
                            let message = Message {
                                message: match message.check_property("message") {
                                    Some(Value::String(s)) => s.clone(),
                                    _ => "".to_string(),
                                },
                                message_type: match message.check_property("message_type") {
                                    Some(Value::String(s)) => s.clone(),
                                    _ => "".to_string(),
                                },
                                created_at: match message.check_property("created_at") {
                                    Some(Value::String(s)) => s.clone(),
                                    _ => "".to_string(),
                                },
                            };
                            message
                        })
                        .collect(),
                    _ => vec![],
                };
                chat_messages.insert(
                    chat.id.clone(),
                    ChatMessage {
                        chat_id: chat.id.clone(),
                        chat_name: {
                            match chat.check_property("chat_name") {
                                Some(Value::String(s)) => s.clone(),
                                Some(_) => "".to_string(),
                                None => "".to_string(),
                            }
                        },

                        messages,
                    },
                );
            }
        }
        _ => {}
    }

    txn.commit()?;

    response.body = sonic_rs::to_vec(&chat_messages).unwrap();
    Ok(())
}

#[handler]
pub fn update_chat_name(input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
    let db = Arc::clone(&input.graph.storage);

    #[derive(Serialize, Deserialize, Debug)]
    struct UpdateChatName {
        chat_id: String,
        chat_name: String,
    }
    let data = sonic_rs::from_slice::<UpdateChatName>(&input.request.body)?;

    let mut txn = db.graph_env.write_txn().unwrap();
    let mut tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);

    tr.v_from_id(&txn, data.chat_id.as_str());
    match tr.current_step {
        TraversalValue::NodeArray(ref nodes) => {
            if nodes.len() == 1 {
                let chat = nodes.first().unwrap();
                if chat.check_property("chat_name") != Some(&Value::String(data.chat_name.clone()))
                {
                    tr.update_props(
                        &mut txn,
                        props! {
                            "chat_name" => data.chat_name,
                        },
                    );
                } else {
                }
            } else {
                return Err(GraphError::MultipleNodesWithSameId);
            }
        }
        _ => {
            return Err(GraphError::InvalidNode);
        }
    }

    tr.result(txn)?;

    response.body = sonic_rs::to_vec(&"Success").unwrap();
    Ok(())
}

#[handler]
pub fn delete_chat(input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
    let db = Arc::clone(&input.graph.storage);

    #[derive(Serialize, Deserialize, Debug)]
    struct DeleteChat {
        chat_id: String,
    }
    let data = sonic_rs::from_slice::<DeleteChat>(&input.request.body)?;

    let mut txn = db.graph_env.write_txn().unwrap();
    let mut tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);

    tr.v_from_id(&txn, data.chat_id.as_str());
    match tr.current_step {
        TraversalValue::NodeArray(ref nodes) => {
            if nodes.len() == 1 {
                let mut message_tr = TraversalBuilder::new(Arc::clone(&db), TraversalValue::Empty);
                message_tr
                    .v_from_id(&txn, data.chat_id.as_str())
                    .out(&txn, "chat_message")
                    .drop(&mut txn);
                tr.drop(&mut txn);
            } else {
                return Err(GraphError::MultipleNodesWithSameId);
            }
        }
        _ => {
            return Err(GraphError::InvalidNode);
        }
    }

    tr.result(txn)?;
    response.body = sonic_rs::to_vec(&"Success").unwrap();
    Ok(())
}
```