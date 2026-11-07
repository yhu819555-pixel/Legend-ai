import { STORAGE_KEY } from "./projectStore.js";
import { PROJECT_FILES_PREFIX } from "./projectFiles.js";

const CHAT_PREFIX = "@legend-ai/chat/";

export async function createBackup(storage, now = new Date().toISOString()) {
  const raw = await storage.getItem(STORAGE_KEY);
  const projects = raw ? JSON.parse(raw) : [];
  const records = [];
  for (const project of projects) {
    const [filesRaw, messagesRaw] = await Promise.all([
      storage.getItem(PROJECT_FILES_PREFIX + project.id),
      storage.getItem(CHAT_PREFIX + project.id)
    ]);
    records.push({
      ...project,
      files: filesRaw ? JSON.parse(filesRaw) : [],
      messages: messagesRaw ? JSON.parse(messagesRaw) : []
    });
  }
  return { format: "legend-ai-backup", version: 1, exportedAt: now, projects: records };
}

function validateBackup(value) {
  if (!value || value.format !== "legend-ai-backup" || value.version !== 1 ||
      !Array.isArray(value.projects) || value.projects.length > 200) {
    throw new TypeError("Backup format is not supported");
  }
  const seen = new Set();
  for (const project of value.projects) {
    if (!project || typeof project.id !== "string" || !/^[a-zA-Z0-9._-]{1,100}$/.test(project.id) ||
        typeof project.name !== "string" || !project.name.trim() || project.name.length > 120 ||
        typeof project.createdAt !== "string" || seen.has(project.id)) {
      throw new TypeError("Backup contains an invalid or duplicate project");
    }
    seen.add(project.id);
    if (!Array.isArray(project.files) || project.files.length > 10 ||
        project.files.some((file) => !file || typeof file.id !== "string" ||
          typeof file.name !== "string" || !file.name.trim() || file.name.length > 100 ||
          /[\/\\]/.test(file.name) || file.name === "." || file.name === ".." ||
          typeof file.content !== "string" || file.content.length > 6000)) {
      throw new TypeError("Backup contains invalid project files");
    }
    const total = project.files.reduce((sum, file) => sum + file.name.length + file.content.length, 0);
    if (total > 12000) throw new RangeError("Backup project files exceed the size limit");
    if (!Array.isArray(project.messages) || project.messages.length > 500 ||
        project.messages.some((message) => !message || typeof message.id !== "string" ||
          !["user", "assistant"].includes(message.role) || typeof message.content !== "string" ||
          !message.content.trim() || message.content.length > 8000)) {
      throw new TypeError("Backup contains invalid chat history");
    }
  }
  return value.projects;
}

export async function restoreBackup(storage, source) {
  let parsed;
  try { parsed = typeof source === "string" ? JSON.parse(source) : source; }
  catch { throw new TypeError("Backup JSON could not be read"); }
  const projects = validateBackup(parsed);
  const raw = await storage.getItem(STORAGE_KEY);
  const current = raw ? JSON.parse(raw) : [];
  const byId = new Map(current.map((project) => [project.id, project]));
  for (const project of projects) {
    const { files = [], messages = [], ...metadata } = project;
    byId.set(project.id, metadata);
    await storage.setItem(PROJECT_FILES_PREFIX + project.id, JSON.stringify(files));
    await storage.setItem(CHAT_PREFIX + project.id, JSON.stringify(messages));
  }
  const next = [...byId.values()];
  await storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return { projects: next, restoredCount: projects.length };
}
