import { memo, useRef, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Upload, FileText, X } from 'lucide-react';

function KnowledgeBaseNode({ data, selected, id }) {
    const fileInputRef = useRef(null);
    const [uploadedFiles, setUploadedFiles] = useState(data.documents || []);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = files.map((file) => ({
            name: file.name,
            size: file.size,
            file: file,
        }));
        setUploadedFiles((prev) => [...prev, ...newFiles]);
    };

    const removeFile = (index) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={`custom-node ${selected ? 'selected' : ''}`} style={{ minWidth: '320px' }}>
            {/* Input handle - left side */}
            <Handle
                type="target"
                position={Position.Left}
                id="input"
                style={{ background: '#3B82F6' }}
            />

            <div className="node-header">
                <div className="node-icon knowledge">
                    <Database size={18} />
                </div>
                <span className="node-title">Knowledge Base</span>
            </div>

            <div className="node-body">
                {/* File Upload Area */}
                <div className="node-field">
                    <label>Documents</label>
                    <div
                        className="file-upload"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '16px', cursor: 'pointer' }}
                    >
                        <Upload size={24} style={{ marginBottom: '8px', color: 'var(--text-tertiary)' }} />
                        <p style={{ fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--primary-blue)' }}>Click to upload</span> or drag files
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>PDF, TXT, DOC</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        multiple
                    />
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                    <div className="node-field">
                        <label>Uploaded Files ({uploadedFiles.length})</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {uploadedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '6px 8px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FileText size={14} color="var(--primary-blue)" />
                                        <span style={{
                                            maxWidth: '150px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {file.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '2px',
                                            display: 'flex',
                                        }}
                                    >
                                        <X size={14} color="var(--text-tertiary)" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Embedding Model */}
                <div className="node-field">
                    <label>Embedding Model</label>
                    <select defaultValue={data.embeddingModel || 'local'}>
                        <option value="local">Local (Free - No API Key)</option>
                        <option value="text-embedding-3-large">text-embedding-3-large (OpenAI)</option>
                        <option value="text-embedding-3-small">text-embedding-3-small (OpenAI)</option>
                        <option value="text-embedding-ada-002">text-embedding-ada-002 (OpenAI)</option>
                    </select>
                </div>

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

export default memo(KnowledgeBaseNode);
