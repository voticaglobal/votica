/**
 * Client-side half of the Preview-only API gate (server half: the
 * requirePreviewAccess check in api/generate-charm-concept.js and
 * api/generate-image.js). Only matters on Preview deployments — Production
 * has no PREVIEW_ACCESS_TOKEN set, so the server ignores this header there.
 */
const STORAGE_KEY = "vandida:preview-access-code";

export function getPreviewAccessCode(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setPreviewAccessCode(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore — worst case the user has to re-enter it this session
  }
}

export function previewAccessHeaders(): Record<string, string> {
  const code = getPreviewAccessCode();
  return code ? { "X-Preview-Access": code } : {};
}
