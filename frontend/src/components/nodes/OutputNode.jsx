import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageCircle } from 'lucide-react';

function OutputNode({ data, selected }) {
    return (
        <div className={`custom-node ${selected ? 'selected' : ''}`}>
            {/* Input handle - left side */}
            <Handle
                type="target"
                position={Position.Left}
                id="input"
                style={{ background: '#3B82F6' }}
            />

            <div className="node-header">
                <div className="node-icon output">
                    <MessageCircle size={18} />
                </div>
                <span className="node-title">Output</span>
            </div>

            <div className="node-body">
                <div className="node-field">
                    <label>Output Type</label>
                    <select defaultValue="chat">
                        <option value="chat">Chat Interface</option>
                        <option value="text">Plain Text</option>
                        <option value="json">JSON Response</option>
                    </select>
                </div>

                {/* Preview Area */}
                <div
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        minHeight: '80px',
                        marginTop: '8px',
                    }}
                >
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        textAlign: 'center',
                        paddingTop: '20px',
                    }}>
                        Response will appear here after execution
                    </p>
                </div>
            </div>
        </div>
    );
}

export default memo(OutputNode);
