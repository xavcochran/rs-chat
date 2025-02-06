import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import {
  addMessage,
  incrementMessageCount,
  updateChatTitle,
  setChats,
  setCurrentChat,
  createChat,
} from "@/store/chatSlice";
import {
  PaperAirplaneIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { generateResponse, generateChatTitle } from "@/services/openai";
import { apiService } from "@/services/api";
import AuthPrompt from "./AuthPrompt";
import AuthModal from "./AuthPrompt";

// Helper function to detect code sections and format them
function parseAIResponse(content: string) {
  const segments: Array<{
    type: "text" | "code";
    content: string;
    language?: string;
  }> = [];

  // First, clean up any lines that are just hyphens
  const cleanedContent = content
    .split("\n")
    .filter((line) => !line.trim().match(/^[-]+$/))
    .join("\n");

  // Split content into sections based on code detection
  const lines = cleanedContent.split("\n");
  let currentSegment = {
    type: "text" as "text" | "code",
    content: "",
    language: "plaintext",
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || "";

    // Check if this line starts a code block
    const isCodeStart =
      line.trim().startsWith("fn ") ||
      line.trim().startsWith("use ") ||
      line.trim().startsWith("#[") ||
      line.trim().startsWith("mod ") ||
      line.trim().startsWith("pub ") ||
      (line.trim().startsWith("///") && nextLine.includes("fn ")) ||
      (line.includes("{") && line.includes("}")) ||
      line.startsWith("\t");

    if (isCodeStart && currentSegment.type !== "code") {
      // Save current text segment if it exists
      if (currentSegment.content.trim()) {
        segments.push({ ...currentSegment });
      }
      // Start new code segment
      currentSegment = {
        type: "code",
        content: line + "\n",
        language: "rust",
      };
    } else if (!isCodeStart && currentSegment.type === "code") {
      // Check if this line should end the code block
      const isCodeEnd =
        (line.trim() === "" &&
          !nextLine.trim().startsWith("///") &&
          !nextLine.trim().startsWith("//") &&
          !nextLine.trim().startsWith("fn ") &&
          !nextLine.trim().startsWith("pub ") &&
          !nextLine.includes("{") &&
          !nextLine.includes("}")) ||
        (currentSegment.language === "plaintext" &&
          (!nextLine.startsWith("\t") || !nextLine.startsWith("  ")));

      if (isCodeEnd) {
        // Save code segment
        if (currentSegment.content.trim()) {
          segments.push({ ...currentSegment });
        }
        // Start new text segment
        currentSegment = {
          type: "text",
          content: "",
          language: "plaintext",
        };
      } else {
        currentSegment.content += line + "\n";
      }
    } else {
      // Continue current segment
      currentSegment.content += line + "\n";
    }
  }

  // Add the last segment if it has content
  if (currentSegment.content.trim()) {
    segments.push({ ...currentSegment });
  }

  return segments;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-4 mb-4 group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 p-2 rounded-lg bg-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Copy code"
      >
        {copied ? (
          <CheckIcon className="h-5 w-5 text-green-400" />
        ) : (
          <ClipboardDocumentIcon className="h-5 w-5" />
        )}
      </button>
      <div className="relative">
        {language !== "plaintext" && (
          <div className="absolute top-0 left-0 px-3 py-1 text-xs text-gray-400 bg-gray-2000 rounded-tl-lg">
            {language}
          </div>
        )}
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            fontSize: "13px",
            margin: 0,
            borderRadius: "0.5rem",
            padding: "1rem",
            paddingTop: "2rem",
            fontFamily: "var(--font-mono)",
          }}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const segments = parseAIResponse(content);

  const formatTextWithBullets = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Get the indentation level from the start of the line
      const indentMatch = line.match(/^(\s*)/);
      const indentLevel = indentMatch ? indentMatch[1].length : 0;
      
      // Check if line starts with a bullet point or number
      if (line.match(/^\s*[-*•]\s+/)) {
        // It's a bullet point
        return (
          <div key={index} className="flex" style={{ paddingLeft: `${indentLevel}px` }}>
            <span className="inline-block w-4 flex-shrink-0">{line.match(/[-*•]/)?.[0]}</span>
            <span className="flex-1">{line.replace(/^\s*[-*•]\s+/, '')}</span>
          </div>
        );
      } else if (line.match(/^\s*\d+\.\s+/)) {
        // It's a numbered list
        const [, number] = line.match(/^(\s*\d+)\.\s+/) || [];
        return (
          <div key={index} className="flex" style={{ paddingLeft: `${indentLevel}px` }}>
            <span className="inline-block w-6 flex-shrink-0">{number?.trim()}.</span>
            <span className="flex-1">{line.replace(/^\s*\d+\.\s+/, '')}</span>
          </div>
        );
      }
      // Regular line - preserve its indentation
      return (
        <div key={index} style={{ paddingLeft: `${indentLevel}px` }}>
          {line.trimLeft()}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {segments.map((segment, index) => {
        if (segment.type === "code") {
          return (
            <CodeBlock
              key={index}
              language={segment.language || "plaintext"}
              code={segment.content}
            />
          );
        }
        return (
          <div key={index} className="leading-relaxed space-y-1">
            {formatTextWithBullets(segment.content)}
          </div>
        );
      })}
    </div>
  );
}

function UserAvatar({ email }: { email?: string }) {
  const [showAuth, setShowAuth] = useState(false);

  if (!email) {
    return (
      <>
        <button
          onClick={() => setShowAuth(true)}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity text-sm"
        >
          Login
        </button>

        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </>
    );
  }

  const initial = email[0].toUpperCase();
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
  ];
  // Use the email string to deterministically pick a color
  const colorIndex =
    email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity`}
      title={email}
    >
      {initial}
    </div>
  );
}

export default function ChatInterface() {
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  // Load user's chats on authentication
  useEffect(() => {
    const loadChats = async () => {
      if (isAuthenticated && userId) {
        try {
          const chatsAndMessages = await apiService.getChatsAndMessages(userId);
          dispatch(setChats(chatsAndMessages));
        } catch (error) {
          console.error('Error loading chats:', error);
        }
      }
    };
    loadChats();
  }, [isAuthenticated, userId, dispatch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentChatId || !userId) return;

    const chatTitle = currentChat?.title || 'New Chat';
    const now = new Date().toISOString();

    // Create a new chat in the backend if this is the first message
    if (!currentChat) {
      try {
        const chatId = await apiService.createChat(userId, chatTitle);
        dispatch(createChat({chatId: chatId}));
      } catch (error) {
        console.error('Error creating chat:', error);
        return;
      }
    }

    // Create the new message
    const newMessage = {
      content: input,
      role: "user" as const,
      created_at: now,
    };

    // Add message to the chat
    dispatch(
      addMessage({
        chatId: currentChatId,
        message: newMessage,
      })
    );

    // Add message to backend
    try {
      await apiService.addMessage(
        userId,
        currentChatId,
        chatTitle,
        'user',
        input
      );
    } catch (error) {
      console.error('Error adding message to backend:', error);
    }

    dispatch(incrementMessageCount({ isAuthenticated }));

    setInput("");
    setIsTyping(true);

    try {
      // Include all messages including the one just sent
      const allMessages = [...(currentChat?.messages || []), newMessage];

      // Initialize streaming message
      const streamStartTime = new Date().toISOString();
      setStreamingMessage({
        content: '',
        role: 'assistant',
        created_at: streamStartTime,
      });

      const response = await generateResponse(allMessages, (token) => {
        setStreamingMessage(current => 
          current ? { ...current, content: current.content + token } : null
        );
      });

      // Add the complete AI response
      const aiMessage = {
        content: response?.content || "",
        role: "assistant" as const,
        created_at: streamStartTime,
      };

      setStreamingMessage(null);

      dispatch(
        addMessage({
          chatId: currentChatId,
          message: aiMessage,
        })
      );

      // Add AI message to backend
      try {
        await apiService.addMessage(
          userId,
          currentChatId,
          chatTitle,
          'assistant',
          aiMessage.content
        );
      } catch (error) {
        console.error('Error adding AI message to backend:', error);
      }

      // Generate a new title after the second message in the chat
      if (allMessages.length === 1) {
        const newTitle = await generateChatTitle([...allMessages, aiMessage]);
        
        // Update chat title in Redux
        dispatch(
          updateChatTitle({
            chatId: currentChatId,
            title: newTitle,
          })
        );

        // Update chat title in backend with separate API call
        try {
          await apiService.updateChatName(currentChatId, newTitle);
        } catch (error) {
          console.error('Error updating chat title in backend:', error);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        role: "assistant" as const,
        created_at: new Date().toISOString(),
      };

      setStreamingMessage(null);

      dispatch(
        addMessage({
          chatId: currentChatId,
          message: errorMessage,
        })
      );

      // Add error message to backend
      try {
        await apiService.addMessage(
          userId,
          currentChatId,
          chatTitle,
          'assistant',
          errorMessage.content
        );
      } catch (error) {
        console.error('Error adding error message to backend:', error);
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Sort messages by created_at timestamp
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Combine regular messages with streaming message
  const allMessages = streamingMessage 
    ? [...sortedMessages, streamingMessage]
    : sortedMessages;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10" /> {/* Spacer to center the title */}
        <h1 className="text-xl font-medium truncate max-w-lg">
          {currentChat?.title || "New Chat"}
        </h1>
        <UserAvatar
          email={useSelector((state: RootState) => state.user.email)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-3xl p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-black text-white dark:bg-white dark:text-black mr-10"
                  : "bg-gray-100 dark:bg-gray-800 ml-10"
              }`}
            >
              <MessageContent content={message.content} />
            </div>
          </div>
        ))}
        {isTyping && !streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
