import fetch from 'node-fetch';
// @ts-ignore - Handle both CommonJS and ESM versions of node-fetch
const fetchFunc = fetch.default || fetch;

export interface DuckDuckGoSearchResult {
  url: string;
  title: string;
}

/**
 * Performs a search on DuckDuckGo and returns only the URLs of the results
 * @param query The search query string
 * @param limit Maximum number of results to return (default: 10)
 * @returns Array of result URLs
 */
export async function searchDuckDuckGo(query: string, limit: number = 10): Promise<string[]> {
  try {
    // Encode the query for URL
    const encodedQuery = encodeURIComponent(query);
    
    // DuckDuckGo search URL format
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
    
    // Perform the request
    const response = await fetchFunc(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed with status: ${response.status}`);
    }
    
    // Get the HTML content
    const html = await response.text();
    
    // Extract URLs using regex
    // Look for anchor tags with class "result__a" and extract their href attributes
    const urlRegex = /class="result__a"[^>]*href="([^"]+)"/g;
    const urls: string[] = [];
    let match;
    
    while ((match = urlRegex.exec(html)) !== null && urls.length < limit) {
      const extractedUrl = match[1];
      
      // DuckDuckGo adds redirects to the URLs in the HTML
      // We need to extract the actual destination URL from their redirect URL
      if (extractedUrl.includes('/uddg=')) {
        const actualUrl = new URL(extractedUrl, 'https://duckduckgo.com').searchParams.get('uddg');
        if (actualUrl) {
          urls.push(actualUrl);
        }
      } else {
        urls.push(extractedUrl);
      }
    }
    
    return urls;
  } catch (error) {
    console.error('Error searching DuckDuckGo:', error);
    throw new Error(`DuckDuckGo search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}