import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { sendChatMessage } from "./chatClient.js";
import { readProjectFiles } from "./projectFiles.js";

const historyKey = (projectId) => "@legend-ai/chat/" + projectId;
const URL_KEY = "legend_ai_backend_url";
const TOKEN_KEY = "legend_ai_backend_token";

export default function ChatScreen({ project }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(historyKey(project.id))
      .then((raw) => { if (mounted && raw) setMessages(JSON.parse(raw)); })
      .catch(() => { if (mounted) setError("Chat history load nahi hui."); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, [project.id]);

  async function send() {
    const content = draft.trim();
    if (!content || busy) return;
    setDraft("");
    setError("");
    const userMessage = { id: String(Date.now()), role: "user", content };
    const next = [...messages, userMessage];
    const assistantId = String(Date.now() + 1);
    const pending = [...next, { id: assistantId, role: "assistant", content: "" }];
    setMessages(pending);
    setBusy(true);
    try {
      await AsyncStorage.setItem(historyKey(project.id), JSON.stringify(next));
      const baseUrl = await AsyncStorage.getItem(URL_KEY);
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const projectFiles = await readProjectFiles(AsyncStorage, project.id);
      const answer = await sendChatMessage({
        baseUrl, token,
        messages: next.map(({ role, content: text }) => ({ role, content: text })),
        projectFiles,
        onDelta: (delta) => setMessages((current) => current.map((item) =>
          item.id === assistantId ? { ...item, content: item.content + delta } : item
        ))
      });
      const completed = [...next, { id: assistantId, role: "assistant", content: answer }];
      setMessages(completed);
      await AsyncStorage.setItem(historyKey(project.id), JSON.stringify(completed));
    } catch (cause) {
      setMessages(next);
      setError(cause?.message || "Message send nahi hua. Connection check karo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Chat</Text>
        <Text style={styles.subtitle}>{project.name} · Project files are included as context</Text>
      </View>
      {!ready ? <ActivityIndicator color="#a9bcff" style={styles.loader} /> : (
        <FlatList
          style={styles.list}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={messages.length ? styles.messageList : styles.empty}
          ListEmptyComponent={<Text style={styles.emptyText}>Namaste! Is project ke baare mein AI se kuch bhi poochho.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
              <Text style={styles.role}>{item.role === "user" ? "YOU" : "LEGEND AI"}</Text>
              <Text style={styles.message}>{item.content || (busy ? "…" : "")}</Text>
            </View>
          )}
        />
      )}
      {busy ? <View style={styles.waiting}><ActivityIndicator color="#a9bcff" /><Text style={styles.waitText}>AI soch raha hai…</Text></View> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.composer}>
        <TextInput value={draft} onChangeText={setDraft} placeholder="Message Legend AI…" placeholderTextColor="#78839a" style={styles.input} multiline editable={!busy} />
        <Pressable onPress={send} disabled={busy || !draft.trim()} style={[styles.send, (busy || !draft.trim()) && styles.disabled]}>
          <Text style={styles.sendText}>↑</Text>
        </Pressable>
      </View>
      <Text style={styles.footnote}>History and project files are stored on this device. AI keys remain on your backend.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09111f" },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1d2b43" },
  title: { color: "#f4f7ff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#91a0bb", fontSize: 11, marginTop: 3 },
  list: { flex: 1 },
  messageList: { padding: 16, gap: 12 },
  empty: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { color: "#9ba8bf", textAlign: "center", lineHeight: 22 },
  bubble: { maxWidth: "88%", padding: 13, borderRadius: 15, gap: 6 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#26385d" },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "#131f32" },
  role: { color: "#9eb4ff", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  message: { color: "#f4f7ff", fontSize: 15, lineHeight: 22 },
  composer: { flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 9, borderTopWidth: 1, borderTopColor: "#1d2b43" },
  input: { flex: 1, maxHeight: 110, minHeight: 48, color: "#fff", backgroundColor: "#131f32", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  send: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#a9bcff" },
  sendText: { color: "#09111f", fontSize: 25, fontWeight: "900" },
  disabled: { opacity: 0.45 },
  waiting: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 18, paddingBottom: 8 },
  waitText: { color: "#a9bcff", fontSize: 12 },
  error: { color: "#ffc0ce", paddingHorizontal: 16, paddingBottom: 8, fontSize: 12 },
  footnote: { color: "#66758e", fontSize: 10, textAlign: "center", paddingBottom: 7 }
});
