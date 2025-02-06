'use client';

import { ThemeProvider } from 'next-themes';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';
import { Amplify } from 'aws-amplify';

const region = process.env.NEXT_PUBLIC_AWS_REGION!;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID!,
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID!,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
        {children}
      </ThemeProvider>
    </ReduxProvider>
  );
} 