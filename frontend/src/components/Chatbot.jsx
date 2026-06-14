import React, { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import '../styles/Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I’m your RideGo Assistant — here to make your trips smoother! 🚗\n\nI can help you with:\n• Vehicle rentals & prices\n• Trip ideas for destinations\n• Booking, payments & cancellations\n• Adventure ride suggestions\n\nWhere would you like to start?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages list or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-scroll to bottom and focus input when chat window is opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: conversationHistory,
          conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.reply || 'Sorry, I did not receive a proper response from the assistant.',
        timestamp: data.timestamp || new Date().toISOString(),
        fallback: data.fallback || false
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠ Oops! Couldn’t connect right now. Please try again or contact support@ridego.com.',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (isLoading) return;
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const quickSuggestions = [
    "🚘 Show available vehicles near Pondicherry",
    "🧾 Check rental price list",
    "🕐 View rental duration options",
    "🌄 Suggest an adventure ride",
    "📍 Best routes from Madurai to Ooty",
    "💬 Contact RideGo support"
  ];

  return (
    <>
      <button 
        className={`chatbot-button ${isOpen ? 'chatbot-button-open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot window"
      >
        {isOpen ? <FaTimes /> : <FaComments />}
        {!isOpen && <span className="chatbot-button-badge">AI</span>}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <FaRobot className="chatbot-header-icon" />
              <div>
                <h3>RideGo Assistant</h3>
                <span className="chatbot-status">Your smart rental guide</span>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)} aria-label="Close chatbot">
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message ${msg.role === 'user' ? 'chatbot-message-user' : 'chatbot-message-assistant'}`}>
                {msg.role === 'assistant' && (
                  <div className="chatbot-message-avatar">
                    <FaRobot />
                  </div>
                )}
                <div className={`chatbot-message-content ${msg.isError ? 'chatbot-error-message' : ''}`}>
                  {msg.content}
                  {msg.fallback && <div className="fallback-indicator"><small>⚙ Fallback response</small></div>}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message chatbot-message-assistant">
                <div className="chatbot-message-avatar">
                  <FaRobot />
                </div>
                <div className="chatbot-message-content chatbot-typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 3 && !isLoading && (
            <div className="chatbot-suggestions">
              {quickSuggestions.map((s, idx) => (
                <button key={idx} className="chatbot-suggestion-btn" onClick={() => handleSuggestionClick(s)} disabled={isLoading}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder={isLoading ? "Typing..." : "Ask about vehicles, trips, or rentals..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="chatbot-send-btn" disabled={!inputMessage.trim() || isLoading}>
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;