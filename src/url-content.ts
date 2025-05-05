import fetch from 'node-fetch';
// @ts-ignore - Handle both CommonJS and ESM versions of node-fetch
const fetchFunc = fetch.default || fetch;

/**
 * Fetches the content of a URL as text
 * @param url The URL to fetch content from
 * @returns The text content of the URL
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
    
    // Get the text content
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Error fetching URL content:', error);
    throw new Error(`URL fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}