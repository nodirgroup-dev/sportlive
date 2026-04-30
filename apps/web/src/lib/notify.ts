import 'server-only';

const SLACK = process.env.SLACK_WEBHOOK_URL;
const TG_BOT = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

export type Notify = { text: string; url?: string };

export async function notifyOps(msg: Notify): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  if (SLACK) {
    tasks.push(
      fetch(SLACK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: msg.url ? `${msg.text}\n${msg.url}` : msg.text,
        }),
      }).catch((e) => console.error('[notify] slack failed', e)),
    );
  }

  if (TG_BOT && TG_CHAT) {
    const url = `https://api.telegram.org/bot${TG_BOT}/sendMessage`;
    const body = {
      chat_id: TG_CHAT,
      text: msg.url ? `${msg.text}\n${msg.url}` : msg.text,
      disable_web_page_preview: false,
    };
    tasks.push(
      fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).catch((e) => console.error('[notify] telegram failed', e)),
    );
  }

  await Promise.all(tasks);
}
