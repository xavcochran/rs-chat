'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import ChatSidebar from '@/components/ChatSidebar';
import ChatInterface from '@/components/ChatInterface';
import AuthPrompt from '@/components/AuthPrompt';

export default function Home() {
  const { messageCount, currentChatId } = useSelector((state: RootState) => state.chat);
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  const shouldShowAuthPrompt = !isAuthenticated && messageCount.anonymous >= 10;

  return (
    <main className="flex h-screen bg-white dark:bg-gray-900">
      <ChatSidebar />
      <div className="flex-1 flex flex-col">
        {shouldShowAuthPrompt ? (
          <AuthPrompt isOpen={true} onClose={() => {}} />
        ) : (
          <ChatInterface />
        )}
      </div>
    </main>
  );
}
