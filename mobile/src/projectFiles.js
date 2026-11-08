export const PROJECT_FILES_PREFIX = "@legend-ai/project-files/";

export function projectFilesKey(projectId) {
  return PROJECT_FILES_PREFIX + String(projectId);
}

export function createProjectFile(name, content = "", now = Date.now(), random = Math.random()) {
  const cleanName = String(name ?? "").trim();
  if (!cleanName || cleanName.length > 100 || /[\/\\]/.test(cleanName) || cleanName === "." || cleanName === "..") {
    throw new TypeError("File name must be a simple name without folders");
  }
  if (String(content).length > 6000) throw new RangeError("File content is too large (maximum 6000 characters)");
  return {
    id: String(now) + "-" + random.toString(36).slice(2, 8),
    name: cleanName,
    content: String(content),
    updatedAt: new Date(now).toISOString()
  };
}

export async function readProjectFiles(storage, projectId) {
  const raw = await storage.getItem(projectFilesKey(projectId));
  if (raw === null) return [];
  const files = JSON.parse(raw);
  if (!Array.isArray(files) || files.length > 10 || files.some((file) =>
    !file || typeof file.id !== "string" || typeof file.name !== "string" ||
    typeof file.content !== "string" || typeof file.updatedAt !== "string"
  )) throw new TypeError("Stored project files have an invalid format");
  return files;
}

export async function saveProjectFile(storage, projectId, file) {
  const files = await readProjectFiles(storage, projectId);
  const clean = createProjectFile(file.name, file.content, Date.now(), Math.random());
  const duplicateName = files.find((item) => item.name.toLowerCase() === clean.name.toLowerCase() && item.id !== file.id);
  if (duplicateName) throw new Error("A file with this name already exists in this project");
  const existingIndex = files.findIndex((item) => item.id === file.id);
  const saved = { ...clean, id: file.id || clean.id };
  const next = existingIndex >= 0
    ? files.map((item, index) => index === existingIndex ? saved : item)
    : [saved, ...files];
  if (next.length > 10) throw new RangeError("A project can contain at most 10 text files");
  const total = next.reduce((sum, item) => sum + item.name.length + item.content.length, 0);
  if (total > 12000) throw new RangeError("Project files exceed the 12000 character context limit");
  await storage.setItem(projectFilesKey(projectId), JSON.stringify(next));
  return next;
}

export async function deleteProjectFile(storage, projectId, fileId) {
  const files = await readProjectFiles(storage, projectId);
  const next = files.filter((file) => file.id !== fileId);
  await storage.setItem(projectFilesKey(projectId), JSON.stringify(next));
  return next;
}
