import { useState, useRef, useEffect } from 'react';
import { X, Send, User, Bot, Loader } from 'lucide-react';

function ChatInterface({ isOpen, onClose, stackName, onSendMessage }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Create placeholder for assistant message
            const assistantMsgId = Date.now() + 1;
            setMessages((prev) => [...prev, {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
                isStreaming: true
            }]);

            // Call the onSendMessage callback with streaming handler
            await onSendMessage(input.trim(), (chunkData) => {
                setMessages((prev) => prev.map(msg => {
                    if (msg.id === assistantMsgId) {
                        // If it's a chunk object (from backend streaming)
                        if (typeof chunkData === 'object' && chunkData.chunk) {
                            return { ...msg, content: msg.content + chunkData.chunk };
                        }
                        // If it's a string (legacy/direct update)
                        if (typeof chunkData === 'string') {
                            return { ...msg, content: chunkData }; // Or append? Depends on api/index.js behavior. 
                            // api/index.js onChunk passes (data) where data is {chunk: "..."} or {metadata: ...}
                            // But wait, my api/index.js update passes `onChunk(data)`. 
                            // So chunkData represents the parsed JSON object.
                        }
                        return msg;
                    }
                    return msg;
                }));
            });

            // Mark streaming as done
            setMessages((prev) => prev.map(msg =>
                msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
            ));

        } catch (error) {
            // Update the placeholder message with the error, or add a new one
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                    // Update the existing placeholder with error
                    return prev.map(msg =>
                        msg.id === lastMsg.id
                            ? { ...msg, content: `Error: ${error.message || 'Something went wrong.'}`, isError: true, isStreaming: false }
                            : msg
                    );
                }
                // Otherwise, add a new error message
                return [...prev, {
                    id: Date.now() + 2,
                    role: 'assistant',
                    content: `Error: ${error.message || 'Something went wrong. Please try again.'}`,
                    isError: true,
                }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="chat-header">
                    <div className="chat-header-left">
                        <div className="chat-header-icon">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>
                                {stackName || 'GenAI Stack'} Chat
                            </h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                Ask questions about your documents
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-tertiary)',
                            textAlign: 'center',
                            padding: '48px',
                        }}>
                            <Bot size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                Ready to chat!
                            </h4>
                            <p style={{ fontSize: '0.875rem' }}>
                                Your workflow is active. Ask any question to get started.
                            </p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`chat-message ${message.role}`}
                        >
                            <div className="chat-message-avatar">
                                {message.role === 'user' ? (
                                    <User size={18} />
                                ) : (
                                    <Bot size={18} />
                                )}
                            </div>
                            <div
                                className="chat-message-content"
                                style={message.isError ? {
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: 'var(--error)',
                                } : {}}
                            >
                                {message.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className="chat-message assistant">
                            <div className="chat-message-avatar">
                                <Bot size={18} />
                            </div>
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="chat-input-container">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                    >
                        {isLoading ? (
                            <Loader size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatInterface;
