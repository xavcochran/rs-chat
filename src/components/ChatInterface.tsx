import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import {
  addMessage,
  incrementMessageCount,
  updateChatTitle,
} from "@/store/chatSlice";
import {
  PaperAirplaneIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { generateResponse, generateChatTitle } from "@/services/openai";
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
    <div className="relative mt-2 group">
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
          <div className="absolute top-0 left-0 px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded-bl-lg rounded-tr-lg">
            {language}
          </div>
        )}
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: "0.5rem",
            padding: "1rem",
            paddingTop: "2rem",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
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

  return (
    <div className="space-y-4 font-mono">
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
          <div key={index} className="whitespace-pre-wrap">
            {segment.content}
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
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity font-mono text-sm"
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chats, currentChatId } = useSelector(
    (state: RootState) => state.chat
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentChatId) return;

    // Create the new message
    const newMessage = {
      content: input,
      role: "user" as const,
    };

    // Add message to the chat
    dispatch(
      addMessage({
        chatId: currentChatId,
        message: newMessage,
      })
    );

    dispatch(incrementMessageCount({ isAuthenticated }));

    setInput("");
    setIsTyping(true);

    try {
      // Include all messages including the one just sent
      const allMessages = [...(currentChat?.messages || []), newMessage];

      const response = await generateResponse(allMessages);

      // Add AI response
      const aiMessage = {
        content: response?.content || "",
        role: "assistant" as const,
      };

      dispatch(
        addMessage({
          chatId: currentChatId,
          message: aiMessage,
        })
      );

      // Generate a new title after the second message in the chat
      if (allMessages.length === 1) {
        // Changed from 2 to 1 since we want to do it after first exchange
        const newTitle = await generateChatTitle([...allMessages, aiMessage]);
        dispatch(
          updateChatTitle({
            chatId: currentChatId,
            title: newTitle,
          })
        );
      }
    } catch (error) {
      console.error("Error:", error);
      dispatch(
        addMessage({
          chatId: currentChatId,
          message: {
            content:
              "Sorry, I encountered an error while processing your request. Please try again.",
            role: "assistant",
          },
        })
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10" /> {/* Spacer to center the title */}
        <h1 className="text-xl font-mono font-semibold truncate max-w-lg">
          {currentChat?.title || "New Chat"}
        </h1>
        <UserAvatar
          email={useSelector((state: RootState) => state.user.email)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-3xl p-4 rounded-lg font-mono ${
                message.role === "user"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <MessageContent content={message.content} />
            </div>
          </div>
        ))}
        {isTyping && (
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
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
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
