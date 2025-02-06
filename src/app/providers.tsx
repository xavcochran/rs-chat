'use client';

import { ThemeProvider } from 'next-themes';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useEffect } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
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
        // First check if we have a valid session
        const session = await fetchAuthSession();
        if (!session.tokens) {
          console.log('No valid auth session');
          return;
        }

        // Get the current user details
        const currentUser = await getCurrentUser();
        const userEmail = currentUser.signInDetails?.loginId;
        
        if (!userEmail) {
          console.error('User authenticated but email not found');
          return;
        }

        // Set user info in Redux
        store.dispatch(setUser({
          userId: currentUser.userId,
          email: userEmail
        }));

        // Ensure user exists in backend
        try {
          await apiService.createUser(
            currentUser.userId,
            userEmail
          );
          console.log('User verified in backend');
        } catch (err) {
          // Log error but don't fail - user might already exist
          console.log('Note: User might already exist in backend:', err);
        }

      } catch (err) {
        // User is not authenticated
        console.log('No authenticated user:', err);
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