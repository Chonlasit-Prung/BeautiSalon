const SERVICE_EMOJIS = ['✂️', '🎨', '💆', '💅'];

export function serviceEmoji(index: number): string {
  return SERVICE_EMOJIS[index % SERVICE_EMOJIS.length] ?? '✂️';
}