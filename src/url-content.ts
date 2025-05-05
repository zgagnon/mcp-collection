import fetch from 'node-fetch';
// @ts-ignore - Handle both CommonJS and ESM versions of node-fetch
const fetchFunc = fetch.default || fetch;
import { JSDOM } from 'jsdom';

/**
 * Fetches the content of a URL as text, stripping HTML markup
 * @param url The URL to fetch content from
 * @returns The plain text content of the URL without HTML markup
 */
export async function fetchUrlContent(url: string): Promise<string> {
  try {
    // Perform the request
    const response = await fetchFunc(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL with status: ${response.status}`);
    }
    
    // Get the HTML content
    const htmlContent = await response.text();
    
    // Parse HTML and extract text content
    const dom = new JSDOM(htmlContent);
    const textContent = dom.window.document.body.textContent || '';
    
    // Clean up the text (remove excessive whitespace)
    return textContent.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Error fetching URL content:', error);
    throw new Error(`URL fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}