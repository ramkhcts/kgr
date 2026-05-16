import fs from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function saveFile(filename: string, buffer: Buffer): string {
  ensureUploadDir();
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return filename;
}

export function readFile(filename: string): Buffer | null {
  const filepath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return fs.readFileSync(filepath);
}

export function getFilePath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

export function fileExists(filename: string): boolean {
  return fs.existsSync(path.join(UPLOAD_DIR, filename));
}
