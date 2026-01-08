"""
LLM service for interacting with language models.
"""
from typing import Optional, AsyncGenerator
import json


class LLMService:
    """Handles interactions with LLM providers (OpenAI, Google Gemini)."""

    ANTHROPIC_MODELS = set()
    OPENAI_MODELS = {
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3.5-haiku',
        'anthropic/claude-3-opus',
        'google/gemini-pro', 
        'google/gemini-1.5-flash',
        'meta-llama/llama-3-8b-instruct',
        'claude-sonnet-4-5-thinking' # keeping for backward compatibility if needed, but will map
    }

    def __init__(self):
        self._openai_client = None
        self._gemini_configured = False
        self._anthropic_client = None

    def _get_openai_client(self, api_key: str, base_url: Optional[str] = None):
        """Get OpenAI client (supports OpenRouter)."""
        from app.config import settings
        """Get OpenAI client (supports OpenRouter)."""
        from app.config import settings
        from openai import AsyncOpenAI
        
        # Default to OpenRouter settings
        if not api_key:
             api_key = settings.openrouter_api_key
             
        if base_url is None:
             base_url = settings.openrouter_base_url
             
        return AsyncOpenAI(api_key=api_key, base_url=base_url)

    def _configure_gemini(self, api_key: str):
        """Configure Google Gemini."""
        import google.generativeai as genai
        genai.configure(api_key=api_key)

    def _get_anthropic_client(self, api_key: str, base_url: Optional[str] = None):
        """Get Anthropic client."""
        from anthropic import AsyncAnthropic
        from app.config import settings
        
        # Use provided base_url or default from settings (Antigravity proxy)
        url = base_url or settings.anthropic_base_url
        return AsyncAnthropic(api_key=api_key, base_url=url)

    async def generate_response(
        self,
        query: str,
        context: Optional[str] = None,
        prompt_template: Optional[str] = None,
        model: str = "anthropic/claude-3.5-sonnet",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        api_key: Optional[str] = None,
        google_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        anthropic_base_url: Optional[str] = None
    ) -> str:
        """
        Generate a response using the specified LLM.
        """
        from app.config import settings
        if model.startswith("gpt") or model in ["claude-3-5-sonnet-latest", "claude-sonnet-4-5-thinking"]:
             print(f"Warning: Model {model} is no longer supported. Falling back to anthropic/claude-3.5-sonnet.")
             model = "anthropic/claude-3.5-sonnet"

        # Build the prompt
        if prompt_template:
            prompt = prompt_template
            prompt = prompt.replace("{{query}}", query)
            prompt = prompt.replace("{{context}}", context or "No additional context provided.")
        else:
            if context:
                prompt = f"""Use the following context to answer the question.

Context:
{context}

Question: {query}

Answer:"""
            else:
                prompt = query

        # Default everything to OpenAI/OpenRouter handler
        return await self._generate_openai(
            prompt=prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key or settings.openrouter_api_key
        )

    async def _generate_openai(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str
    ) -> str:
        """Generate response using OpenAI/OpenRouter."""
        if not api_key:
            from app.config import settings
            api_key = settings.openrouter_api_key
            
        if not api_key:
            raise ValueError("OpenRouter API key is required")

        client = self._get_openai_client(api_key)
        
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return response.choices[0].message.content

    async def _generate_gemini(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str
    ) -> str:
        """Generate response using Google Gemini."""
        if not api_key:
            from app.config import settings
            api_key = settings.google_api_key

        if not api_key:
            raise ValueError("Google API key is required")

        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
        
        gemini_model = genai.GenerativeModel(
            model_name=model,
            generation_config=generation_config
        )
        
        response = await gemini_model.generate_content_async(prompt)
        return response.text

    async def _generate_anthropic(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str,
        base_url: Optional[str] = None
    ) -> str:
        """Generate response using Anthropic (or proxy)."""
        from app.config import settings
        api_key = api_key or settings.anthropic_api_key
        
        if not api_key:
            raise ValueError("Anthropic API key is required")

        client = self._get_anthropic_client(api_key, base_url)
        print(f"DEBUG: Anthropic request to {client.base_url} with model {model}")
        
        response = await client.messages.create(
            model=model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return response.content[0].text

    async def generate_stream(
        self,
        query: str,
        context: Optional[str] = None,
        prompt_template: Optional[str] = None,
        model: str = "claude-sonnet-4-5-thinking",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        anthropic_base_url: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream a response using the specified LLM.
        
        Yields chunks of the response as they are generated.
        """
        # Fallback for removed models
        if model.startswith("gpt") or model in ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-5-sonnet-latest", "claude-sonnet-4-5-thinking"]:
            print(f"Warning: Model {model} is no longer supported. Falling back to anthropic/claude-3.5-sonnet.")
            model = "anthropic/claude-3.5-sonnet"

        # Build the prompt
        if prompt_template:
            prompt = prompt_template
            prompt = prompt.replace("{{query}}", query)
            prompt = prompt.replace("{{context}}", context or "No additional context provided.")
        else:
            if context:
                prompt = f"""Use the following context to answer the question.

Context:
{context}

Question: {query}

Answer:"""
            else:
                prompt = query

        # Route to appropriate provider
        # Default to OpenAI/OpenRouter stream
        if not api_key:
            from app.config import settings
            api_key = settings.openrouter_api_key
            
        if not api_key:
            raise ValueError("API key is required")

        async for chunk in self._generate_openai_stream(
            prompt=prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key
        ):
            yield chunk

    async def _generate_openai_stream(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str
    ) -> AsyncGenerator[str, None]:
        """Stream response from OpenAI."""
        client = self._get_openai_client(api_key)
        
        stream = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def _generate_anthropic_stream(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response from Anthropic (or proxy)."""
        from app.config import settings
        api_key = api_key or settings.anthropic_api_key
        
        if not api_key:
            raise ValueError("Anthropic API key is required")

        client = self._get_anthropic_client(api_key, base_url)
        
        async with client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
        ) as stream:
            async for text in stream.text_stream:
                yield text


# Singleton instance
llm_service = LLMService()
