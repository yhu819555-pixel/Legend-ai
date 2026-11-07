import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { readProjectFiles } from "./projectFiles.js";
import { STORAGE_KEY } from "./projectStore.js";

const URL_KEY = "legend_ai_backend_url";
const TOKEN_KEY = "legend_ai_backend_token";
const chatKey = (projectId) => "@legend-ai/chat/" + projectId;

export async function getSyncConfig(storage = AsyncStorage, secureStore = SecureStore) {
  const [url, token] = await Promise.all([
    storage.getItem(URL_KEY),
    secureStore.getItemAsync(TOKEN_KEY)
  ]);
  const baseUrl = String(url || "").trim().replace(/\\/+$/, "");
  if (!/^https:\\/\\/[^/]+$/i.test(baseUrl) || !token) return null;
  return { baseUrl, token };
}

async function request(path, { method = "GET", body, fetchImpl = fetch } = {}) {
  const config = await getSyncConfig();
  if (!config) return null;
  const response = await fetchImpl(config.baseUrl + path, {
    method,
    headers: {
      authorization: "Bearer " + config.token,
      ...(body ? { "content-type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) {
    const error = new Error("Cloud sync failed (" + response.status + ")");
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? {} : response.json();
}

export async function listCloudProjects() {
  const result = await request("/v1/projects");
  return result?.projects ?? null;
}

export async function createCloudProject(project) {
  return request("/v1/projects", { method: "POST", body: { id: project.id, name: project.name } });
}

export async function syncProjectSnapshot(project, storage = AsyncStorage) {
  const files = await readProjectFiles(storage, project.id);
  const rawMessages = await storage.getItem(chatKey(project.id));
  const messages = rawMessages ? JSON.parse(rawMessages) : [];
  return request("/v1/projects/" + encodeURIComponent(project.id), {
    method: "PUT",
    body: {
      name: project.name,
      files: files.map(({ id, name, content }) => ({ id, name, content })),
      messages: messages.slice(-500).map(({ id, role, content }) => ({ id, role, content }))
    }
  });
}

export async function ensureCloudProject(project, storage = AsyncStorage) {
  try {
    await createCloudProject(project);
  } catch (error) {
    if (error.status !== 409) throw error;
  }
  return syncProjectSnapshot(project, storage);
}

export async function pullCloudProject(projectId, storage = AsyncStorage) {
  const result = await request("/v1/projects/" + encodeURIComponent(projectId));
  if (!result?.project) return null;
  const project = result.project;
  const localProjectsRaw = await storage.getItem(STORAGE_KEY);
  const localProjects = localProjectsRaw ? JSON.parse(localProjectsRaw) : [];
  const nextProjects = [project, ...localProjects.filter((item) => item.id !== projectId)];
  await storage.setItem(STORAGE_KEY, JSON.stringify(nextProjects));
  await storage.setItem("@legend-ai/project-files/" + projectId, JSON.stringify(project.files || []));
  await storage.setItem(chatKey(projectId), JSON.stringify(project.messages || []));
  return project;
}

export async function mergeCloudProjectList(localProjects, cloudProjects) {
  if (!Array.isArray(cloudProjects)) return localProjects;
  const byId = new Map(localProjects.map((project) => [project.id, project]));
  for (const project of cloudProjects) if (!byId.has(project.id)) byId.set(project.id, project);
  return [...byId.values()];
}
