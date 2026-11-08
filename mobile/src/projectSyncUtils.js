function timestampOf(item) {
  const numericId = Number.parseInt(item?.id, 10);
  if (Number.isFinite(numericId)) return numericId;
  const parsed = Date.parse(item?.updatedAt || item?.createdAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeById(localItems, cloudItems, preferNewest = false) {
  const merged = new Map();
  for (const item of Array.isArray(localItems) ? localItems : []) {
    if (item && typeof item.id === "string") merged.set(item.id, item);
  }
  for (const item of Array.isArray(cloudItems) ? cloudItems : []) {
    if (!item || typeof item.id !== "string") continue;
    const local = merged.get(item.id);
    if (!local || (preferNewest && Date.parse(item.updatedAt || "") > Date.parse(local.updatedAt || ""))) {
      merged.set(item.id, item);
    }
  }
  return [...merged.values()].sort((a, b) => timestampOf(a) - timestampOf(b));
}

export function mergeProjectSnapshot(localData, cloudProject) {
  return {
    files: mergeById(localData?.files, cloudProject?.files, true),
    messages: mergeById(localData?.messages, cloudProject?.messages)
  };
}

export function mergeCloudProjectList(localProjects, cloudProjects) {
  if (!Array.isArray(cloudProjects)) return localProjects;
  const byId = new Map(localProjects.map((project) => [project.id, project]));
  for (const project of cloudProjects) if (!byId.has(project.id)) byId.set(project.id, project);
  return [...byId.values()];
}
