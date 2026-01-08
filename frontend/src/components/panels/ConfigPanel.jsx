import { Settings, Trash2, X } from 'lucide-react';

function ConfigPanel({ selectedNode, onUpdateNode, onDeleteNode, onClose }) {
    if (!selectedNode) {
        return (
            <div className="config-panel">
                <div className="config-panel-header">
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600' }}>Properties</h3>
                </div>
                <div className="config-empty">
                    <Settings size={48} />
                    <p style={{ marginTop: '8px' }}>Select a node to configure</p>
                </div>
            </div>
        );
    }

    const { data, type } = selectedNode;

    const handleChange = (field, value) => {
        onUpdateNode(selectedNode.id, { [field]: value });
    };

    return (
        <div className="config-panel">
            <div className="config-panel-header">
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {data.label} Properties
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => onDeleteNode(selectedNode.id)}
                        title="Delete node"
                    >
                        <Trash2 size={18} color="var(--error)" />
                    </button>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={onClose}
                        title="Close panel"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="config-panel-content">
                {/* User Query Node */}
                {type === 'userQuery' && (
                    <>
                        <div className="form-group">
                            <label>Node Label</label>
                            <input
                                type="text"
                                value={data.label || ''}
                                onChange={(e) => handleChange('label', e.target.value)}
                            />
                        </div>
                        <p className="form-help">
                            This component serves as the entry point for user queries in your workflow.
                        </p>
                    </>
                )}

                {/* Knowledge Base Node */}
                {type === 'knowledgeBase' && (
                    <>
                        <div className="form-group">
                            <label>Node Label</label>
                            <input
                                type="text"
                                value={data.label || ''}
                                onChange={(e) => handleChange('label', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Embedding Model</label>
                            <select
                                value={data.embeddingModel || 'local'}
                                onChange={(e) => handleChange('embeddingModel', e.target.value)}
                            >
                                <option value="local">Local (Free - No API Key)</option>
                                <option value="text-embedding-3-large">text-embedding-3-large (OpenAI)</option>
                                <option value="text-embedding-3-small">text-embedding-3-small (OpenAI)</option>
                                <option value="text-embedding-ada-002">text-embedding-ada-002 (OpenAI)</option>
                            </select>
                            <p className="form-help">
                                Local embeddings are free and require no API key
                            </p>
                        </div>


                        <div className="form-group">
                            <label>Chunk Size</label>
                            <input
                                type="number"
                                value={data.chunkSize || 1000}
                                onChange={(e) => handleChange('chunkSize', parseInt(e.target.value))}
                            />
                            <p className="form-help">
                                Number of characters per text chunk
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Top K Results</label>
                            <input
                                type="number"
                                value={data.topK || 5}
                                onChange={(e) => handleChange('topK', parseInt(e.target.value))}
                            />
                            <p className="form-help">
                                Number of relevant chunks to retrieve
                            </p>
                        </div>
                    </>
                )}

                {/* LLM Engine Node */}
                {type === 'llmEngine' && (
                    <>
                        <div className="form-group">
                            <label>Node Label</label>
                            <input
                                type="text"
                                value={data.label || ''}
                                onChange={(e) => handleChange('label', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Model</label>
                            <select
                                value={data.model || 'anthropic/claude-3.5-sonnet'}
                                onChange={(e) => handleChange('model', e.target.value)}
                            >
                                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
                                <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                                <option value="google/gemini-pro-1.5">Gemini 1.5 Pro</option>
                                <option value="google/gemini-flash-1.5">Gemini 1.5 Flash</option>
                                <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B Instruct</option>
                            </select>
                        </div>

                        {/* API Keys */}
                        <div className="form-group">
                            <label>API Key</label>
                            <input
                                type="password"
                                placeholder="Provider API Key (sk-...)"
                                value={data.apiKey || ''}
                                onChange={(e) => handleChange('apiKey', e.target.value)}
                            />
                            <p className="form-help">
                                Optional: Leave blank to use server environment variables
                            </p>
                        </div>



                        <div className="form-group">
                            <label>Temperature: {data.temperature || 0.7}</label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={data.temperature || 0.7}
                                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                                style={{ accentColor: 'var(--primary-green)' }}
                            />
                            <p className="form-help">
                                Higher values = more creative, lower = more focused
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Max Tokens</label>
                            <input
                                type="number"
                                value={data.maxTokens || 1024}
                                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                            />
                        </div>

                        <div className="form-group">
                            <label>Prompt Template</label>
                            <textarea
                                value={data.prompt || ''}
                                onChange={(e) => handleChange('prompt', e.target.value)}
                                rows={6}
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                            />
                            <p className="form-help">
                                Use {'{{context}}'} and {'{{query}}'} as placeholders
                            </p>
                        </div>

                        <div className="form-group">
                            <label style={{ marginBottom: '12px', display: 'block' }}>Web Search</label>
                            <div className="toggle-container">
                                <div
                                    className={`toggle ${data.enableWebSearch ? 'active' : ''}`}
                                    onClick={() => handleChange('enableWebSearch', !data.enableWebSearch)}
                                />
                                <span style={{ fontSize: '0.875rem' }}>
                                    {data.enableWebSearch ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </div>

                        {data.enableWebSearch && (
                            <div className="form-group">
                                <label>SerpAPI Key</label>
                                <input
                                    type="password"
                                    placeholder="Enter your SerpAPI key"
                                    value={data.serpApiKey || ''}
                                    onChange={(e) => handleChange('serpApiKey', e.target.value)}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Output Node */}
                {type === 'output' && (
                    <>
                        <div className="form-group">
                            <label>Node Label</label>
                            <input
                                type="text"
                                value={data.label || ''}
                                onChange={(e) => handleChange('label', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Output Format</label>
                            <select
                                value={data.outputType || 'chat'}
                                onChange={(e) => handleChange('outputType', e.target.value)}
                            >
                                <option value="chat">Chat Interface</option>
                                <option value="text">Plain Text</option>
                                <option value="json">JSON Response</option>
                            </select>
                            <p className="form-help">
                                How the response should be displayed
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ConfigPanel;
