const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendMessage(
  chatId: number,
  text: string,
  token: string
): Promise<boolean> {
  const url = `${TELEGRAM_API}${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  return res.ok;
}

export async function sendChatAction(
  chatId: number,
  action: "typing" | "upload_photo" | "record_video" | "upload_video" | "record_voice" | "upload_voice" | "upload_document" | "find_location" | "record_video_note" | "upload_video_note",
  token: string
): Promise<boolean> {
  const url = `${TELEGRAM_API}${token}/sendChatAction`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
  return res.ok;
}
