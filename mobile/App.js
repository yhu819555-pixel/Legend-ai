import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { readProjects } from "./src/projectStore.js";
import { createAndSaveProject } from "./src/projectActions.js";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      const savedProjects = await readProjects(AsyncStorage);
      setProjects(savedProjects);
    } catch {
      setError("Projects could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

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
      setActiveProject(result.project);
    } catch {
      setError("Project was not saved. Check device storage and retry.");
    } finally {
      setSaving(false);
    }
  }

  if (activeProject) {
    return (
      <SafeAreaView style={styles.screen}>
        <Pressable onPress={() => setActiveProject(null)} style={styles.back}>
          <Text style={styles.backText}>‹  All projects</Text>
        </Pressable>
        <Text style={styles.eyebrow}>PROJECT WORKSPACE</Text>
        <Text style={styles.heading}>{activeProject.name}</Text>
        <Text style={styles.muted}>Project created and saved on this device.</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Agent setup in progress</Text>
          <Text style={styles.muted}>AI chat, file tools and isolated command execution will be added only after their backend integrations are implemented and tested.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.eyebrow}>LEGEND AI</Text>
      <Text style={styles.heading}>Your AI workspace</Text>
      <Text style={styles.muted}>Create a project and pick up where you left off.</Text>

      <View style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Project name"
          placeholderTextColor="#78839a"
          style={styles.input}
          editable={!saving}
          returnKeyType="done"
          onSubmitEditing={handleCreateProject}
        />
        <Pressable onPress={handleCreateProject} disabled={saving} style={[styles.button, saving && styles.disabled]}>
          {saving ? <ActivityIndicator color="#07111f" /> : <Text style={styles.buttonText}>Create project</Text>}
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadProjects}><Text style={styles.retry}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Text style={styles.section}>YOUR PROJECTS</Text>
      {loading ? (
        <ActivityIndicator color="#8ea8ff" style={styles.loader} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={projects.length ? undefined : styles.empty}
          ListEmptyComponent={<Text style={styles.muted}>No projects yet. Create your first one above.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => setActiveProject(item)} style={styles.project}>
              <View style={styles.projectIcon}><Text style={styles.projectIconText}>⌘</Text></View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{item.name}</Text>
                <Text style={styles.projectDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          )}
        />
      )}
      <Text style={styles.footer}>Private by design · AI credentials stay on the server</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#09111f", padding: 24, paddingTop: 42 },
  eyebrow: { color: "#8ea8ff", fontSize: 12, fontWeight: "800", letterSpacing: 2, marginBottom: 12 },
  heading: { color: "#f4f7ff", fontSize: 30, fontWeight: "800", marginBottom: 8 },
  muted: { color: "#9ba8bf", fontSize: 14, lineHeight: 21 },
  form: { marginTop: 28, gap: 12 },
  input: { backgroundColor: "#131f32", borderColor: "#263651", borderWidth: 1, borderRadius: 14, padding: 16, color: "#fff", fontSize: 16 },
  button: { backgroundColor: "#a9bcff", padding: 16, borderRadius: 14, alignItems: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#09111f", fontSize: 15, fontWeight: "800" },
  section: { color: "#7585a2", fontSize: 11, fontWeight: "800", letterSpacing: 1.6, marginTop: 34, marginBottom: 14 },
  project: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#131f32", borderRadius: 14, marginBottom: 10 },
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
  back: { marginBottom: 30 },
  backText: { color: "#a9bcff", fontSize: 16, fontWeight: "700" },
  notice: { marginTop: 28, backgroundColor: "#131f32", borderRadius: 16, padding: 18, gap: 8 },
  noticeTitle: { color: "#f4f7ff", fontWeight: "800", fontSize: 16 },
  footer: { color: "#66758e", fontSize: 11, textAlign: "center", marginTop: 20, paddingBottom: 12 }
});
