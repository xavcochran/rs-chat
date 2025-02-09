import { RustDocScraper } from '../services/rustDocScraper';
import { HybridSearchService } from '../services/hybridSearch';
import { GraphDBOperations, VectorDBOperations } from '../models/types';

async function indexAllDocs(
    graphDB: GraphDBOperations,
    vectorDB: VectorDBOperations
) {
    const scraper = new RustDocScraper();
    const hybridSearch = new HybridSearchService(graphDB, vectorDB);

    console.log('Starting documentation indexing...');

    try {
        // Index Standard Library
        console.log('Indexing Standard Library...');
        const stdLibDocs = await scraper.scrapeStdLib();
        for (const doc of stdLibDocs) {
            await hybridSearch.indexDocument(doc);
            console.log(`Indexed: ${doc.title}`);
        }

        // Index Rust Book
        console.log('Indexing Rust Book...');
        const bookDocs = await scraper.scrapeRustBook();
        for (const doc of bookDocs) {
            await hybridSearch.indexDocument(doc);
            console.log(`Indexed: ${doc.title}`);
        }

        // Index popular crates
        const popularCrates = [
            'tokio',
            'serde',
            'rand',
            'reqwest',
            'actix-web'
        ];

        console.log('Indexing popular crates...');
        for (const crateName of popularCrates) {
            console.log(`Indexing crate: ${crateName}`);
            const crateDocs = await scraper.scrapeCrate(crateName);
            for (const doc of crateDocs) {
                await hybridSearch.indexDocument(doc);
                console.log(`Indexed: ${doc.title}`);
            }
        }

        console.log('Indexing completed successfully!');
    } catch (error) {
        console.error('Error during indexing:', error);
        throw error;
    }
}

// The actual database implementations would be passed here
// when running the script
if (require.main === module) {
    console.log('Please implement database connections and run this script with proper DB implementations');
} 