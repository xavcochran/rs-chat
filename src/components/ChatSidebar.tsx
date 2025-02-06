'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { createChat, setCurrentChat, deleteChat } from '@/store/chatSlice';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

export default function ChatSidebar() {
  const dispatch = useDispatch();
  const { chats, currentChatId } = useSelector((state: RootState) => state.chat);
  const { theme, setTheme } = useTheme();

  const handleNewChat = () => {
    dispatch(createChat());
  };

  const handleChatSelect = (chatId: string) => {
    dispatch(setCurrentChat(chatId));
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteChat(chatId));
  };

  return (
    <div className="w-64 h-screen bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity font-mono"
        >
          <PlusIcon className="h-5 w-5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleChatSelect(chat.id)}
            className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center group ${
              currentChatId === chat.id ? 'bg-gray-200 dark:bg-gray-600' : ''
            }`}
          >
            <span className="truncate font-mono">{chat.title}</span>
            <button
              onClick={(e) => handleDeleteChat(chat.id, e)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>


    </div>
  );
} 