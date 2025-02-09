import dotenv from 'dotenv';

dotenv.config();

export const config = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-3.5-turbo',
        embeddingModel: 'text-embedding-3-small'
    },
    database: {
        url: process.env.DATABASE_URL || 'http://localhost:8000',
        vectorDimension: 1536, // Dimension for OpenAI embeddings
    },
    rust: {
        docsUrl: 'https://doc.rust-lang.org',
        standardLibUrl: 'https://doc.rust-lang.org/std/',
        cratesUrl: 'https://crates.io'
    }
}; 