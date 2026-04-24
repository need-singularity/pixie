const API = "https://discord.com/api/v10";

async function call(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  const resp = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "DiscordBot (cloudflare-worker, 0.1)",
      ...(init.headers ?? {}),
    },
  });
  if (!resp.ok && resp.status !== 429) {
    const body = await resp.text().catch(() => "");
    throw new Error(`discord ${init.method ?? "GET"} ${path} → ${resp.status}: ${body}`);
  }
  return resp;
}

export async function createThread(
  channelId: string,
  messageId: string,
  name: string,
  token: string,
): Promise<{ id: string }> {
  const resp = await call(`/channels/${channelId}/messages/${messageId}/threads`, token, {
    method: "POST",
    body: JSON.stringify({ name: name.slice(0, 100), auto_archive_duration: 10080 }),
  });
  return (await resp.json()) as { id: string };
}

export async function postMessage(
  channelId: string,
  content: string,
  token: string,
): Promise<void> {
  await call(`/channels/${channelId}/messages`, token, {
    method: "POST",
    body: JSON.stringify({ content: content.slice(0, 2000) }),
  });
}

export async function postReply(
  channelId: string,
  messageId: string,
  content: string,
  token: string,
): Promise<void> {
  await call(`/channels/${channelId}/messages`, token, {
    method: "POST",
    body: JSON.stringify({
      content: content.slice(0, 2000),
      message_reference: { message_id: messageId, fail_if_not_exists: false },
      allowed_mentions: { replied_user: false },
    }),
  });
}

export async function postTranslation(
  channelId: string,
  messageId: string,
  content: string,
  threadName: string,
  token: string,
): Promise<void> {
  try {
    const thread = await createThread(channelId, messageId, threadName, token);
    await postMessage(thread.id, content, token);
  } catch {
    // Thread creation failed — message is in a thread, or thread already exists.
    // Reply inline in the same channel (which may itself be a thread).
    await postReply(channelId, messageId, content, token);
  }
}

export async function getMessage(
  channelId: string,
  messageId: string,
  token: string,
): Promise<{
  content: string;
  author: { bot?: boolean };
  message_snapshots?: { message: { content: string } }[];
}> {
  const resp = await call(`/channels/${channelId}/messages/${messageId}`, token);
  return (await resp.json()) as {
    content: string;
    author: { bot?: boolean };
    message_snapshots?: { message: { content: string } }[];
  };
}
