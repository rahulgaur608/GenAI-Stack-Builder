"""
Web search service using SerpAPI.
"""
import requests
from typing import List, Optional


class WebSearchService:
    """Handles web search using SerpAPI."""

    SERP_API_URL = "https://serpapi.com/search"

    def __init__(self):
        pass

    async def search(
        self,
        query: str,
        api_key: str,
        num_results: int = 5
    ) -> List[dict]:
        """
        Perform a web search using SerpAPI.
        
        Args:
            query: Search query
            api_key: SerpAPI key
            num_results: Number of results to return
            
        Returns:
            List of search results
        """
        if not api_key:
            raise ValueError("SerpAPI key is required for web search")

        params = {
            "q": query,
            "api_key": api_key,
            "engine": "google",
            "num": num_results
        }

        try:
            response = requests.get(self.SERP_API_URL, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("organic_results", [])[:num_results]:
                results.append({
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", "")
                })

            return results
        except requests.RequestException as e:
            print(f"Web search error: {e}")
            return []

    def format_search_results(self, results: List[dict]) -> str:
        """
        Format search results as context string.
        
        Args:
            results: List of search results
            
        Returns:
            Formatted string of search results
        """
        if not results:
            return "No web search results found."

        formatted = ["Web Search Results:\n"]
        for i, result in enumerate(results, 1):
            formatted.append(f"{i}. {result['title']}")
            formatted.append(f"   URL: {result['link']}")
            formatted.append(f"   {result['snippet']}\n")

        return "\n".join(formatted)


# Singleton instance
web_search_service = WebSearchService()
