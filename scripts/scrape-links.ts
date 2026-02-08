import fs from 'fs';
import path from 'path';
import TurndownService from 'turndown';

const turndownService = new TurndownService();
const DOCS_DIR = path.resolve(process.cwd(), 'documents');

async function scrapeLinks(links: string[]) {
    if (!fs.existsSync(DOCS_DIR)) {
        fs.mkdirSync(DOCS_DIR, { recursive: true });
    }

    for (const url of links) {
        try {
            console.log(`Fetching ${url}...`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);

            const html = await response.text();

            // Basic extraction: try to get the main content if possible, or just dump the whole body
            // In a real scraper we'd use JSDOM/Cheerio to extract <main> or <article>
            // For now, let's just convert the whole HTML to markdown
            const markdown = turndownService.turndown(html);

            // Create a filename from the URL
            const urlObj = new URL(url);
            const slug = urlObj.hostname + urlObj.pathname.replace(/[^a-z0-9]/gi, '-').toLowerCase();
            const filename = `${slug}.md`;
            const filepath = path.join(DOCS_DIR, filename);

            fs.writeFileSync(filepath, `Source: ${url}\n\n${markdown}`);
            console.log(`✅ Saved to documents/${filename}`);

        } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error);
        }
    }
}

// Get links from command line args
const links = process.argv.slice(2);
if (links.length === 0) {
    console.log("Usage: npx tsx scripts/scrape-links.ts <url1> <url2> ...");
} else {
    scrapeLinks(links);
}
