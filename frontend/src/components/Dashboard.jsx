import { useState, useEffect } from 'react';
import { Zap, Plus, Edit3, Trash2, Clock, MoreVertical } from 'lucide-react';

function Dashboard({ onCreateStack, onEditStack, stacks = [], onDeleteStack }) {
    const [hoveredCard, setHoveredCard] = useState(null);
    const [menuOpen, setMenuOpen] = useState(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setMenuOpen(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const formatDate = (date) => {
        if (!date) return 'Just now';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '8px' }}>My Stacks</h1>
                    <p>Build and manage your AI workflow stacks</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={onCreateStack}>
                    <Plus size={20} />
                    New Stack
                </button>
            </div>

            {/* Grid */}
            <div className="dashboard-grid">
                {/* Create New Card */}
                <div
                    className="stack-card stack-card-new"
                    onClick={onCreateStack}
                >
                    <Plus size={48} />
                    <h3 style={{ marginTop: '16px' }}>Create New Stack</h3>
                    <p style={{ fontSize: '0.875rem' }}>Start building your AI workflow</p>
                </div>

                {/* Existing Stacks */}
                {stacks.map((stack) => (
                    <div
                        key={stack.id}
                        className="stack-card"
                        onMouseEnter={() => setHoveredCard(stack.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onEditStack(stack)}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '12px',
                        }}>
                            <div className="stack-card-icon">
                                <Zap size={24} />
                            </div>

                            {/* More Menu */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(menuOpen === stack.id ? null : stack.id);
                                    }}
                                    style={{
                                        opacity: hoveredCard === stack.id || menuOpen === stack.id ? 1 : 0,
                                        transition: 'opacity 0.2s',
                                    }}
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {menuOpen === stack.id && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-md)',
                                            boxShadow: 'var(--shadow-lg)',
                                            minWidth: '140px',
                                            zIndex: 10,
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            style={{
                                                width: '100%',
                                                padding: '10px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                color: 'var(--text-primary)',
                                            }}
                                            onClick={() => {
                                                setMenuOpen(null);
                                                onEditStack(stack);
                                            }}
                                        >
                                            <Edit3 size={16} />
                                            Edit Stack
                                        </button>
                                        <button
                                            style={{
                                                width: '100%',
                                                padding: '10px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                color: 'var(--error)',
                                            }}
                                            onClick={() => {
                                                setMenuOpen(null);
                                                onDeleteStack(stack.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3>{stack.name || 'Untitled Stack'}</h3>
                        <p style={{ marginTop: '4px' }}>
                            {stack.description || `${stack.nodes?.length || 0} components`}
                        </p>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '16px',
                            fontSize: '0.75rem',
                            color: 'var(--text-tertiary)',
                        }}>
                            <Clock size={14} />
                            {formatDate(stack.updatedAt)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {stacks.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '64px',
                    color: 'var(--text-tertiary)',
                }}>
                    <Zap size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <h2 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        No stacks yet
                    </h2>
                    <p>Create your first AI workflow stack to get started</p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
