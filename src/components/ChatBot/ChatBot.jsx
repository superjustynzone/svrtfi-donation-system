import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, ChevronDown, Minimize2 } from 'lucide-react';
import './ChatBot.css';

// ─── Quick-reply suggestion chips shown on open ───────────────────────────────
const QUICK_REPLIES = [
  "How do I donate?",
  "What are your payment methods?",
  "What is your bank account number?",
  "Can I donate anonymously?",
  "What foundations do you support?",
];

// ─── Initial greeting from the bot ────────────────────────────────────────────
const WELCOME_MESSAGE = {
  role: "model",
  text: "Hi there! 👋 I'm the **SVRTV Assistant**, here to help you with questions about donations, campaigns, and our foundation.\n\nWhat can I help you with today?",
  id: "welcome",
};

function formatBotText(text) {
  // Bold (**text**)
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Bullet points with •
  formatted = formatted.replace(/^•\s(.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  // Line breaks
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  // Pulse the button when closed after receiving a new message
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasNewMessage(true);
    }
  }, [messages, isOpen]);

  // Clear unread when opening
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasNewMessage(false);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const sendMessage = useCallback(async (text) => {
    const userText = text || inputValue.trim();
    if (!userText || isLoading) return;

    setInputValue('');
    setShowQuickReplies(false);

    const userMsg = { role: 'user', text: userText, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Build history for the API (exclude the welcome message)
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, text: m.text }));

    try {
      const response = await fetch('http://127.0.0.1:5000/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      const botMsg = {
        role: 'model',
        text: data.reply,
        id: Date.now() + 1,
        source: data.source || 'faq',
      };

      setMessages(prev => [...prev, botMsg]);

      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
        setHasNewMessage(true);
      }
    } catch (err) {
      const errorMsg = {
        role: 'model',
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or visit our **Contact Us** page for direct support.",
        id: Date.now() + 1,
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setShowQuickReplies(true);
    setInputValue('');
  };

  return (
    <>
      {/* ─── Floating Toggle Button ───────────────────────────────────────────── */}
      {!isOpen && (
        <button
          id="chatbot-toggle-btn"
          className={`chatbot-fab ${hasNewMessage ? 'chatbot-fab--pulse' : ''}`}
          onClick={handleOpen}
          aria-label="Open SVRTV Assistant chat"
          title="Chat with SVRTV Assistant"
        >
          <MessageCircle className="chatbot-fab-icon" size={26} />
          {unreadCount > 0 && (
            <span className="chatbot-badge">{unreadCount}</span>
          )}
          {/* Tooltip */}
          <span className="chatbot-fab-tooltip">Chat with us!</span>
        </button>
      )}

      {/* ─── Chat Window ──────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          id="chatbot-window"
          className={`chatbot-window ${isMinimized ? 'chatbot-window--minimized' : 'chatbot-window--open'}`}
          role="dialog"
          aria-label="SVRTV Assistant Chat"
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <Bot size={18} />
              </div>
              <div>
                <div className="chatbot-header-name">SVRTV Assistant</div>
                <div className="chatbot-header-status">
                  <span className="chatbot-status-dot" />
                  Online · Usually replies instantly
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-header-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <ChevronDown size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                className="chatbot-header-btn"
                onClick={handleClose}
                aria-label="Close chat"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body (hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div id="chatbot-messages" className="chatbot-messages" role="log" aria-live="polite">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chatbot-msg-row chatbot-msg-row--${msg.role === 'user' ? 'user' : 'bot'}`}
                  >
                    {msg.role !== 'user' && (
                      <div className="chatbot-msg-avatar">
                        <Bot size={14} />
                      </div>
                    )}
                    <div
                      className={`chatbot-bubble chatbot-bubble--${msg.role === 'user' ? 'user' : msg.isError ? 'error' : 'bot'}`}
                      dangerouslySetInnerHTML={{ __html: formatBotText(msg.text) }}
                    />
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="chatbot-msg-row chatbot-msg-row--bot">
                    <div className="chatbot-msg-avatar">
                      <Bot size={14} />
                    </div>
                    <div className="chatbot-bubble chatbot-bubble--bot chatbot-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}

                {/* Quick replies */}
                {showQuickReplies && !isLoading && (
                  <div className="chatbot-quick-replies">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q}
                        className="chatbot-quick-chip"
                        onClick={() => handleQuickReply(q)}
                        id={`quick-reply-${q.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="chatbot-input-area">
                <div className="chatbot-input-row">
                  <input
                    ref={inputRef}
                    type="text"
                    id="chatbot-input"
                    className="chatbot-input"
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    aria-label="Chat message input"
                  />
                  <button
                    id="chatbot-send-btn"
                    className={`chatbot-send-btn ${inputValue.trim() && !isLoading ? 'chatbot-send-btn--active' : ''}`}
                    onClick={() => sendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    aria-label="Send message"
                    title="Send"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="chatbot-footer-note">
                  Powered by SVRTV Assistant · <button className="chatbot-clear-btn" onClick={clearChat}>Clear chat</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
