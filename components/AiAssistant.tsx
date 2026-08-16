import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface AiAssistantProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ messages, isLoading, onSendMessage }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="ai-assistant bg-surface-2 border border-accent rounded-lg p-3 flex flex-col shadow-lg shadow-black/20 shrink-0 h-48 lg:h-64">
            <div className="ai-header text-center font-bold text-accent mb-2">AI ASSISTANT</div>
            <div className="chat-history flex-grow overflow-y-auto mb-2 pr-2 scrollbar-thin scrollbar-thumb-accent scrollbar-track-bg">
                {messages.map((msg, index) => (
                    <div key={index} className={`message mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-accent text-bg' : 'bg-surface-1 text-text-1'}`}>
                            {/* If it's an empty model response while loading, show dots */}
                            {(msg.role === 'model' && msg.content === '' && isLoading) ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            ) : (
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="chat-input flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about this media..."
                    disabled={isLoading}
                    className="flex-1 p-2 bg-surface-1 border border-border text-text-1 placeholder-text-3 rounded disabled:opacity-50"
                    aria-label="Chat with AI assistant"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-accent text-bg font-bold py-2 px-4 rounded transition hover:bg-accent-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default AiAssistant;
