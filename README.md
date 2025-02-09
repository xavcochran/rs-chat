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

