import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Sanitize a filename to prevent path traversal attacks.
 * Strips directory components — only the base filename is used.
 * Returns null if the resolved path would escape UPLOAD_DIR.
 */
function safeResolvePath(filename: string): string | null {
  // Strip any directory separators — keep only the base filename
  const base = path.basename(filename);
  if (!base || base === "." || base === "..") return null;

  const resolved = path.resolve(UPLOAD_DIR, base);

  // Double-check resolved path is inside UPLOAD_DIR
  if (!resolved.startsWith(UPLOAD_DIR + path.sep) && resolved !== UPLOAD_DIR) {
    return null;
  }
  return resolved;
}

export function saveFile(filename: string, buffer: Buffer): string {
  ensureUploadDir();
  const filepath = safeResolvePath(filename);
  if (!filepath) throw new Error("Invalid filename");
  fs.writeFileSync(filepath, buffer);
  return path.basename(filepath);
}

export function readFile(filename: string): Buffer | null {
  const filepath = safeResolvePath(filename);
  if (!filepath) return null;
  if (!fs.existsSync(filepath)) return null;
  return fs.readFileSync(filepath);
}

export function getFilePath(filename: string): string {
  const filepath = safeResolvePath(filename);
  if (!filepath) throw new Error("Invalid filename");
  return filepath;
}

export function fileExists(filename: string): boolean {
  const filepath = safeResolvePath(filename);
  if (!filepath) return false;
  return fs.existsSync(filepath);
}
