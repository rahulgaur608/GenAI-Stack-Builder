import { useState, useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    MiniMap,
    Background,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import { ComponentPanel, ConfigPanel } from './panels';
import { ChatInterface } from './chat';
import { useWorkflow } from '../hooks/useWorkflow';
import { executeApi } from '../api';
import {
    Zap,
    Save,
    ArrowLeft,
    Play,
    MessageSquare,
    Check,
    AlertCircle,
} from 'lucide-react';

function WorkflowBuilder({ stack, onBack, onSave }) {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [stackName, setStackName] = useState(stack?.name || 'Untitled Stack');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isBuilt, setIsBuilt] = useState(false);
    const [buildError, setBuildError] = useState(null);
    const [toast, setToast] = useState(null);

    const {
        nodes,
        edges,
        selectedNode,
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
        setSelectedNode,
    } = useWorkflow();

    // Load existing workflow if editing
    useEffect(() => {
        if (stack?.nodes && stack.nodes.length > 0) {
            loadWorkflow(stack.nodes, stack.edges);
        }
    }, [stack?.id]);

    // Handle drag over for dropping nodes
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // Handle drop for adding new nodes
    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type || !reactFlowInstance) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            addNode(type, position);
        },
        [reactFlowInstance, addNode]
    );

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Handle save
    const handleSave = () => {
        const config = getWorkflowConfig();
        onSave({
            ...stack,
            name: stackName,
            nodes: config.nodes,
            edges: config.edges,
        });
        showToast('Stack saved successfully!');
    };

    // Handle build
    const handleBuild = () => {
        const result = validateWorkflow();

        if (result.valid) {
            setIsBuilt(true);
            setBuildError(null);
            showToast('Stack built successfully! Ready to chat.');
        } else {
            setIsBuilt(false);
            setBuildError(result.error);
            showToast(result.error, 'error');
        }
    };

    // Handle chat message
    const handleChatMessage = async (message, onChunk) => {
        const config = getWorkflowConfig();

        try {
            // Try to call the backend API
            const response = await executeApi.chat({
                stack_id: stack?.id || 'temp',
                query: message,
                nodes: config.nodes,
                edges: config.edges,
            }, onChunk);

            return {
                content: response.content,
            };
        } catch (error) {
            console.error('Backend execution failed:', error.message);

            // Inform user about backend status
            showToast('Backend execution failed. Using simulation mode.', 'error');

            // Get LLM node configuration
            const llmNode = config.nodes.find((n) => n.type === 'llmEngine');
            const kbNode = config.nodes.find((n) => n.type === 'knowledgeBase');

            return {
                content: `**⚠️ Backend Connection Error**\n\nI couldn't reach the backend server to process your request. Please ensure the FastAPI server is running at \`http://localhost:8000\`.\n\n` +
                    `**Simulated response based on your config:**\n` +
                    `• Model: ${llmNode?.data.model || 'gpt-4o-mini'}\n` +
                    `• Temperature: ${llmNode?.data.temperature || 0.7}\n` +
                    `• Knowledge Base: ${kbNode ? 'Configured' : 'Not configured'}\n` +
                    `• Web Search: ${llmNode?.data.enableWebSearch ? 'Enabled' : 'Disabled'}\n\n` +
                    `_To get real AI responses, please check your backend logs and API keys._`,
            };
        }
    };

    return (
        <div className="app-container">
            {/* Top Bar */}
            <div className="topbar">
                <div className="topbar-left">
                    <button className="btn btn-ghost" onClick={onBack}>
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <div className="topbar-logo">
                        <Zap color="var(--primary-green)" size={24} />
                        <input
                            type="text"
                            value={stackName}
                            onChange={(e) => setStackName(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1.25rem',
                                fontWeight: '700',
                                width: '200px',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                </div>

                <div className="topbar-right">
                    {buildError && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--error)',
                            fontSize: '0.875rem',
                        }}>
                            <AlertCircle size={16} />
                            {buildError}
                        </div>
                    )}
                    {isBuilt && !buildError && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--success)',
                            fontSize: '0.875rem',
                        }}>
                            <Check size={16} />
                            Stack Ready
                        </div>
                    )}
                    <button className="btn btn-secondary" onClick={handleSave}>
                        <Save size={18} />
                        Save
                    </button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="main-layout">
                {/* Component Panel (Left Sidebar) */}
                <ComponentPanel onAddNode={addNode} />

                {/* Canvas */}
                <div className="canvas-container" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        onPaneClick={() => setSelectedNode(null)}
                        nodeTypes={nodeTypes}
                        fitView
                        snapToGrid
                        snapGrid={[20, 20]}
                        defaultEdgeOptions={{
                            animated: true,
                            style: { stroke: '#22C55E', strokeWidth: 2 },
                        }}
                    >
                        <Controls />
                        <MiniMap
                            nodeColor={(node) => {
                                switch (node.type) {
                                    case 'userQuery': return '#3B82F6';
                                    case 'knowledgeBase': return '#8B5CF6';
                                    case 'llmEngine': return '#22C55E';
                                    case 'output': return '#F59E0B';
                                    default: return '#6B7280';
                                }
                            }}
                        />
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                    </ReactFlow>

                    {/* Build Stack Button */}
                    <div className="build-stack-btn">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleBuild}
                            style={{
                                padding: '16px 32px',
                                fontSize: '1rem',
                                boxShadow: 'var(--shadow-xl)',
                            }}
                        >
                            <Play size={20} />
                            Build Stack
                        </button>
                    </div>

                    {/* Chat Button - shown when built */}
                    {isBuilt && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsChatOpen(true)}
                            style={{
                                position: 'fixed',
                                bottom: 'var(--space-xl)',
                                right: 'calc(var(--config-panel-width) + var(--space-xl) + 180px)',
                                padding: '16px 24px',
                                boxShadow: 'var(--shadow-xl)',
                            }}
                        >
                            <MessageSquare size={20} />
                            Chat with Stack
                        </button>
                    )}
                </div>

                {/* Config Panel (Right Sidebar) */}
                <ConfigPanel
                    selectedNode={selectedNode}
                    onUpdateNode={updateNodeData}
                    onDeleteNode={deleteNode}
                    onClose={() => setSelectedNode(null)}
                />
            </div>

            {/* Chat Interface */}
            <ChatInterface
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                stackName={stackName}
                onSendMessage={handleChatMessage}
            />

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}

export default WorkflowBuilder;
