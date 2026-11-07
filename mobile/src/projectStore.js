export const STORAGE_KEY = "@my-ai-agent/projects";

export function createProject(name, now = Date.now(), random = Math.random()) {
  const cleanName = String(name ?? "").trim();
  if (!cleanName) throw new TypeError("Project name is required");
  return {
    id: `${now}-${random.toString(36).slice(2, 8)}`,
    name: cleanName,
    createdAt: new Date(now).toISOString()
  };
}

export async function readProjects(storage) {
  const raw = await storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const projects = JSON.parse(raw);
  if (!Array.isArray(projects) || projects.some((project) =>
    !project || typeof project.id !== "string" ||
    typeof project.name !== "string" ||
    typeof project.createdAt !== "string"
  )) {
    throw new TypeError("Stored projects have an invalid format");
  }
  return projects;
}

export async function deleteProject(storage, projects, projectId) {\n  if (!Array.isArray(projects)) throw new TypeError("Projects must be an array");\n  const next = projects.filter((project) => project.id !== projectId);\n  await storage.setItem(STORAGE_KEY, JSON.stringify(next));\n  await storage.removeItem("@legend-ai/project-files/" + projectId);\n  await storage.removeItem("@legend-ai/chat/" + projectId);\n  return next;\n}\n\nexport async function saveProject(storage, projects, project) {
  if (!Array.isArray(projects)) throw new TypeError("Projects must be an array");
  const next = [project, ...projects];
  await storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
