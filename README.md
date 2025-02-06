# Rust AI Chat Assistant

A modern web application for getting help with Rust programming through AI assistance. Built with Next.js, TypeScript, and AWS Cognito authentication.

## Features

- 🤖 AI-powered Rust programming assistance
- 🔐 AWS Cognito authentication
- 🌓 Dark/Light mode support
- 💻 Code syntax highlighting with Monaco Editor
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

## Usage Limits

- Anonymous users: 10 messages
- Authenticated users: 30 messages per hour

## Deployment

The application is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and it will handle the rest.

Make sure to add the environment variables in your Vercel project settings.

## Tech Stack

- Next.js 14
- TypeScript
- Redux Toolkit
- AWS Amplify
- OpenAI API
- Monaco Editor
- Tailwind CSS
- next-themes

## Development

### File Structure

```
src/
  ├── app/              # Next.js app directory
  ├── components/       # React components
  ├── config/          # Configuration files
  ├── services/        # API services
  ├── store/           # Redux store and slices
  └── types/           # TypeScript types
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
