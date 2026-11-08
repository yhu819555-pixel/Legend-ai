import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { readProjects, deleteProject } from "./src/projectStore.js";
import { createAndSaveProject } from "./src/projectActions.js";
import { createBackup, restoreBackup } from "./src/backup.js";
import { pickBackupFile, shareBackupFile } from "./src/nativeFiles.js";
import ChatScreen from "./src/ChatScreen.js";
import FilesScreen from "./src/FilesScreen.js";
import SettingsScreen from "./src/SettingsScreen.js";
import { getGitHubConfig, testGitHubConnection, pushProjectToGitHub, pullProjectFromGitHub, GITHUB_SETTING_KEYS } from "./src/githubSync.js";
import {
  paletteFor, ScreenHeader, HomeDashboard, ProjectsView, WorkspaceView,
  UnavailableView, TerminalView, PreviewView, GitHubOverview, MoreMenu, BottomNavigation, CreateProjectModal,
  ToolsView
} from "./src/Phase2UI.js";

const THEME_KEY = "@legend-ai/theme";
const API_KEY = "legend_ai_provider_api_key";
const MODEL_KEY = "legend_ai_model";
const ROUTE_TITLES = {
  home: "Home", projects: "Projects", chat: "AI Chat", workspace: "Agent Workspace",
  editor: "Code Editor", terminal: "Terminal", preview: "Preview", github: "GitHub",
  tools: "Tools", settings: "Settings", more: "More"
};

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [screen, setScreen] = useState("home");
  const [settingsReturn, setSettingsReturn] = useState("more");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [github, setGithub] = useState(null);
  const [githubBusy, setGithubBusy] = useState(false);
  const colors = paletteFor(theme);

  async function loadProjects() {
    setLoading(true);
    setError("");
    try { setProjects(await readProjects(AsyncStorage)); }
    catch { setError("Projects could not be loaded. Please retry."); }
    finally { setLoading(false); }
  }

  async function refreshConnections() {
    try {
      const [key, savedModel, config, token, owner, repo, branch] = await Promise.all([
        SecureStore.getItemAsync(API_KEY), SecureStore.getItemAsync(MODEL_KEY),
        getGitHubConfig(), SecureStore.getItemAsync(GITHUB_SETTING_KEYS.token),
        SecureStore.getItemAsync(GITHUB_SETTING_KEYS.owner), SecureStore.getItemAsync(GITHUB_SETTING_KEYS.repo),
        SecureStore.getItemAsync(GITHUB_SETTING_KEYS.branch)
      ]);
      setHasApiKey(Boolean(key));
      setModel(savedModel || "gpt-4.1-mini");
      setGithub(token ? { connected: true, owner: owner || "", repo: repo || "", branch: branch || "main", config } : null);
    } catch {}
  }

  useEffect(() => {
    loadProjects();
    Promise.all([AsyncStorage.getItem(THEME_KEY), refreshConnections()]).then(([savedTheme]) => {
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    }).catch(() => {});
  }, []);

  async function changeTheme(next) {
    setTheme(next);
    try { await AsyncStorage.setItem(THEME_KEY, next); } catch { setError("Theme preference could not be saved."); }
  }

  async function handleCreateProject(projectName) {
    const cleanName = String(projectName || "").trim();
    if (!cleanName) return;
    setCreating(true);
    setError("");
    try {
      const result = await createAndSaveProject(AsyncStorage, projects, cleanName);
      setProjects(result.projects);
      setActiveProject(result.project);
      setShowCreate(false);
      setScreen("chat");
    } catch { setError("Project was not saved. Check device storage and retry."); }
    finally { setCreating(false); }
  }

  function handleDeleteProject(project) {
    Alert.alert("Delete project?", project.name + " and its local files/chat history will be deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const next = await deleteProject(AsyncStorage, projects, project.id);
          setProjects(next);
          if (activeProject?.id === project.id) setActiveProject(null);
        } catch { setError("Project could not be deleted."); }
      } }
    ]);
  }

  async function handleExportBackup() {
    setBackupBusy(true);
    try { await shareBackupFile(await createBackup(AsyncStorage)); }
    catch (cause) { Alert.alert("Backup failed", cause?.message || "Backup export failed."); }
    finally { setBackupBusy(false); }
  }

  async function handleImportBackupFile() {
    setBackupBusy(true);
    try {
      const source = await pickBackupFile();
      if (source !== null) {
        const result = await restoreBackup(AsyncStorage, source);
        setProjects(result.projects);
        Alert.alert("Backup restored", result.restoredCount + " project(s) restored.");
      }
    } catch (cause) { Alert.alert("Import failed", cause?.message || "Check the backup JSON file."); }
    finally { setBackupBusy(false); }
  }

  function openSettings() {
    setSettingsReturn(screen);
    setScreen("settings");
  }

  async function runGitHubSync(direction) {
    if (!activeProject) { Alert.alert("Open a project first", "Select a project before syncing its files."); return; }
    if (direction === "pull") {
      Alert.alert("Pull project files?", "Files with the same name may be replaced on this phone. Export a backup first if needed.", [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", style: "destructive", onPress: () => performGitHubSync("pull") }
      ]);
      return;
    }
    await performGitHubSync(direction);
  }

  async function performGitHubSync(direction) {
    setGithubBusy(true);
    setError("");
    try {
      const config = await getGitHubConfig();
      if (!config) throw new Error("GitHub is not connected or a repository has not been configured. Open Settings → Optional GitHub backup.");
      const repository = await testGitHubConnection({ config });
      if (direction === "push") {
        const result = await pushProjectToGitHub(activeProject, AsyncStorage, { config });
        Alert.alert("Backup pushed", result.pushed + " file(s) saved to " + repository.fullName + ".");
      } else {
        const result = await pullProjectFromGitHub(activeProject, AsyncStorage, { config });
        await loadProjects();
        Alert.alert("Backup pulled", result.pulled + " file(s) imported from " + repository.fullName + ".");
      }
      await refreshConnections();
    } catch (cause) { Alert.alert("GitHub sync unavailable", cause?.message || "Could not sync this project."); }
    finally { setGithubBusy(false); }
  }

  const openProject = (project) => { setActiveProject(project); setScreen("chat"); };
  const navigate = (route) => {
    if (route === "settings") { openSettings(); return; }
    setScreen(route);
  };

  let body;
  if (screen === "home") {
    body = <HomeDashboard projects={projects} model={hasApiKey ? model : "API key needed"} colors={colors}
      onCreate={() => setShowCreate(true)} onOpen={openProject} onNavigate={navigate} onSettings={openSettings}/>;
  } else if (screen === "projects") {
    body = loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }}/> :
      <ProjectsView projects={projects} colors={colors} onOpen={openProject} onDelete={handleDeleteProject} onCreate={() => setShowCreate(true)}/>;
  } else if (screen === "chat") {
    body = activeProject ? <ChatScreen project={activeProject} theme={theme} onOpenSettings={openSettings}/> :
      <UnavailableView colors={colors} title="Choose a project" subtitle="AI Chat works inside a project so it can use your local files as context." details="Open Projects and choose a project, or create a new one from Home."/>;
  } else if (screen === "workspace") {
    body = <WorkspaceView colors={colors} project={activeProject}/>;
  } else if (screen === "editor") {
    body = activeProject ? <FilesScreen project={activeProject} onOpenSettings={openSettings} theme={theme}/> :
      <UnavailableView colors={colors} title="No project selected" subtitle="The code editor opens files from a local project." details="Open or create a project first."/>;
  } else if (screen === "terminal") {
    body = <TerminalView colors={colors}/>;
  } else if (screen === "preview") {
    body = <PreviewView colors={colors}/>;
  } else if (screen === "github") {
    body = <GitHubOverview colors={colors} connected={Boolean(github?.connected)} owner={github?.owner} repo={github?.repo} branch={github?.branch}
      onConnect={openSettings} onPush={() => runGitHubSync("push")} onPull={() => runGitHubSync("pull")}
      project={activeProject} busy={githubBusy}/>;
  } else if (screen === "tools") {
    body = <ToolsView colors={colors}/>;
  } else if (screen === "settings") {
    body = <View style={{ flex: 1 }}>
      <View style={[styles.themeStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontWeight: "800" }}>Appearance</Text>
        <View style={{ flexDirection: "row", gap: 7 }}>
          <Pressable onPress={() => changeTheme("dark")} style={[styles.themeOption, { backgroundColor: theme === "dark" ? colors.accent : colors.surface2 }]}><Text style={{ color: theme === "dark" ? "#071020" : colors.text, fontWeight: "800", fontSize: 11 }}>Dark</Text></Pressable>
          <Pressable onPress={() => changeTheme("light")} style={[styles.themeOption, { backgroundColor: theme === "light" ? colors.accent : colors.surface2 }]}><Text style={{ color: theme === "light" ? "#071020" : colors.text, fontWeight: "800", fontSize: 11 }}>Light</Text></Pressable>
        </View>
      </View>
      <SettingsScreen theme={theme} onBack={() => { setScreen(settingsReturn); refreshConnections(); }}/>
    </View>;
  } else {
    body = <MoreMenu colors={colors} onNavigate={navigate} current={screen}/>;
  }

  const showHeader = !["chat", "editor", "settings"].includes(screen);
  return <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
    {showHeader ? <ScreenHeader title={ROUTE_TITLES[screen] || "MY AI AGENT"} subtitle={screen === "home" ? "A focused workspace for building with AI" : activeProject ? activeProject.name : "Local-first · Mobile workspace"} colors={colors}
      right={<Pressable onPress={openSettings} style={[styles.headerSettings, { backgroundColor: colors.surface2 }]}><Text style={{ color: colors.accent, fontWeight: "800" }}>⚙</Text></Pressable>}/> : null}
    {error ? <Pressable onPress={() => { setError(""); if (screen === "projects") loadProjects(); }} style={[styles.errorBar, { backgroundColor: theme === "dark" ? "#3A1E2C" : "#FCE8EC" }]}><Text style={{ color: colors.danger, fontSize: 12 }}>{error}  ·  Tap to dismiss</Text></Pressable> : null}
    {loading && screen === "home" ? <ActivityIndicator color={colors.accent} style={{ marginTop: 8 }}/> : body}
    {screen === "home" ? <View style={styles.backupActions}>
      <Pressable onPress={handleExportBackup} disabled={backupBusy} style={[styles.backupAction, { backgroundColor: colors.surface2 }]}><Text style={{ color: colors.text, fontSize: 11, fontWeight: "700" }}>{backupBusy ? "Please wait…" : "Export backup"}</Text></Pressable>
      <Pressable onPress={handleImportBackupFile} disabled={backupBusy} style={[styles.backupAction, { backgroundColor: colors.surface2 }]}><Text style={{ color: colors.text, fontSize: 11, fontWeight: "700" }}>Import backup</Text></Pressable>
    </View> : null}
    <BottomNavigation colors={colors} current={screen} onNavigate={navigate}/>
    <CreateProjectModal visible={showCreate} colors={colors} busy={creating} onCancel={() => setShowCreate(false)} onCreate={handleCreateProject}/>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerSettings: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  errorBar: { paddingHorizontal: 14, paddingVertical: 9, marginHorizontal: 18, borderRadius: 10 },
  backupActions: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingVertical: 7 },
  backupAction: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
  themeStrip: { marginHorizontal: 18, marginBottom: 8, borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  themeOption: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 9 }
});
