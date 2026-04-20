import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import './AiAssistant.css';

export default function AiAssistant() {
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hello! I'm Syntheia. I'm aware of your progress and current activity. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Prepare context for the AI
      const context = {
        screen: state.screen,
        level: state.activePlan?.level,
        module_id: state.activePlan?.module_id,
        activePlan: state.activePlan
      };

      const res = await api.sendChatMessage(newMessages, context);
      setMessages(prev => [...prev, { role: 'model', content: res.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I lost my connection. Ensure your API key is active!" }]);
    } finally {
      setLoading(false);
    }
  };

  // Only show if user is initialized and past splash/welcome (logged in ish)
  if (!state.user && state.screen !== 'onboarding') return null;

  return (
    <>
      <motion.button
        className="tutor-fab"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {isOpen ? '✕' : '✨'}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="tutor-panel glass"
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="tutor-header">
              <div className="flex items-center gap-12">
                <div className="logo-mark" style={{ width: 24, height: 24, fontSize: '0.8rem' }}>S</div>
                <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 800 }}>SYNTHEIA ASSISTANT</span>
              </div>
              <div className="badge badge-yellow">LIVE_CONTEXT</div>
            </div>

            <div className="tutor-messages text-gray" ref={scrollRef}>
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`msg-bubble msg-${msg.role}`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </motion.div>
              ))}
              {loading && <div className="mono text-yellow" style={{ fontSize: '0.7rem' }}>THINKING...</div>}
            </div>

            <form className="tutor-input-area" onSubmit={sendMessage}>
              <div className="flex gap-8">
                <input
                  className="w-full"
                  style={{ background: 'var(--gray-2)', border: 'none', padding: '10px 14px', borderRadius: 4, color: 'white', fontSize: '0.9rem' }}
                  placeholder="Ask for guidance..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={loading}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0 16px', fontSize: '0.9rem' }}
                  disabled={loading || !input.trim()}
                >
                  →
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
