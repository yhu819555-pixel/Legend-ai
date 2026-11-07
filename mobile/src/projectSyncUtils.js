export function mergeCloudProjectList(localProjects, cloudProjects) {
  if (!Array.isArray(cloudProjects)) return localProjects;
  const byId = new Map(localProjects.map((project) => [project.id, project]));
  for (const project of cloudProjects) if (!byId.has(project.id)) byId.set(project.id, project);
  return [...byId.values()];
}
