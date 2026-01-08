import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

function UserQueryNode({ data, selected }) {
    return (
        <div className={`custom-node ${selected ? 'selected' : ''}`}>
            <div className="node-header">
                <div className="node-icon query">
                    <MessageSquare size={18} />
                </div>
                <span className="node-title">User Query</span>
            </div>
            <div className="node-body">
                <div className="node-field">
                    <label>Input Type</label>
                    <input type="text" value="Text Query" disabled />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Accepts user questions as entry point for the workflow.
                </p>
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

export default memo(UserQueryNode);
