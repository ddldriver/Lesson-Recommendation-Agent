import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Bot, GraduationCap, MessageCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react';

const initialMessages = [
  { id: 1, role: 'user', text: '我需要修多少学分？', time: '09:41' },
  { id: 2, role: 'assistant', text: '您一共要修 50 学分，其中 34 学分为学位课，16 学分为非学位课。', time: '09:41' },
  { id: 3, role: 'user', text: '学位课有哪些？', time: '09:42' },
  { id: 4, role: 'assistant', text: '学位课包括矩阵原理与应用、最优化理论等。你也可以告诉我感兴趣的方向，我来帮你看看怎么搭配更合适。', time: '09:42' },
];

const suggestions = [
  { icon: GraduationCap, label: '还差多少学分？', prompt: '我还差多少学分才能满足毕业要求？' },
  { icon: BookOpen, label: '推荐适合的课程', prompt: '可以根据我的培养方案推荐几门课程吗？' },
  { icon: MessageCircle, label: '学位课怎么选？', prompt: '学位课应该怎么选择？' },
];

function getTime() {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

export default function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  async function sendMessage(value = input, priorMessages = messages) {
    const text = value.trim();
    if (!text || loading) return;
    setError('');
    setInput('');
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text, time: getTime() }]);
    setLoading(true);
    const startedAt = Date.now();
    let reply = '';
    let requestFailed = false;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: '',
          user_query: text,
          history: priorMessages.map(({ role, text: content }) => ({ role, content })),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.reply) throw new Error(payload.error || '回复失败');
      reply = payload.reply;
    } catch {
      requestFailed = true;
    }

    const remaining = Math.max(0, 1000 - (Date.now() - startedAt));
    if (remaining) await new Promise((resolve) => setTimeout(resolve, remaining));
    if (requestFailed) setError('稍后再试');
    else setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', text: reply, time: getTime() }]);
    setLoading(false);
    inputRef.current?.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function startNewChat() {
    setMessages(initialMessages);
    setError('');
    setInput('');
  }

  return (
    <main className="app-shell">
      <section className="chat-window" aria-label="选课推荐助手聊天窗口">
        <header className="topbar">
          <div className="brand-mark"><GraduationCap size={23} strokeWidth={1.8} /></div>
          <div className="brand-copy">
            <h1>选课推荐助手</h1>
            <div className="online-line"><span className="online-dot" />在线为你解答</div>
          </div>
          <div className="topbar-actions">
            <span className="semester-tag">学业规划 · 2025—2026</span>
            <button className="icon-button reset-button" type="button" onClick={startNewChat} aria-label="重新开始对话" title="重新开始对话"><RotateCcw size={17} /></button>
          </div>
        </header>

        <div className="conversation">
          <div className="date-divider"><span>今天</span></div>
          <div className="welcome-note"><Sparkles size={14} /> Hi，今天想了解什么课程信息？</div>
          {messages.map((message) => (
            <div key={message.id} className={`message-row ${message.role === 'user' ? 'from-user' : 'from-assistant'}`}>
              {message.role === 'assistant' && <div className="avatar assistant-avatar"><Bot size={17} /></div>}
              <div className="message-stack">
                {message.role === 'assistant' && <span className="sender-label">选课推荐助手</span>}
                <div className="bubble">{message.text}</div>
                <time className="message-time">{message.time}</time>
              </div>
              {message.role === 'user' && <div className="avatar user-avatar">我</div>}
            </div>
          ))}
          {loading && (
            <div className="message-row from-assistant typing-row" aria-live="polite">
              <div className="avatar assistant-avatar"><Bot size={17} /></div>
              <div className="message-stack"><span className="sender-label">选课推荐助手</span><div className="typing-bubble"><span className="typing-dots"><i /><i /><i /></span><span>正在输入...</span></div></div>
            </div>
          )}
          {error && <div className="error-note"><span>{error}</span><button type="button" onClick={() => sendMessage(messages.at(-1)?.role === 'user' ? messages.at(-1).text : '', messages.slice(0, -1))}>重试</button><button className="dismiss-error" type="button" aria-label="关闭提示" onClick={() => setError('')}><X size={14} /></button></div>}
          <div ref={bottomRef} />
        </div>

        <footer className="composer-area">
          <div className="suggestion-heading"><span>试试这样问</span><span className="heading-rule" /></div>
          <div className="suggestions">
            {suggestions.map(({ icon: Icon, label, prompt }) => (
              <button className="suggestion-chip" type="button" key={label} onClick={() => sendMessage(prompt)} disabled={loading}>
                <Icon size={15} strokeWidth={1.8} /><span>{label}</span><ArrowDown className="chip-arrow" size={13} />
              </button>
            ))}
          </div>
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}
              placeholder="输入你想了解的课程或学分问题..."
              rows={1}
              aria-label="输入消息"
            />
            <button className="send-button" type="submit" aria-label="发送消息" title="发送" disabled={!input.trim() || loading}>
              {loading ? <span className="send-spinner" /> : <Send size={17} />}
            </button>
          </form>
          <div className="composer-foot"><span>Enter 发送 · Shift + Enter 换行</span><span>AI 回复仅供选课参考</span></div>
        </footer>
      </section>
      <div className="page-caption"><span className="caption-dot" />校园学业服务 · 随时为你解答</div>
    </main>
  );
}
