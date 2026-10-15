export function summarize(text = '', limit = 180) {
  const value = String(text).replace(/\s+/g, ' ').trim();
  if (value.length <= limit) return value;
  const prefix = value.slice(0, limit + 1);
  const sentence = [...prefix.matchAll(/[.!?](?:[”"']?)(?=\s|$)/g)].at(-1);
  if (sentence && sentence.index >= 60) return value.slice(0, sentence.index + sentence[0].length);
  const boundary = prefix.lastIndexOf(' ');
  return `${value.slice(0, boundary > 0 ? boundary : limit).replace(/[,;\s]+$/, '')}…`;
}
