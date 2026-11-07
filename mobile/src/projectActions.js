import { createProject, saveProject } from "./projectStore.js";

export async function createAndSaveProject(storage, projects, name) {
  const project = createProject(name);
  const nextProjects = await saveProject(storage, projects, project);
  return { project, projects: nextProjects };
}
