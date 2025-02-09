import axios from 'axios';
import * as cheerio from 'cheerio';
import { RustDoc } from '../models/types';
import { config } from '../config/config';

export class RustDocScraper {
    private async fetchPage(url: string): Promise<string> {
        const response = await axios.get(url);
        return response.data;
    }

    private parseStdLibDoc($: cheerio.CheerioAPI, url: string): RustDoc[] {
        const docs: RustDoc[] = [];
        
        // Parse module documentation
        $('.module-item').each((_, elem) => {
            const title = $(elem).find('.module-item-title').text().trim();
            const content = $(elem).find('.docblock').text().trim();
            
            if (title && content) {
                docs.push({
                    title,
                    content,
                    url: `${url}#${title.toLowerCase()}`,
                    type: 'std',
                    metadata: {
                        module: url.split('/').pop() || '',
                        category: 'module'
                    }
                });
            }
        });

        return docs;
    }

    private parseCrateDoc($: cheerio.CheerioAPI, url: string): RustDoc[] {
        const docs: RustDoc[] = [];
        
        // Parse crate documentation
        $('.docblock').each((_, elem) => {
            const section = $(elem).closest('section');
            const title = section.find('h1,h2,h3').first().text().trim();
            const content = $(elem).text().trim();
            
            if (title && content) {
                docs.push({
                    title,
                    content,
                    url: url,
                    type: 'crate',
                    metadata: {
                        category: 'crate-doc'
                    }
                });
            }
        });

        return docs;
    }

    async scrapeStdLib(): Promise<RustDoc[]> {
        const html = await this.fetchPage(config.rust.standardLibUrl);
        const $ = cheerio.load(html);
        return this.parseStdLibDoc($, config.rust.standardLibUrl);
    }

    async scrapeCrate(crateName: string): Promise<RustDoc[]> {
        const url = `${config.rust.cratesUrl}/crates/${crateName}`;
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        return this.parseCrateDoc($, url);
    }

    async scrapeRustBook(): Promise<RustDoc[]> {
        const docs: RustDoc[] = [];
        const html = await this.fetchPage(`${config.rust.docsUrl}/book/`);
        const $ = cheerio.load(html);

        $('.chapter-item').each((_, elem) => {
            const title = $(elem).find('a').text().trim();
            const url = $(elem).find('a').attr('href');
            
            if (title && url) {
                docs.push({
                    title,
                    content: '', // Content will be fetched separately
                    url: `${config.rust.docsUrl}/book/${url}`,
                    type: 'guide',
                    metadata: {
                        category: 'book'
                    }
                });
            }
        });

        return docs;
    }
} 