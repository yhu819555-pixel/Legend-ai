import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const URL_KEY = "legend_ai_backend_url";
const TOKEN_KEY = "legend_ai_backend_token";

export default function SettingsScreen({ onBack }) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([AsyncStorage.getItem(URL_KEY), SecureStore.getItemAsync(TOKEN_KEY)])
      .then(([savedUrl, savedToken]) => {
        if (!mounted) return;
        setUrl(savedUrl || "");
        setHasToken(Boolean(savedToken));
      })
      .catch(() => { if (mounted) setMessage("Saved settings read nahi ho paayi."); });
    return () => { mounted = false; };
  }, []);

  async function save() {
    const cleanUrl = url.trim().replace(/\/+$/, "");
    let parsedUrl;
    try { parsedUrl = new URL(cleanUrl); } catch { parsedUrl = null; }
    if (!parsedUrl || !["https:", "http:"].includes(parsedUrl.protocol) || !parsedUrl.hostname ||
        parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
      setMessage("Valid backend base URL dalo, jaise https://your-api.example.com.");
      return;
    }
    if (!token.trim() && !hasToken) {
      setMessage("Backend access token dalo.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await AsyncStorage.setItem(URL_KEY, cleanUrl);
      if (token.trim()) await SecureStore.setItemAsync(TOKEN_KEY, token.trim());
      setToken("");
      setHasToken(true);
      setMessage("Settings is device par securely save ho gayi.");
    } catch {
      setMessage("Settings save nahi hui. Dobara try karo.");
    } finally {
      setSaving(false);
    }
  }

  async function clearToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setHasToken(false);
      setToken("");
      setMessage("Device se saved access token hata diya.");
    } catch { setMessage("Token remove nahi ho paya."); }
  }

  return (
    <View style={styles.screen}>
      <Pressable onPress={onBack}><Text style={styles.back}>‹  Back</Text></Pressable>
      <Text style={styles.eyebrow}>CONNECTION</Text>
      <Text style={styles.title}>Backend settings</Text>
      <Text style={styles.description}>Apne deployed backend ka URL aur APP_API_TOKEN yahan set karo. OpenAI API key APK mein mat daalna; woh backend secret hi rahegi.</Text>
      <Text style={styles.label}>BACKEND URL</Text>
      <TextInput value={url} onChangeText={setUrl} placeholder="https://your-api.example.com" placeholderTextColor="#78839a" autoCapitalize="none" keyboardType="url" style={styles.input} />
      <Text style={styles.label}>BACKEND ACCESS TOKEN</Text>
      <TextInput value={token} onChangeText={setToken} placeholder={hasToken ? "Saved securely — enter new token to replace" : "Paste APP_API_TOKEN"} placeholderTextColor="#78839a" autoCapitalize="none" secureTextEntry style={styles.input} />
      <Text style={styles.hint}>{hasToken ? "A token is saved in Android SecureStore." : "No token saved on this device yet."}</Text>
      <Pressable onPress={save} disabled={saving} style={styles.button}>
        {saving ? <ActivityIndicator color="#09111f" /> : <Text style={styles.buttonText}>Save connection</Text>}
      </Pressable>
      {hasToken ? <Pressable onPress={clearToken} style={styles.clear}><Text style={styles.clearText}>Remove saved token</Text></Pressable> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#09111f", padding: 24, paddingTop: 42 },
  back: { color: "#a9bcff", fontSize: 16, fontWeight: "700", marginBottom: 28 },
  eyebrow: { color: "#8ea8ff", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 10 },
  title: { color: "#f4f7ff", fontSize: 29, fontWeight: "800", marginBottom: 10 },
  description: { color: "#9ba8bf", lineHeight: 21, marginBottom: 28 },
  label: { color: "#91a0bb", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#131f32", borderColor: "#263651", borderWidth: 1, borderRadius: 13, padding: 15, color: "#fff", fontSize: 14 },
  hint: { color: "#7889a5", fontSize: 11, marginTop: 8 },
  button: { marginTop: 26, backgroundColor: "#a9bcff", borderRadius: 13, padding: 16, alignItems: "center" },
  buttonText: { color: "#09111f", fontWeight: "900" },
  clear: { padding: 15, alignItems: "center" },
  clearText: { color: "#ffb6c5", fontWeight: "700" },
  message: { color: "#c7d3ef", fontSize: 12, marginTop: 14 }
});
