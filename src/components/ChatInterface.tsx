import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import AuthModal from './AuthModal';
import UserAvatar from './UserAvatar';

export default function ChatInterface() {
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<{
    content: string;
    role: 'assistant';
    created_at: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chats, currentChatId } = useSelector(
    (state: RootState) => state.chat
  );
  const { isAuthenticated, userId } = useSelector((state: RootState) => state.user);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!input.trim() || !userId) return;

    const chatTitle = currentChat?.title || 'New Chat';
    const now = new Date().toISOString();

    // ... rest of the existing handleSubmit code ...
  };

  return (
    <div className="flex flex-col h-full">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10" /> {/* Spacer to center the title */}
        <h1 className="text-xl font-medium truncate max-w-lg">
          {currentChat?.title || "New Chat"}
        </h1>
        <UserAvatar
          email={useSelector((state: RootState) => state.user.email)}
        />
      </div>
      
      {/* ... rest of the existing JSX ... */}
      
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              if (!isAuthenticated) {
                setShowAuthModal(true);
                return;
              }
              setInput(e.target.value);
            }}
            placeholder="Ask about Rust programming..."
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 