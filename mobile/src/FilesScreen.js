import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createProjectFile, deleteProjectFile, readProjectFiles, saveProjectFile } from "./projectFiles.js";

export default function FilesScreen({ project }) {
  const [files, setFiles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try { setFiles(await readProjectFiles(AsyncStorage, project.id)); }
    catch { setError("Project files load nahi hui."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [project.id]);

  function newFile() {
    if (files.length >= 10) { setError("Ek project mein maximum 10 text files rakh sakte ho."); return; }
    setError("");
    setEditing({ id: "", name: "", content: "" });
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const file = editing.id
        ? { ...editing, updatedAt: new Date().toISOString() }
        : createProjectFile(editing.name, editing.content);
      const next = await saveProjectFile(AsyncStorage, project.id, file);
      setFiles(next);
      setEditing(null);
    } catch (cause) { setError(cause?.message || "File save nahi hui."); }
    finally { setSaving(false); }
  }

  function remove(file) {
    Alert.alert("Delete file?", file.name + " ko is project se delete karna hai?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { setFiles(await deleteProjectFile(AsyncStorage, project.id, file.id)); setEditing(null); }
        catch { setError("File delete nahi hui."); }
      } }
    ]);
  }

  if (editing) {
    return (
      <View style={styles.screen}>
        <Pressable onPress={() => setEditing(null)}><Text style={styles.back}>‹  Files</Text></Pressable>
        <Text style={styles.title}>{editing.id ? "Edit file" : "New file"}</Text>
        <Text style={styles.label}>FILE NAME</Text>
        <TextInput value={editing.name} onChangeText={(name) => setEditing({ ...editing, name })} placeholder="example.js" placeholderTextColor="#78839a" autoCapitalize="none" style={styles.nameInput} />
        <Text style={styles.label}>FILE CONTENT</Text>
        <TextInput value={editing.content} onChangeText={(content) => setEditing({ ...editing, content })} placeholder="Write or paste your project code here…" placeholderTextColor="#78839a" multiline textAlignVertical="top" style={styles.contentInput} />
        <Text style={styles.hint}>{editing.content.length}/6000 characters · Up to 10 files per project</Text>
        <Pressable onPress={save} disabled={saving} style={styles.primary}>
          {saving ? <ActivityIndicator color="#09111f" /> : <Text style={styles.primaryText}>Save file</Text>}
        </Pressable>
        {editing.id ? <Pressable onPress={() => remove(editing)} style={styles.delete}><Text style={styles.deleteText}>Delete file</Text></Pressable> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headingRow}>
        <View><Text style={styles.title}>Project files</Text><Text style={styles.subtitle}>{project.name} · {files.length}/10 files</Text></View>
        <Pressable onPress={newFile} style={styles.add}><Text style={styles.addText}>+ New</Text></Pressable>
      </View>
      <Text style={styles.description}>Text files saved in this project are shared with Legend AI as read-only context during chat.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#a9bcff" style={styles.loader} /> : (
        <FlatList data={files} keyExtractor={(item) => item.id} contentContainerStyle={files.length ? styles.list : styles.empty}
          ListEmptyComponent={<Text style={styles.emptyText}>No project files yet. Create a file to give AI code or notes to inspect.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => setEditing(item)} style={styles.file}>
              <View style={styles.fileIcon}><Text style={styles.fileIconText}>{"{ }"}</Text></View>
              <View style={styles.fileInfo}><Text style={styles.fileName}>{item.name}</Text><Text style={styles.filePreview} numberOfLines={1}>{item.content || "Empty file"}</Text></View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          )}
        />
      )}
      <Text style={styles.footnote}>Local project documents · Max 12,000 total characters sent as AI context</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#09111f", padding: 20 },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: "#f4f7ff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#91a0bb", fontSize: 11, marginTop: 4 },
  description: { color: "#9ba8bf", fontSize: 12, lineHeight: 19, marginTop: 12, marginBottom: 16 },
  add: { backgroundColor: "#a9bcff", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 11 },
  addText: { color: "#09111f", fontWeight: "900" },
  list: { gap: 9, paddingBottom: 20 },
  empty: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 22 },
  emptyText: { color: "#9ba8bf", textAlign: "center", lineHeight: 22 },
  file: { flexDirection: "row", alignItems: "center", padding: 13, backgroundColor: "#131f32", borderRadius: 13 },
  fileIcon: { width: 40, height: 40, backgroundColor: "#243454", borderRadius: 11, alignItems: "center", justifyContent: "center" },
  fileIconText: { color: "#b8c8ff", fontWeight: "900" },
  fileInfo: { flex: 1, marginLeft: 11 },
  fileName: { color: "#f4f7ff", fontWeight: "700", fontSize: 14 },
  filePreview: { color: "#8493ad", fontSize: 11, marginTop: 4 },
  arrow: { color: "#9ba8bf", fontSize: 24 },
  back: { color: "#a9bcff", fontSize: 15, fontWeight: "700", marginBottom: 24 },
  label: { color: "#91a0bb", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 18, marginBottom: 8 },
  nameInput: { color: "#fff", backgroundColor: "#131f32", borderColor: "#263651", borderWidth: 1, borderRadius: 12, padding: 14 },
  contentInput: { flex: 1, minHeight: 180, color: "#fff", backgroundColor: "#131f32", borderColor: "#263651", borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 20 },
  hint: { color: "#7889a5", fontSize: 10, marginTop: 8 },
  primary: { backgroundColor: "#a9bcff", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 14 },
  primaryText: { color: "#09111f", fontWeight: "900" },
  delete: { padding: 14, alignItems: "center" },
  deleteText: { color: "#ffb6c5", fontWeight: "700" },
  error: { color: "#ffc0ce", fontSize: 12, marginTop: 10 },
  loader: { marginTop: 24 },
  footnote: { color: "#66758e", fontSize: 10, textAlign: "center", paddingTop: 10 }
});
