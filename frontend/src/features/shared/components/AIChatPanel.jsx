import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import HackerText from './HackerText';
import { chatAssistant } from '../../deploy/services/deploy.api';
import ReactMarkdown from 'react-markdown';

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.4rem 0.2rem' }}>
      <style>{`
        @keyframes aiBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .ai-md p { margin: 0 0 0.5em; }
        .ai-md p:last-child { margin-bottom: 0; }
        .ai-md ul, .ai-md ol { margin: 0.4em 0 0.4em 1.2em; padding: 0; }
        .ai-md li { margin-bottom: 0.2em; }
        .ai-md code {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(var(--acid-rgb,232,255,0),0.2);
          border-radius: 4px;
          padding: 0.1em 0.4em;
          font-family: monospace;
          font-size: 0.85em;
          color: var(--accent);
        }
        .ai-md pre {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(var(--acid-rgb,232,255,0),0.15);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .ai-md pre code {
          background: transparent;
          border: none;
          padding: 0;
          font-size: 0.78rem;
          line-height: 1.6;
        }
        .ai-md strong { color: #fff; font-family: var(--fb); }
        .ai-md h1, .ai-md h2, .ai-md h3 {
          color: #fff;
          font-family: var(--fb);
          margin: 0.5em 0 0.3em;
          font-size: 0.95em;
          letter-spacing: 0.02em;
        }
        .ai-md a { color: var(--accent); text-decoration: underline; }
        .ai-md blockquote {
          border-left: 2px solid rgba(var(--acid-rgb,232,255,0),0.4);
          padding-left: 0.75rem;
          margin: 0.5em 0;
          color: rgba(255,255,255,0.6);
        }
        .ai-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 0.5em 0; }
      `}</style>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'var(--accent)',
          display: 'inline-block',
          animation: `aiBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

const SUGGESTIONS = [
  "Diagnose build failure",
  "How do I set environment variables?",
  "Why is my deployment failing?",
];

const AIChatPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const [messages, setMessages] = useState([
    { text: "Hello. I am the Quicklive AI. How can I assist with your deployments today?", sender: "ai" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const togglePanel = () => {
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (isOpen) {
      gsap.to(panelRef.current, { x: 0, duration: 0.5, ease: "power3.out" });
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      gsap.to(panelRef.current, { x: "-100%", duration: 0.4, ease: "power3.in" });
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendRef = useRef(null);

  const send = async (textOverride) => {
    const content = (textOverride || inputValue).trim();
    if (!content || isLoading) return;

    const userMsg = { text: content, sender: "user" };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    // Add an empty AI message placeholder we'll fill token by token
    setMessages(prev => [...prev, { text: "", sender: "ai" }]);

    try {
      const apiMessages = updatedMessages
        .slice(-6)
        .map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

      const res = await fetch("https://quicklive.tech/api/generate/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.token) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  text: updated[updated.length - 1].text + parsed.token,
                };
                return updated;
              });
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch (_) { }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          text: "⚠ Connection error. Make sure the backend is running and your API key is configured.",
          sender: "ai",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    send();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const explainErrorWithController = async (errorText) => {
    const userMsg = { text: `Please explain this deployment error:\n\n\`\`\`\n${errorText}\n\`\`\``, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Add empty AI message placeholder
    setMessages(prev => [...prev, { text: "", sender: "ai" }]);

    try {
      const res = await fetch("http://localhost:3000/api/error/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ error: errorText, context: "React Frontend Deployment Logs" }),
      });

      if (!res.ok) throw new Error("Explanation failed");

      const data = await res.json();

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          text: data.explaination || "No explanation provided.",
          sender: "ai",
        };
        return updated;
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          text: "⚠ Failed to generate explanation from the backend error controller.",
          sender: "ai",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleExplainError = (e) => {
      setIsOpen(true);
      const errorText = e.detail?.error;
      if (errorText) {
        setTimeout(() => {
          explainErrorWithController(errorText);
        }, 300); // Give panel time to open
      }
    };
    window.addEventListener('ai-explain-error', handleExplainError);
    return () => window.removeEventListener('ai-explain-error', handleExplainError);
  }, [messages]); // Dependency on messages so it appends correctly

  return (
    <>
      {/* Slide Panel */}
      <div
        ref={panelRef}
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '450px',
          height: '100vh',
          background: 'linear-gradient(145deg, rgba(10,10,10,0.97) 0%, rgba(5,5,5,0.99) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateX(-100%)',
          boxShadow: '20px 0 60px rgba(0,0,0,0.6)',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Toggle Button Attached to Center Right Edge */}
        <div
          onClick={togglePanel}
          style={{
            position: 'absolute',
            top: '50%',
            right: '-40px',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '80px',
            borderTopRightRadius: '12px',
            borderBottomRightRadius: '12px',
            background: 'rgba(15, 15, 15, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderLeft: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.3s, border-color 0.3s',
            boxShadow: '10px 0 20px rgba(0,0,0,0.5), inset -5px 0 10px rgba(var(--acid-rgb, 232,255,0), 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(25, 25, 25, 1)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(15, 15, 15, 0.95)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.4s ease' }}
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>

        {/* Header */}
        <div style={{ padding: '2rem 1.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: '1.8rem', color: '#fff', letterSpacing: '0.05em' }}>
            <HackerText text="SYSTEM AI" />
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isLoading ? 'rgba(var(--acid-rgb,232,255,0),0.5)' : 'var(--accent)',
              boxShadow: `0 0 10px var(--accent)`,
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ fontFamily: 'var(--fm)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
              {isLoading ? 'THINKING...' : 'ONLINE & READY'}
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <div data-lenis-prevent="true" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent', overscrollBehavior: 'contain' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(var(--acid-rgb, 232,255,0), 0.05)',
              border: `1px solid ${msg.sender === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(var(--acid-rgb, 232,255,0), 0.2)'}`,
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
              borderBottomLeftRadius: msg.sender === 'ai' ? '2px' : '12px',
              maxWidth: '85%',
              fontFamily: 'var(--fm)',
              fontSize: '0.8rem',
              lineHeight: '1.6',
              color: msg.sender === 'user' ? '#fff' : 'var(--accent)',
              wordBreak: 'break-word',
            }}>
              {msg.sender === 'ai' ? (
                <div className="ai-md">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                msg.text
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{
              alignSelf: 'flex-start',
              background: 'rgba(var(--acid-rgb, 232,255,0), 0.05)',
              border: '1px solid rgba(var(--acid-rgb, 232,255,0), 0.2)',
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              borderBottomLeftRadius: '2px',
            }}>
              <TypingDots />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

          {/* Pre-prompts (show only at start) */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem', scrollbarWidth: 'none' }}>
              <style>{`::-webkit-scrollbar { display: none; }`}</style>
              {SUGGESTIONS.map((prompt, i) => (
                <button key={i} onClick={() => send(prompt)} disabled={isLoading} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '16px',
                  fontFamily: 'var(--fm)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.8rem',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'var(--fm)',
                fontSize: '0.8rem',
                outline: 'none',
                transition: 'border-color 0.3s',
                opacity: isLoading ? 0.6 : 1,
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button type="submit" disabled={isLoading || !inputValue.trim()} style={{
              background: inputValue.trim() && !isLoading ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              color: inputValue.trim() && !isLoading ? '#000' : 'rgba(255,255,255,0.3)',
              border: 'none',
              width: '40px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AIChatPanel;
