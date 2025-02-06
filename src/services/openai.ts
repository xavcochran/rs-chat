import { openaiConfig } from '@/config/openai-config';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
  dangerouslyAllowBrowser: true, // Note: In production, you should proxy these requests through your backend
});

export async function generateResponse(
  messages: { role: string; content: string }[],
  onToken?: (token: string) => void
) {
  try {
    const response = await openai.chat.completions.create({
      model: openaiConfig.model,
      messages: [
        {
          role: 'system',
          content: openaiConfig.systemPrompt,
        },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }))
      ],
      stream: true
    });

    let fullContent = '';
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      onToken?.(content);
    }

    return {
      content: fullContent,
      usage: null, // Usage is not available in streaming mode
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate response');
  }
}

export async function generateChatTitle(messages: { role: string; content: string }[]) {
  try {
    const response = await openai.chat.completions.create({
      model: openaiConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates concise, descriptive titles for conversations. Create a short title (max 50 characters) that captures the main topic or question being discussed.',
        },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        {
          role: 'user',
          content: 'Based on the conversation above, generate a concise title that captures the main topic.',
        }
      ],
    });

    return response.choices[0].message.content?.replace(/["']/g, '').trim() || 'New Chat';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'New Chat';
  }
} 