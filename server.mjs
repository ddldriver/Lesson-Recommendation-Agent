import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3001);
const workflowUrl = process.env.COZE_WORKFLOW_URL || 'https://78brfpcmdc.coze.site/run';
const currentDir = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '32kb' }));

app.post('/api/chat', async (req, res) => {
  const { user_query: userQuery, conversation_id: conversationId = '', history = [] } = req.body ?? {};
  if (typeof userQuery !== 'string' || !userQuery.trim()) {
    return res.status(400).json({ error: '请输入你的问题' });
  }
  if (typeof conversationId !== 'string' || !Array.isArray(history)) {
    return res.status(400).json({ error: '对话参数格式无效' });
  }
  const validHistory = history.every((item) =>
    item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string',
  );
  if (!validHistory) return res.status(400).json({ error: '对话记录格式无效' });
  if (!process.env.COZE_API_TOKEN) {
    return res.status(503).json({ error: '服务尚未配置，请稍后再试' });
  }

  try {
    const upstream = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.COZE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        user_query: userQuery.trim(),
        history,
      }),
      signal: AbortSignal.timeout(300_000),
    });
    const payload = await upstream.json();
    if (!upstream.ok) {
      console.error(`Coze workflow returned ${upstream.status}:`, payload?.detail?.error_message || payload?.error || 'unknown error');
      return res.status(upstream.status).json({ error: '工作流暂时不可用' });
    }
    const reply = payload?.data?.reply ?? payload?.final_reply;
    if (typeof reply !== 'string' || !reply.trim()) {
      return res.status(502).json({ error: '暂时没有收到有效回复' });
    }
    return res.json({ reply });
  } catch (error) {
    console.error('Coze workflow request failed:', error.message);
    return res.status(502).json({ error: '工作流请求失败' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(currentDir, 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.listen(port, '127.0.0.1', () => {
  console.log(`Lesson assistant API listening on http://127.0.0.1:${port}`);
});
