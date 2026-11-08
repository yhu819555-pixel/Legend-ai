import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export const paletteFor = (mode = "dark") => mode === "light"
  ? { bg: "#F3F6FC", surface: "#FFFFFF", surface2: "#E9EFF9", border: "#D9E2F0", text: "#17233B", muted: "#65738D", accent: "#4267E8", accent2: "#7654D6", good: "#16865B", warning: "#A66A13", danger: "#C0445B" }
  : { bg: "#080D19", surface: "#111A2B", surface2: "#18243A", border: "#273650", text: "#F3F6FF", muted: "#91A0BA", accent: "#8EA8FF", accent2: "#B29AFF", good: "#71D6A3", warning: "#F0BD70", danger: "#FF9AAA" };


export function CreateProjectModal({ visible, colors, onCancel, onCreate, busy }) {
  const [name, setName] = useState("");
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalShade}>
      <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Create a project</Text>
        <Text style={{ color: colors.muted, lineHeight: 19 }}>Give your workspace a name. It will be saved on this phone.</Text>
        <TextInput autoFocus value={name} onChangeText={setName} placeholder="e.g. My first app" placeholderTextColor={colors.muted} style={[styles.search, { color: colors.text, backgroundColor: colors.surface2, borderColor: colors.border, marginTop: 4, marginBottom: 4 }]}/>
        <View style={styles.row}>
          <ActionButton label="Cancel" onPress={onCancel} colors={colors} secondary/>
          <ActionButton label={busy ? "Creating…" : "Create project"} onPress={() => onCreate(name)} colors={colors} disabled={busy || !name.trim()}/>
        </View>
      </View>
    </View>
  </Modal>;
}

export function ScreenHeader({ title, subtitle, onBack, right, colors }) {
  return <View style={styles.header}>
    <View style={styles.headerLine}>
      <View style={{ flex: 1 }}>
        {onBack ? <Pressable onPress={onBack} hitSlop={10}><Text style={[styles.back, { color: colors.accent }]}>‹  Back</Text></Pressable> : null}
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.headerSub, { color: colors.muted }]}>{subtitle}</Text> : null}
      </View>
      {right || null}
    </View>
  </View>;
}

export function Surface({ children, colors, style }) {
  return <View style={[styles.surface, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

export function ActionButton({ label, onPress, colors, secondary = false, disabled = false, compact = false }) {
  return <Pressable onPress={onPress} disabled={disabled || !onPress} style={({ pressed }) => [
    styles.actionButton,
    { backgroundColor: secondary ? colors.surface2 : colors.accent, borderColor: secondary ? colors.border : colors.accent, opacity: disabled ? 0.48 : pressed ? 0.82 : 1, paddingVertical: compact ? 9 : 13 }
  ]}>
    <Text style={{ color: secondary ? colors.text : "#071020", fontWeight: "800", fontSize: compact ? 12 : 14 }}>{label}</Text>
  </Pressable>;
}

export function HomeDashboard({ projects, model, colors, onCreate, onOpen, onNavigate, onSettings }) {
  const recent = projects.slice(0, 3);
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
    <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.brand, { color: colors.accent }]}>✦  MY AI AGENT</Text>
      <Text style={[styles.heroTitle, { color: colors.text }]}>Your mobile coding workspace.</Text>
      <Text style={[styles.body, { color: colors.muted }]}>Plan ideas, build project files with AI, and keep your work organized on this device.</Text>
      <View style={styles.row}>
        <ActionButton label="+  New project" onPress={onCreate} colors={colors}/>
        <ActionButton label="Open projects" onPress={() => onNavigate("projects")} colors={colors} secondary/>
      </View>
    </View>
    <View style={styles.sectionRow}><Text style={[styles.sectionTitle, { color: colors.text }]}>Workspace overview</Text><Pressable onPress={onSettings}><Text style={{ color: colors.accent, fontWeight: "700" }}>Settings</Text></Pressable></View>
    <View style={styles.stats}>
      <Surface colors={colors} style={styles.stat}><Text style={[styles.statNumber, { color: colors.text }]}>{projects.length}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Projects</Text></Surface>
      <Surface colors={colors} style={styles.stat}><Text style={[styles.statNumber, { color: colors.text }]}>On device</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Storage</Text></Surface>
      <Surface colors={colors} style={styles.stat}><Text style={[styles.statNumber, { color: colors.good }]}>Ready</Text><Text style={[styles.statLabel, { color: colors.muted }]}>AI setup: {model}</Text></Surface>
    </View>
    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Quick actions</Text>
    <View style={styles.quickGrid}>
      {[
        ["AI Chat", "chat", "Ask AI about your project"],
        ["Agent workspace", "workspace", "Prepare a task plan"],
        ["Code editor", "editor", "Browse and edit files"],
        ["GitHub backup", "github", "Sync project files"]
      ].map(([label, route, hint]) => <Pressable key={route} onPress={() => onNavigate(route)} style={[styles.quick, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.accent2, fontSize: 18, fontWeight: "900" }}>✧</Text>
        <Text style={[styles.quickTitle, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.quickHint, { color: colors.muted }]}>{hint}</Text>
      </Pressable>)}
    </View>
    <View style={styles.sectionRow}><Text style={[styles.sectionTitle, { color: colors.text }]}>Recent projects</Text><Pressable onPress={() => onNavigate("projects")}><Text style={{ color: colors.accent, fontWeight: "700" }}>View all</Text></Pressable></View>
    {recent.length ? recent.map(project => <Pressable key={project.id} onPress={() => onOpen(project)} style={[styles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.projectGlyph, { backgroundColor: colors.surface2 }]}><Text style={{ color: colors.accent, fontWeight: "900" }}>{project.name.slice(0,1).toUpperCase()}</Text></View>
      <View style={{ flex: 1 }}><Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text><Text style={[styles.projectDate, { color: colors.muted }]}>{new Date(project.updatedAt || project.createdAt).toLocaleDateString()}</Text></View>
      <Text style={{ color: colors.muted, fontSize: 20 }}>›</Text>
    </Pressable>) : <Surface colors={colors}><Text style={{ color: colors.muted, lineHeight: 20 }}>No projects yet. Create your first project to get started.</Text></Surface>}
    <Text style={[styles.note, { color: colors.muted }]}>Local-first workspace · Your projects and chats stay on this phone.</Text>
  </ScrollView>;
}

export function ProjectsView({ projects, colors, onOpen, onDelete, onCreate }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => projects.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase())), [projects, query]);
  return <View style={{ flex: 1, paddingHorizontal: 18 }}>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search projects…" placeholderTextColor={colors.muted} style={[styles.search, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}/>
    <View style={styles.sectionRow}><Text style={[styles.sectionTitle, { color: colors.text }]}>{filtered.length} project{filtered.length === 1 ? "" : "s"}</Text><ActionButton label="+ New" onPress={onCreate} colors={colors} compact/></View>
    <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={{ paddingBottom: 28, flexGrow: 1 }} ListEmptyComponent={<View style={styles.empty}><Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>{query ? "No matching projects" : "No projects yet"}</Text><Text style={{ color: colors.muted, textAlign: "center", marginTop: 8 }}>Create a project and it will appear here.</Text></View>} renderItem={({ item }) => <View style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={() => onOpen(item)} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <View style={[styles.projectGlyph, { backgroundColor: colors.surface2 }]}><Text style={{ color: colors.accent, fontWeight: "900" }}>{item.name.slice(0,1).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}><Text style={[styles.projectName, { color: colors.text }]}>{item.name}</Text><Text style={[styles.projectDate, { color: colors.muted }]}>{new Date(item.updatedAt || item.createdAt).toLocaleString()}</Text></View>
        <Text style={{ color: colors.muted, fontSize: 20 }}>›</Text>
      </Pressable>
      <Pressable onPress={() => onDelete(item)} style={{ padding: 10 }}><Text style={{ color: colors.danger, fontSize: 12, fontWeight: "700" }}>Delete</Text></Pressable>
    </View>}/>
  </View>;
}

export function WorkspaceView({ colors, project }) {
  const [task, setTask] = useState("");
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
    <Surface colors={colors}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Agent task</Text>
      <Text style={[styles.body, { color: colors.muted, marginTop: 6 }]}>Describe the change you want the agent to make in {project?.name || "your project"}.</Text>
      <TextInput multiline value={task} onChangeText={setTask} placeholder="Example: Review the project structure and suggest improvements…" placeholderTextColor={colors.muted} style={[styles.taskInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface2 }]}/>
      <ActionButton label="Agent engine unavailable" colors={colors} disabled/>
      <Text style={[styles.note, { color: colors.warning }]}>Task execution, approvals, tool activity and automatic file-change plans are not connected yet. This screen does not run or submit tasks.</Text>
    </Surface>
    <Surface colors={colors}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Workspace capabilities</Text>
      {["AI can read project files","AI can propose and save files after your approval","No isolated command runner","No live app preview runtime","No automatic test-and-repair loop"].map((item, i) => <View key={item} style={styles.capability}><Text style={{ color: i < 2 ? colors.good : colors.warning }}>{i < 2 ? "●" : "○"}</Text><Text style={{ color: colors.text, flex: 1, fontSize: 13 }}>{item}</Text></View>)}
    </Surface>
  </ScrollView>;
}

export function UnavailableView({ colors, title, subtitle, details }) {
  return <View style={styles.unavailableWrap}>
    <View style={[styles.unavailableIcon, { backgroundColor: colors.surface2 }]}><Text style={{ color: colors.accent2, fontSize: 26, fontWeight: "900" }}>⌁</Text></View>
    <Text style={[styles.headerTitle, { color: colors.text, textAlign: "center" }]}>{title}</Text>
    <Text style={{ color: colors.muted, textAlign: "center", lineHeight: 21, marginTop: 8 }}>{subtitle}</Text>
    <Surface colors={colors} style={{ width: "100%", marginTop: 20 }}><Text style={{ color: colors.text, fontWeight: "800", marginBottom: 6 }}>Not connected in this build</Text><Text style={{ color: colors.muted, lineHeight: 20 }}>{details}</Text></Surface>
  </View>;
}

export function GitHubOverview({ colors, connected, owner, repo, branch, onConnect, onPush, onPull, project, busy }) {
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
    <Surface colors={colors}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>GitHub connection</Text>
      <Text style={{ color: connected ? colors.good : colors.warning, fontWeight: "800", marginTop: 10 }}>{connected ? "● Connected" : "○ Not connected"}</Text>
      <Text style={{ color: colors.muted, marginTop: 7, lineHeight: 20 }}>{connected ? (owner + "/" + (repo || "Repository not selected") + " · " + branch) : "Connect GitHub from Settings. Device Flow opens GitHub for approval."}</Text>
      {!connected ? <ActionButton label="Open GitHub settings" onPress={onConnect} colors={colors} secondary/> : null}
    </Surface>
    <Surface colors={colors}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Project backup</Text>
      <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>{project ? "Selected project: " + project.name : "Open a project first to enable file sync."} Only project text files are synced; chats and settings are not included.</Text>
      <View style={styles.row}>
        <ActionButton label={busy ? "Working…" : "↑ Push files"} onPress={onPush} colors={colors} disabled={!connected || !project || busy}/>
        <ActionButton label={busy ? "Working…" : "↓ Pull files"} onPress={onPull} colors={colors} secondary disabled={!connected || !project || busy}/>
      </View>
      <Text style={[styles.note, { color: colors.warning }]}>This is file backup, not full Git: repository browsing, commit history, branch creation and diff review are not implemented.</Text>
    </Surface>
  </ScrollView>;
}

export function MoreMenu({ colors, onNavigate, current }) {
  const items = [
    ["Code Editor", "editor", "Edit project files"],
    ["Terminal", "terminal", "Command runner unavailable"],
    ["Preview", "preview", "Live preview unavailable"],
    ["GitHub", "github", "Repository backup"],
    ["Tools", "tools", "Available AI file tools"],
    ["Settings", "settings", "Provider, model and account"]
  ];
  return <View style={{ flex: 1, padding: 18 }}>
    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 14 }]}>More workspace tools</Text>
    {items.map(([label, route, hint]) => <Pressable key={route} onPress={() => onNavigate(route)} style={[styles.moreItem, { backgroundColor: current === route ? colors.surface2 : colors.surface, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: "800" }}>{label}</Text><Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{hint}</Text></View><Text style={{ color: colors.accent, fontSize: 20 }}>›</Text>
    </Pressable>)}
  </View>;
}

export function BottomNavigation({ colors, current, onNavigate }) {
  const items = [["Home","home","⌂"],["Chat","chat","✧"],["Agent","workspace","◈"],["Projects","projects","▦"],["More","more","•••"]];
  const selected = ["editor","terminal","preview","github","tools","settings"].includes(current) ? "more" : current;
  return <View style={[styles.nav, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
    {items.map(([label, route, glyph]) => <Pressable key={route} onPress={() => onNavigate(route)} style={styles.navItem}>
      <Text style={{ color: selected === route ? colors.accent : colors.muted, fontSize: 18, fontWeight: "900" }}>{glyph}</Text>
      <Text style={{ color: selected === route ? colors.accent : colors.muted, fontSize: 10, fontWeight: selected === route ? "900" : "600", marginTop: 3 }}>{label}</Text>
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28, gap: 14 },\n  modalShade: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 22 },\n  modalCard: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 12 },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14 },
  headerLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  back: { fontSize: 12, fontWeight: "800", marginBottom: 5 },
  headerTitle: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, marginTop: 4 },
  surface: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  hero: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 12 },
  brand: { fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  heroTitle: { fontSize: 28, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 },
  body: { fontSize: 13, lineHeight: 20 },
  row: { flexDirection: "row", gap: 9, marginTop: 8 },
  actionButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, padding: 12, borderRadius: 14, gap: 5 },
  statNumber: { fontSize: 17, fontWeight: "900" },
  statLabel: { fontSize: 10 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  quick: { width: "48%", minHeight: 108, borderWidth: 1, borderRadius: 16, padding: 13, gap: 6 },
  quickTitle: { fontSize: 13, fontWeight: "800" },
  quickHint: { fontSize: 10, lineHeight: 15 },
  projectRow: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  projectCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  projectGlyph: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 11 },
  projectName: { fontSize: 14, fontWeight: "800" },
  projectDate: { fontSize: 10, marginTop: 4 },
  note: { fontSize: 10, lineHeight: 16, marginTop: 5 },
  search: { borderWidth: 1, borderRadius: 13, padding: 13, fontSize: 14, marginTop: 8, marginBottom: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  taskInput: { minHeight: 110, maxHeight: 180, borderWidth: 1, borderRadius: 13, padding: 12, textAlignVertical: "top", marginTop: 12, marginBottom: 8 },
  capability: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 7 },
  unavailableWrap: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  unavailableIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  moreItem: { borderWidth: 1, borderRadius: 14, padding: 15, marginBottom: 9, flexDirection: "row", alignItems: "center" },
  nav: { flexDirection: "row", borderTopWidth: 1, paddingTop: 9, paddingBottom: 8, paddingHorizontal: 5 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 42 }
});
