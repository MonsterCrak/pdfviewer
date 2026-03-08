import React, { useState } from 'react';
import useTranslation from '../hooks/useTranslation';

export default function AiPanel() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: t('aiGreeting') }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: t('aiPlaceholder')
      }]);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <span>🤖</span> {t('aiAssistant')}
      </div>
      <div className="ai-panel-actions">
        <button className="ai-action-btn" onClick={() => {
          setMessages(prev => [...prev,
            { role: 'user', text: t('generateSummary') },
            { role: 'assistant', text: t('summaryPlaceholder') }
          ]);
        }}>
          {t('generateSummary')}
        </button>
        <button className="ai-action-btn" onClick={() => {
          setMessages(prev => [...prev,
            { role: 'user', text: t('exportTables') },
            { role: 'assistant', text: t('tablePlaceholder') }
          ]);
        }}>
          {t('exportTables')}
        </button>
      </div>
      <div className="ai-chat">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="ai-input-area">
        <input
          type="text"
          placeholder={t('askDocument')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-primary" onClick={handleSend} style={{ padding: '8px 16px' }}>
          {t('send')}
        </button>
      </div>
    </div>
  );
}
