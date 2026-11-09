export const MAX_WORKSPACE_TASK_LENGTH = 3000;

export function normalizeWorkspaceTask(value) {
  const task = String(value ?? "").trim();
  if (!task) throw new TypeError("Describe the task before continuing.");
  if (task.length > MAX_WORKSPACE_TASK_LENGTH) {
    throw new RangeError("Task is too long. Keep it under 3000 characters.");
  }
  return task;
}
