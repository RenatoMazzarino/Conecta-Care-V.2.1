import crypto from "crypto";

export function fileHashMd5(buffer: Buffer) {
  try {
    return crypto.createHash("md5").update(buffer).digest("hex");
  } catch {
    return null;
  }
}

export function parseTagsInput(value?: string | string[] | null) {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const tags = value.map((tag) => tag.trim()).filter(Boolean);
    return tags.length > 0 ? tags : undefined;
  }
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}
