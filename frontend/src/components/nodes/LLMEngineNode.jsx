import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, Globe } from 'lucide-react';

function LLMEngineNode({ data, selected }) {
    const [webSearchEnabled, setWebSearchEnabled] = useState(data.enableWebSearch || false);

    return (
        <div className={`custom-node ${selected ? 'selected' : ''}`} style={{ minWidth: '340px' }}>
            {/* Input handle - left side */}
            <Handle
                type="target"
                position={Position.Left}
                id="input"
                style={{ background: '#3B82F6' }}
            />

            <div className="node-header">
                <div className="node-icon llm">
                    <Cpu size={18} />
                </div>
                <span className="node-title">LLM Engine</span>
            </div>

            <div className="node-body">
                {/* Model Selection */}
                <div className="node-field">
                    <label>Model</label>
                    <select defaultValue={data.model || 'anthropic/claude-3.5-sonnet'}>
                        <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                        <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
                        <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                        <option value="google/gemini-pro-1.5">Gemini 1.5 Pro</option>
                        <option value="google/gemini-flash-1.5">Gemini 1.5 Flash</option>
                        <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B Instruct</option>
                    </select>
                </div>

                {/* Temperature */}
                <div className="node-field">
                    <label>Temperature: {data.temperature || 0.7}</label>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        defaultValue={data.temperature || 0.7}
                        style={{
                            width: '100%',
                            accentColor: 'var(--primary-green)',
                        }}
                    />
                </div>

                {/* System Prompt */}
                <div className="node-field">
                    <label>Prompt Template</label>
                    <textarea
                        placeholder="Enter your prompt template..."
                        defaultValue={data.prompt || 'You are a helpful assistant. Use the following context to answer the question.\n\nContext: {{context}}\n\nQuestion: {{query}}\n\nAnswer:'}
                        style={{ minHeight: '100px' }}
                    />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Use {'{{context}}'} and {'{{query}}'} as placeholders
                    </p>
                </div>

                {/* Web Search Toggle */}
                <div className="node-field">
                    <div className="toggle-container">
                        <div
                            className={`toggle ${webSearchEnabled ? 'active' : ''}`}
                            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Globe size={16} />
                            <span style={{ fontSize: '0.875rem' }}>Web Search</span>
                        </div>
                    </div>
                </div>

                {/* SerpAPI Key - shown when web search enabled */}
                {webSearchEnabled && (
                    <div className="node-field" style={{
                        animation: 'fadeIn 0.2s ease',
                        marginTop: '8px',
                    }}>
                        <label>SerpAPI Key</label>
                        <input
                            type="password"
                            placeholder="Enter SerpAPI key..."
                            defaultValue={data.serpApiKey || ''}
                        />
                    </div>
                )}
            </div>

            {/* Output handle - right side */}
            <Handle
                type="source"
                position={Position.Right}
                id="output"
                style={{ background: '#22C55E' }}
            />
        </div>
    );
}

export default memo(LLMEngineNode);
