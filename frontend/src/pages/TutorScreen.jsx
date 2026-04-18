import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function TutorScreen() {
  const { navigate, signOut } = useApp();
  
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hello! I'm Syntheia, your AI programming tutor. What would you like to learn today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(newMessages);
      setMessages(prev => [...prev, { role: 'model', content: res.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I ran into an error communicating with the backend. Make sure the Gemini API key is configured!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-screen screen" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <nav className="dash-nav" style={{ flexShrink: 0 }}>
        <div className="dash-logo"><div className="logo-mark">S</div><span>SYNTHEIA</span></div>
        <div className="dash-nav-links">
          <button className="nav-link" onClick={() => navigate('dashboard')}>Dashboard</button>
          <button className="nav-link" onClick={() => navigate('calendar')}>Calendar</button>
          <button className="nav-link" onClick={() => navigate('progress')}>Progress</button>
          <button className="nav-link active">AI Tutor</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost mono" onClick={() => navigate('welcome')} style={{ fontSize: '0.8rem' }}>↩ Home</button>
          <button className="btn btn-ghost mono" onClick={signOut} style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%', padding: '24px 16px', overflow: 'hidden' }}>
        <div className="dash-hero" style={{ marginBottom: 16, flexShrink: 0 }}>
          <h1 className="dash-title" style={{ fontSize: '1.8rem' }}>YOUR <span className="text-yellow">AI TUTOR</span></h1>
          <div className="dash-subtitle mono text-gray">Ask questions, debug code, or review concepts.</div>
        </div>

        <div style={{ flex: 1, background: '#121212', border: '1px solid #2a2a2a', borderRadius: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' 
              }}>
                <div style={{ 
                  color: '#9a9a9a', 
                  fontSize: '0.7rem', 
                  letterSpacing: '0.1em', 
                  marginBottom: '4px',
                  fontFamily: 'monospace'
                }}>
                  {msg.role === 'user' ? 'YOU' : 'SYNTHEIA_AI'}
                </div>
                <div style={{
                  background: msg.role === 'user' ? '#e8ff00' : '#1e1e1e',
                  color: msg.role === 'user' ? '#000' : '#e0e0e0',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                  borderTopLeftRadius: msg.role === 'model' ? '2px' : '12px',
                  maxWidth: '85%',
                  lineHeight: '1.5',
                  fontSize: '0.95rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ color: '#9a9a9a', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: 'monospace' }}>SYNTHEIA_AI</div>
                <div style={{ background: '#1e1e1e', padding: '12px 18px', borderRadius: '12px', borderTopLeftRadius: '2px' }}>
                  <span style={{ display: 'inline-block', animation: 'pulse 1.5s infinite opacity' }}>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', padding: '16px', background: '#0a0a0a', borderTop: '1px solid #2a2a2a' }}>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything..."
              style={{
                flex: 1,
                background: '#161616',
                border: '1px solid #333',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '8px',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem'
              }}
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              style={{
                background: '#e8ff00',
                color: '#000',
                border: 'none',
                padding: '0 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1
              }}
            >
              SEND
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
