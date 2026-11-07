import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Pressable, SafeAreaView,
  StyleSheet, Text, TextInput, View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { readProjects } from "./src/projectStore.js";
import { createAndSaveProject } from "./src/projectActions.js";
import { ensureCloudProject, listCloudProjects, mergeCloudProjectList, deleteCloudProject } from "./src/projectSync.js";
import { STORAGE_KEY, deleteProject } from "./src/projectStore.js";
import { createBackup, restoreBackup } from "./src/backup.js";
import { pickBackupFile, shareBackupFile } from "./src/nativeFiles.js";
import ChatScreen from "./src/ChatScreen.js";
import FilesScreen from "./src/FilesScreen.js";
import SettingsScreen from "./src/SettingsScreen.js";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [activeProject, setActiveProject] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState("chat");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      const localProjects = await readProjects(AsyncStorage);
      setProjects(localProjects);
      try {
        const cloudProjects = await listCloudProjects();
        if (cloudProjects) {
          const merged = await mergeCloudProjectList(localProjects, cloudProjects);
          setProjects(merged);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          const cloudIds = new Set(cloudProjects.map((project) => project.id));
          for (const project of localProjects) {
            if (cloudIds.has(project.id)) continue;
            try { await ensureCloudProject(project, AsyncStorage); }
            catch { /* Keep local work available when cloud sync is unavailable. */ }
          }
        }
      } catch { setError("Cloud sync abhi available nahi hai; local projects safe hain."); }
    }
    catch { setError("Projects could not be loaded. Please retry."); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProjects(); }, []);

  async function handleExportBackup() {
    setBackupBusy(true);
    try {
      const backup = await createBackup(AsyncStorage);
      await shareBackupFile(backup);
    } catch (cause) {
      Alert.alert("Backup failed", cause?.message || "Backup export nahi ho paya.");
    }
    finally { setBackupBusy(false); }
  }

  async function restoreAndSyncBackup(source) {
    const result = await restoreBackup(AsyncStorage, source);
    setProjects(result.projects);
    setBackupText("");
    setShowImport(false);
    for (const project of result.projects) {
      try { await ensureCloudProject(project, AsyncStorage); } catch { /* Local restore remains valid offline. */ }
    }
    Alert.alert("Backup restored", result.restoredCount + " project(s) restore ho gaye.");
  }

  async function handleImportBackupFile() {
    setBackupBusy(true);
    try {
      const source = await pickBackupFile();
      if (source !== null) await restoreAndSyncBackup(source);
    } catch (cause) {
      Alert.alert("Import failed", cause?.message || "Backup JSON check karo.");
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleImportBackup() {
    setBackupBusy(true);
    try {
      await restoreAndSyncBackup(backupText);
    } catch (cause) {
      Alert.alert("Import failed", cause?.message || "Backup JSON check karo.");
    } finally { setBackupBusy(false); }
  }

  function handleDeleteProject(project) {
    Alert.alert("Delete project?", project.name + " aur uski local files/chat history delete ho jayegi.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const next = await deleteProject(AsyncStorage, projects, project.id);
          setProjects(next);
          try { await deleteCloudProject(project.id); }
          catch { setError("Project device se delete ho gaya; cloud copy delete nahi hui."); }
        } catch { setError("Project delete nahi ho paya."); }
      } }
    ]);
  }

  async function handleCreateProject() {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert("Project name required", "Enter a name to create a project.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await createAndSaveProject(AsyncStorage, projects, cleanName);
      setProjects(result.projects);
      setName("");
      setWorkspaceTab("chat");
      setActiveProject(result.project);
      try { await ensureCloudProject(result.project, AsyncStorage); }
      catch { setError("Project device par save hai, lekin cloud sync pending hai."); }
    } catch { setError("Project was not saved. Check device storage and retry."); }
    finally { setSaving(false); }
  }

  if (showSettings) return <SafeAreaView style={styles.workspace}><SettingsScreen onBack={() => setShowSettings(false)} /></SafeAreaView>;

  if (activeProject) {
    return (
      <SafeAreaView style={styles.workspace}>
        <View style={styles.workspaceTop}>
          <Pressable onPress={() => setActiveProject(null)}><Text style={styles.backText}>‹ Projects</Text></Pressable>
          <View style={styles.tabs}>
            <Pressable onPress={() => setWorkspaceTab("chat")} style={[styles.tab, workspaceTab === "chat" && styles.activeTab]}><Text style={[styles.tabText, workspaceTab === "chat" && styles.activeTabText]}>Chat</Text></Pressable>
            <Pressable onPress={() => setWorkspaceTab("files")} style={[styles.tab, workspaceTab === "files" && styles.activeTab]}><Text style={[styles.tabText, workspaceTab === "files" && styles.activeTabText]}>Files</Text></Pressable>
          </View>
          <Pressable onPress={() => setShowSettings(true)}><Text style={styles.settingsLink}>Settings</Text></Pressable>
        </View>
        {workspaceTab === "chat" ? <ChatScreen project={activeProject} /> : <FilesScreen project={activeProject} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>LEGEND AI</Text>
        <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}><Text style={styles.settingsText}>⚙ Settings</Text></Pressable>
      </View>
      <Text style={styles.heading}>Your AI workspace</Text>
      <Text style={styles.muted}>Create a project and start a conversation with your AI agent.</Text>
      <View style={styles.form}>
        <TextInput value={name} onChangeText={setName} placeholder="Project name" placeholderTextColor="#78839a" style={styles.input} editable={!saving} returnKeyType="done" onSubmitEditing={handleCreateProject} />
        <Pressable onPress={handleCreateProject} disabled={saving} style={[styles.button, saving && styles.disabled]}>
          {saving ? <ActivityIndicator color="#07111f" /> : <Text style={styles.buttonText}>Create project</Text>}
        </Pressable>
      </View>
      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><Pressable onPress={loadProjects}><Text style={styles.retry}>Retry</Text></Pressable></View> : null}
      <View style={styles.backupRow}>
        <Pressable onPress={handleExportBackup} disabled={backupBusy} style={styles.backupButton}>
          <Text style={styles.backupButtonText}>{backupBusy ? "Please wait…" : "Export backup file"}</Text>
        </Pressable>
        <Pressable onPress={() => setShowImport((value) => !value)} disabled={backupBusy} style={styles.backupButton}>
          <Text style={styles.backupButtonText}>Import backup</Text>
        </Pressable>
      </View>
      {showImport ? (
        <View style={styles.importPanel}>
          <Text style={styles.importHint}>Choose a saved Legend AI backup JSON file, or paste its contents below. Existing projects with the same ID will be replaced by the backup.</Text>
          <Pressable onPress={handleImportBackupFile} disabled={backupBusy} style={styles.importButton}>
            <Text style={styles.importButtonText}>{backupBusy ? "Please wait…" : "Choose backup file"}</Text>
          </Pressable>
          <TextInput value={backupText} onChangeText={setBackupText} multiline textAlignVertical="top" placeholder="Or paste backup JSON…" placeholderTextColor="#78839a" style={styles.backupInput} />
          <Pressable onPress={handleImportBackup} disabled={backupBusy || !backupText.trim()} style={styles.importButton}>
            <Text style={styles.importButtonText}>Restore pasted backup</Text>
          </Pressable>
        </View>
      ) : null}
      <Text style={styles.section}>YOUR PROJECTS</Text>
      {loading ? <ActivityIndicator color="#8ea8ff" style={styles.loader} /> : (
        <FlatList data={projects} keyExtractor={(item) => item.id} contentContainerStyle={projects.length ? undefined : styles.empty}
          ListEmptyComponent={<Text style={styles.muted}>No projects yet. Create your first one above.</Text>}
          renderItem={({ item }) => (
            <View style={styles.project}>
              <Pressable onPress={() => { setWorkspaceTab("chat"); setActiveProject(item); }} style={styles.projectOpen}>
                <View style={styles.projectIcon}><Text style={styles.projectIconText}>⌘</Text></View>
                <View style={styles.projectInfo}><Text style={styles.projectName}>{item.name}</Text><Text style={styles.projectDate}>{new Date(item.createdAt).toLocaleDateString()}</Text></View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
              <Pressable onPress={() => handleDeleteProject(item)} style={styles.projectDelete}><Text style={styles.projectDeleteText}>Delete</Text></Pressable>
            </View>
          )}
        />
      )}
      <Text style={styles.footer}>Private by design · AI provider key stays on the server</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#09111f", padding: 24, paddingTop: 42 },
  workspace: { flex: 1, backgroundColor: "#09111f", paddingTop: 36 },
  workspaceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  backText: { color: "#a9bcff", fontSize: 14, fontWeight: "700" },
  settingsLink: { color: "#a9bcff", fontSize: 13, fontWeight: "700" },
  tabs: { flexDirection: "row", backgroundColor: "#131f32", padding: 3, borderRadius: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  activeTab: { backgroundColor: "#a9bcff" },
  tabText: { color: "#9ba8bf", fontSize: 12, fontWeight: "700" },
  activeTabText: { color: "#09111f" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: "#8ea8ff", fontSize: 12, fontWeight: "800", letterSpacing: 2, marginBottom: 12 },
  settingsButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#172640", marginBottom: 10 },
  settingsText: { color: "#c3d0f2", fontWeight: "700", fontSize: 12 },
  heading: { color: "#f4f7ff", fontSize: 30, fontWeight: "800", marginBottom: 8 },
  muted: { color: "#9ba8bf", fontSize: 14, lineHeight: 21 },
  form: { marginTop: 28, gap: 12 },
  input: { backgroundColor: "#131f32", borderColor: "#263651", borderWidth: 1, borderRadius: 14, padding: 16, color: "#fff", fontSize: 16 },
  button: { backgroundColor: "#a9bcff", padding: 16, borderRadius: 14, alignItems: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#09111f", fontSize: 15, fontWeight: "800" },
  backupRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  backupButton: { flex: 1, backgroundColor: "#172640", padding: 12, borderRadius: 11, alignItems: "center" },
  backupButtonText: { color: "#c3d0f2", fontWeight: "700", fontSize: 12 },
  importPanel: { backgroundColor: "#131f32", borderRadius: 12, padding: 12, marginTop: 10, gap: 8 },
  importHint: { color: "#9ba8bf", fontSize: 11, lineHeight: 17 },
  backupInput: { minHeight: 100, maxHeight: 180, borderColor: "#263651", borderWidth: 1, borderRadius: 9, padding: 10, color: "#fff", fontSize: 11 },
  importButton: { backgroundColor: "#a9bcff", padding: 12, borderRadius: 9, alignItems: "center" },
  importButtonText: { color: "#09111f", fontWeight: "800" },
  section: { color: "#7585a2", fontSize: 11, fontWeight: "800", letterSpacing: 1.6, marginTop: 34, marginBottom: 14 },
  project: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#131f32", borderRadius: 14, marginBottom: 10 },
  projectOpen: { flexDirection: "row", alignItems: "center", flex: 1, padding: 4 },
  projectDelete: { paddingHorizontal: 9, paddingVertical: 8 },
  projectDeleteText: { color: "#ffb6c5", fontSize: 11, fontWeight: "700" },
  projectIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#243454", alignItems: "center", justifyContent: "center" },
  projectIconText: { color: "#b8c8ff", fontSize: 21, fontWeight: "700" },
  projectInfo: { flex: 1, marginLeft: 12 },
  projectName: { color: "#f4f7ff", fontSize: 15, fontWeight: "700" },
  projectDate: { color: "#8493ad", fontSize: 12, marginTop: 4 },
  arrow: { color: "#9ba8bf", fontSize: 25 },
  empty: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingBottom: 70 },
  loader: { marginTop: 30 },
  errorBox: { marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: "#3b1e2b" },
  errorText: { color: "#ffd4dc" },
  retry: { color: "#ffc0ce", fontWeight: "800", marginTop: 8 },
  footer: { color: "#66758e", fontSize: 11, textAlign: "center", marginTop: 20, paddingBottom: 12 }
});
