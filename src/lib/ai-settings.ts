import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "ai-settings.json");

interface AISettings {
  aiEnabled: boolean;
}

function readSettings(): AISettings {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(raw) as AISettings;
  } catch {
    return { aiEnabled: true };
  }
}

function writeSettings(settings: AISettings): void {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

/** Returns true only if the API key is set AND the admin hasn't disabled AI */
export function isAIActive(): boolean {
  if (!process.env.ANTHROPIC_API_KEY) return false;
  return readSettings().aiEnabled;
}

/** Returns the raw admin toggle value (independent of whether API key is set) */
export function getAIEnabledSetting(): boolean {
  return readSettings().aiEnabled;
}

export function setAIEnabled(enabled: boolean): void {
  const current = readSettings();
  writeSettings({ ...current, aiEnabled: enabled });
}
