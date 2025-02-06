'use client';

import { ThemeProvider } from 'next-themes';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { setUser } from '@/store/userSlice';
import { apiService } from '@/services/api';
import { Amplify } from 'aws-amplify';

const region = process.env.NEXT_PUBLIC_AWS_REGION!;
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID!,
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID!,
    },
  },
  API: {
    REST: {
      chatApi: {
        endpoint: apiUrl,
        region: region,
      },
    },
  },
});

function AuthCheck() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        // User is authenticated, set their info in Redux
        store.dispatch(setUser({
          userId: currentUser.userId,
          email: currentUser.signInDetails?.loginId || ''
        }));


      } catch (err) {
        // User is not authenticated, which is fine
        console.log('No authenticated user');
      }
    };

    checkAuth();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
        <AuthCheck />
        {children}
      </ThemeProvider>
    </Provider>
  );
} 