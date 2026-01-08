import { MessageSquare, Database, Cpu, MessageCircle } from 'lucide-react';

const components = [
    {
        type: 'userQuery',
        label: 'User Query',
        description: 'Entry point for user questions',
        icon: MessageSquare,
        iconClass: 'query',
    },
    {
        type: 'knowledgeBase',
        label: 'Knowledge Base',
        description: 'Upload & process documents',
        icon: Database,
        iconClass: 'knowledge',
    },
    {
        type: 'llmEngine',
        label: 'LLM Engine',
        description: 'AI-powered responses',
        icon: Cpu,
        iconClass: 'llm',
    },
    {
        type: 'output',
        label: 'Output',
        description: 'Display final response',
        icon: MessageCircle,
        iconClass: 'output',
    },
];

function ComponentPanel({ onAddNode }) {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>Components</h3>
            </div>
            <div className="sidebar-content">
                <div className="component-list">
                    {components.map((component) => {
                        const Icon = component.icon;
                        return (
                            <div
                                key={component.type}
                                className="component-item"
                                draggable
                                onDragStart={(e) => onDragStart(e, component.type)}
                            >
                                <div className={`component-icon ${component.iconClass}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="component-info">
                                    <h4>{component.label}</h4>
                                    <p>{component.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Instructions */}
                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-lg)',
                }}>
                    <h4 style={{ fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        How to build
                    </h4>
                    <ol style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        paddingLeft: '16px',
                        lineHeight: '1.6',
                    }}>
                        <li>Drag components to the canvas</li>
                        <li>Connect nodes by dragging from ports</li>
                        <li>Configure each component</li>
                        <li>Click "Build Stack" to validate</li>
                        <li>Chat with your workflow!</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

export default ComponentPanel;
