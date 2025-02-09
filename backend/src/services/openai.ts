import OpenAI from 'openai';
import { config } from '../config/config';

const openai = new OpenAI({
    apiKey: config.openai.apiKey
});

export async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        input: text,
        model: config.openai.embeddingModel
    });

    return response.data[0].embedding;
}

export async function generateChatCompletion(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    context: string
) {
    const contextualizedMessages = [
        {
            role: 'system' as const,
            content: `You are a Rust programming expert. Use the following context to answer questions: ${context}`
        },
        ...messages
    ];

    const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: contextualizedMessages,
        temperature: 0.7,
        max_tokens: 1000
    });

    return response.choices[0].message.content;
} 