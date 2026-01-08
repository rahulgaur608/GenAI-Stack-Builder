import { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

// Initial nodes for a new workflow
const initialNodes = [];
const initialEdges = [];

export function useWorkflow() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isValid, setIsValid] = useState(false);

    // Add a new node to the canvas
    const addNode = useCallback((type, position) => {
        const id = uuidv4();

        const nodeData = {
            userQuery: {
                label: 'User Query',
                type: 'userQuery',
            },
            knowledgeBase: {
                label: 'Knowledge Base',
                type: 'knowledgeBase',
                embeddingModel: 'text-embedding-3-large',
                apiKey: '',
                documents: [],
            },
            llmEngine: {
                label: 'LLM Engine',
                type: 'llmEngine',
                model: 'anthropic/claude-3.5-sonnet',
                temperature: 0.7,
                prompt: 'You are a helpful assistant. Use the following context to answer the question.\n\nContext: {{context}}\n\nQuestion: {{query}}\n\nAnswer:',
                enableWebSearch: false,
                serpApiKey: '',
            },
            output: {
                label: 'Output',
                type: 'output',
            },
        };

        const newNode = {
            id,
            type,
            position,
            data: nodeData[type] || { label: type },
        };

        setNodes((nds) => [...nds, newNode]);
        return newNode;
    }, [setNodes]);

    // Handle edge connections
    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({
            ...params,
            animated: true,
            style: { stroke: '#22C55E', strokeWidth: 2 },
        }, eds));
    }, [setEdges]);

    // Update node data
    const updateNodeData = useCallback((nodeId, data) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...data } }
                    : node
            )
        );
    }, [setNodes]);

    // Delete a node
    const deleteNode = useCallback((nodeId) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        if (selectedNode?.id === nodeId) {
            setSelectedNode(null);
        }
    }, [setNodes, setEdges, selectedNode]);

    // Handle node selection
    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    // Validate workflow
    const validateWorkflow = useCallback(() => {
        // Check for required nodes
        const hasUserQuery = nodes.some((n) => n.type === 'userQuery');
        const hasOutput = nodes.some((n) => n.type === 'output');
        const hasLLM = nodes.some((n) => n.type === 'llmEngine');

        if (!hasUserQuery || !hasOutput || !hasLLM) {
            return {
                valid: false,
                error: 'Workflow must include User Query, LLM Engine, and Output components.',
            };
        }

        // Check for valid connections
        // User Query -> (KB?) -> LLM -> Output
        const userQueryNode = nodes.find((n) => n.type === 'userQuery');
        const outputNode = nodes.find((n) => n.type === 'output');
        const llmNode = nodes.find((n) => n.type === 'llmEngine');

        // Verify LLM connects to Output
        const llmToOutput = edges.some(
            (e) => e.source === llmNode.id && e.target === outputNode.id
        );

        if (!llmToOutput) {
            return {
                valid: false,
                error: 'LLM Engine must be connected to Output.',
            };
        }

        // Verify something connects to LLM
        const hasInputToLLM = edges.some((e) => e.target === llmNode.id);
        if (!hasInputToLLM) {
            return {
                valid: false,
                error: 'LLM Engine must have an input connection.',
            };
        }

        setIsValid(true);
        return { valid: true };
    }, [nodes, edges]);

    // Get workflow configuration for execution
    const getWorkflowConfig = useCallback(() => {
        return {
            nodes: nodes.map((n) => ({
                id: n.id,
                type: n.type,
                data: n.data,
                position: n.position,
            })),
            edges: edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
            })),
        };
    }, [nodes, edges]);

    // Load workflow from saved data
    const loadWorkflow = useCallback((savedNodes, savedEdges) => {
        setNodes(savedNodes || []);
        setEdges(savedEdges || []);
    }, [setNodes, setEdges]);

    // Clear workflow
    const clearWorkflow = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setIsValid(false);
    }, [setNodes, setEdges]);

    return {
        nodes,
        edges,
        selectedNode,
        isValid,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onNodeClick,
        addNode,
        updateNodeData,
        deleteNode,
        validateWorkflow,
        getWorkflowConfig,
        loadWorkflow,
        clearWorkflow,
        setSelectedNode,
    };
}

export default useWorkflow;
