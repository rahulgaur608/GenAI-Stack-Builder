"""
# Force reload
Workflow executor service that orchestrates the AI pipeline.
"""
from typing import Dict, List, Any, Optional
from .embedding_service import embedding_service
from .llm_service import llm_service
from .web_search_service import web_search_service


class WorkflowExecutor:
    """
    Executes workflows defined by the user's node/edge configuration.
    
    Flow: User Query -> (Optional) Knowledge Base -> LLM Engine -> Output
    """

    def __init__(self):
        self.embedding_service = embedding_service
        self.llm_service = llm_service
        self.web_search_service = web_search_service

    def validate_workflow(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Validate the workflow configuration.
        
        Args:
            nodes: List of node configurations
            edges: List of edge connections
            
        Returns:
            Validation result with status and any errors
        """
        errors = []

        # Check required nodes
        node_types = {node['type'] for node in nodes}
        
        if 'userQuery' not in node_types:
            errors.append("Workflow must include a User Query component")
        if 'llmEngine' not in node_types:
            errors.append("Workflow must include an LLM Engine component")
        if 'output' not in node_types:
            errors.append("Workflow must include an Output component")

        # Build adjacency map
        node_map = {node['id']: node for node in nodes}
        outgoing = {node['id']: [] for node in nodes}
        incoming = {node['id']: [] for node in nodes}
        
        for edge in edges:
            if edge['source'] in outgoing:
                outgoing[edge['source']].append(edge['target'])
            if edge['target'] in incoming:
                incoming[edge['target']].append(edge['source'])

        # Check LLM has input connection
        llm_nodes = [n for n in nodes if n['type'] == 'llmEngine']
        for llm_node in llm_nodes:
            if not incoming.get(llm_node['id']):
                errors.append("LLM Engine must have an input connection")

        # Check LLM connects to Output
        output_nodes = [n for n in nodes if n['type'] == 'output']
        for llm_node in llm_nodes:
            has_output_connection = any(
                node_map.get(target, {}).get('type') == 'output'
                for target in outgoing.get(llm_node['id'], [])
            )
            if not has_output_connection:
                errors.append("LLM Engine must be connected to Output")

        if errors:
            return {
                "valid": False,
                "message": "Workflow validation failed",
                "errors": errors
            }

        return {
            "valid": True,
            "message": "Workflow is valid and ready for execution",
            "errors": []
        }

    async def execute(
        self,
        query: str,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        collection_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute the workflow pipeline.
        
        Args:
            query: User's question
            nodes: List of node configurations
            edges: List of edge connections
            collection_name: Optional ChromaDB collection for knowledge base
            
        Returns:
            Execution result with response and metadata
        """
        # Build execution order
        node_map = {node['id']: node for node in nodes}
        
        # Find node configurations
        kb_node = next((n for n in nodes if n['type'] == 'knowledgeBase'), None)
        llm_node = next((n for n in nodes if n['type'] == 'llmEngine'), None)

        context = None
        web_results = None

        # Step 1: Knowledge Base Retrieval (if present)
        if kb_node and collection_name:
            kb_data = kb_node.get('data', {})
            api_key = kb_data.get('apiKey', '')
            embedding_model = kb_data.get('embeddingModel', 'local')
            top_k = kb_data.get('topK', 5)

            try:
                # Generate query embedding
                if api_key and embedding_model != 'local':
                    query_embedding = self.embedding_service.generate_embeddings_openai(
                        [query], api_key, embedding_model
                    )[0]
                else:
                    # Use local embeddings (free, no API key required)
                    query_embedding = self.embedding_service.generate_embeddings_local(
                        [query]
                    )[0]

                # Retrieve similar documents
                similar_docs = self.embedding_service.query_similar(
                    collection_name, query_embedding, top_k
                )

                if similar_docs:
                    context = "\n\n".join([doc['content'] for doc in similar_docs])
            except Exception as e:
                print(f"Knowledge base retrieval error: {e}")

        # Step 2: Web Search (if enabled)
        if llm_node:
            llm_data = llm_node.get('data', {})
            if llm_data.get('enableWebSearch') and llm_data.get('serpApiKey'):
                try:
                    search_results = await self.web_search_service.search(
                        query, llm_data['serpApiKey']
                    )
                    web_results = self.web_search_service.format_search_results(search_results)
                except Exception as e:
                    print(f"Web search error: {e}")

        # Combine context
        full_context = ""
        if context:
            full_context += f"Knowledge Base Results:\n{context}\n\n"
        if web_results:
            full_context += f"{web_results}\n\n"

        # Step 3: LLM Generation
        if llm_node:
            llm_data = llm_node.get('data', {})
            model = llm_data.get('model', 'anthropic/claude-3.5-sonnet')
            temperature = llm_data.get('temperature', 0.7)
            max_tokens = min(llm_data.get('maxTokens') or 512, 512)  # Cap at 512 to avoid credits issue
            prompt_template = llm_data.get('prompt', '')

            # Determine which API key to use
            api_key = llm_data.get('apiKey', '')
            google_api_key = llm_data.get('googleApiKey', '')
            anthropic_api_key = llm_data.get('anthropicApiKey', '') or api_key  # Fallback to general apiKey
            anthropic_base_url = llm_data.get('anthropicBaseUrl', '')

            # If no LLM API key, try knowledge base key for OpenAI models
            if not api_key and kb_node:
                api_key = kb_node.get('data', {}).get('apiKey', '')

            try:
                response = await self.llm_service.generate_response(
                    query=query,
                    context=full_context if full_context else None,
                    prompt_template=prompt_template,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    api_key=api_key,
                    google_api_key=google_api_key,
                    anthropic_api_key=anthropic_api_key,
                    anthropic_base_url=anthropic_base_url
                )

                return {
                    "success": True,
                    "content": response,
                    "metadata": {
                        "model": model,
                        "hasContext": bool(context),
                        "hasWebSearch": bool(web_results)
                    }
                }
            except Exception as e:
                return {
                    "success": False,
                    "content": f"Error generating response: {str(e)}",
                    "metadata": {}
                }

                return {
                    "success": False,
                    "content": "No LLM Engine configured in workflow",
                    "metadata": {}
                }

    async def execute_stream(
        self,
        query: str,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        collection_name: Optional[str] = None
    ):
        """
        Execute the workflow pipeline and stream the response.
        Yields JSON chunks with 'chunk', 'metadata', or 'error' keys.
        """
        # Build execution order
        node_map = {node['id']: node for node in nodes}
        
        # Find node configurations
        kb_node = next((n for n in nodes if n['type'] == 'knowledgeBase'), None)
        llm_node = next((n for n in nodes if n['type'] == 'llmEngine'), None)

        context = None
        web_results = None

        # Step 1: Knowledge Base Retrieval (if present)
        if kb_node and collection_name:
            kb_data = kb_node.get('data', {})
            api_key = kb_data.get('apiKey', '')
            embedding_model = kb_data.get('embeddingModel', 'local')
            top_k = kb_data.get('topK', 5)

            try:
                # Generate query embedding
                if api_key and embedding_model != 'local':
                    query_embedding = self.embedding_service.generate_embeddings_openai(
                        [query], api_key, embedding_model
                    )[0]
                else:
                    # Use local embeddings (free, no API key required)
                    query_embedding = self.embedding_service.generate_embeddings_local(
                        [query]
                    )[0]

                # Retrieve similar documents
                similar_docs = self.embedding_service.query_similar(
                    collection_name, query_embedding, top_k
                )

                if similar_docs:
                    context = "\n\n".join([doc['content'] for doc in similar_docs])
            except Exception as e:
                print(f"Knowledge base retrieval error: {e}")

        # Step 2: Web Search (if enabled)
        if llm_node:
            llm_data = llm_node.get('data', {})
            if llm_data.get('enableWebSearch') and llm_data.get('serpApiKey'):
                try:
                    search_results = await self.web_search_service.search(
                        query, llm_data['serpApiKey']
                    )
                    web_results = self.web_search_service.format_search_results(search_results)
                except Exception as e:
                    print(f"Web search error: {e}")

        # Combine context
        full_context = ""
        if context:
            full_context += f"Knowledge Base Results:\n{context}\n\n"
        if web_results:
            full_context += f"{web_results}\n\n"

        # Step 3: LLM Generation
        if llm_node:
            llm_data = llm_node.get('data', {})
            model = llm_data.get('model', 'anthropic/claude-3.5-sonnet')
            temperature = llm_data.get('temperature', 0.7)
            max_tokens = min(llm_data.get('maxTokens') or 512, 512)  # Cap at 512 to avoid credits issue
            prompt_template = llm_data.get('prompt', '')

            # Determine which API key to use
            api_key = llm_data.get('apiKey', '')
            # google_api_key = llm_data.get('googleApiKey', '') # Unused in OpenRouter setup
            anthropic_api_key = llm_data.get('anthropicApiKey', '') or api_key
            anthropic_base_url = llm_data.get('anthropicBaseUrl', '')

            # If no LLM API key, try knowledge base key for OpenAI models
            if not api_key and kb_node:
                api_key = kb_node.get('data', {}).get('apiKey', '')

            try:
                # Send metadata first
                yield {
                    "metadata": {
                        "model": model,
                        "hasContext": bool(context),
                        "hasWebSearch": bool(web_results)
                    }
                }

                # Stream content
                async for chunk in self.llm_service.generate_stream(
                    query=query,
                    context=full_context if full_context else None,
                    prompt_template=prompt_template,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    api_key=api_key,
                    anthropic_api_key=anthropic_api_key,
                    anthropic_base_url=anthropic_base_url
                ):
                    yield {"chunk": chunk}
                
                return

            except Exception as e:
                yield {"error": f"Error generating stream: {str(e)}"}
                return

        yield {"error": "No LLM Engine configured in workflow"}


# Singleton instance
workflow_executor = WorkflowExecutor()
