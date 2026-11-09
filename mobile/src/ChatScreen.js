import React,{useEffect,useMemo,useState} from "react";
import {ActivityIndicator,Alert,FlatList,KeyboardAvoidingView,Platform,Pressable,StyleSheet,Text,TextInput,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Clipboard from "expo-clipboard";
import {sendChatMessage} from "./chatClient.js";
import {createProjectFile,readProjectFiles,saveProjectFile} from "./projectFiles.js";
const historyKey=(id)=>"@legend-ai/chat/"+id,API_KEY="legend_ai_provider_api_key",MODEL_KEY="legend_ai_model";

function InlineText({value,styles}) {
 const parts=String(value||"").split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
 return <Text style={styles.message}>{parts.map((part,index)=>{
  if(part.startsWith("`")&&part.endsWith("`"))return <Text key={index} style={styles.inlineCode}>{part.slice(1,-1)}</Text>;
  if(part.startsWith("**")&&part.endsWith("**"))return <Text key={index} style={{fontWeight:"900"}}>{part.slice(2,-2)}</Text>;
  return part;
 })}</Text>;
}
function MessageBody({content,styles}) {
 const segments=String(content||"").split(/```/g);
 return <View style={{gap:8}}>{segments.map((segment,index)=>{
  if(index%2===1){
   const lines=segment.split("\n"),hasLanguage=lines.length>1&&/^[a-zA-Z0-9+#.-]{1,20}$/.test(lines[0].trim());
   const code=hasLanguage?lines.slice(1).join("\n"):segment;
   return <View key={index} style={styles.codeCard}>
    <View style={styles.codeHeader}><Text style={styles.codeLabel}>{hasLanguage?lines[0].toUpperCase():"CODE"}</Text><Pressable onPress={async()=>{try{await Clipboard.setStringAsync(code);Alert.alert("Copied","Code copied to clipboard.");}catch{Alert.alert("Copy unavailable","Could not copy code on this device.");}}}><Text style={styles.copyCode}>Copy code</Text></Pressable></View>
    <Text selectable style={styles.codeText}>{code.trimEnd()}</Text>
   </View>;
  }
  return <View key={index} style={{gap:3}}>{segment.split("\n").map((line,lineIndex)=>{
   if(!line.trim())return <View key={lineIndex} style={{height:4}}/>;
   if(/^#{1,3}\s/.test(line))return <Text key={lineIndex} style={styles.markdownHeading}>{line.replace(/^#{1,3}\s/,"")}</Text>;
   if(/^[-*]\s/.test(line))return <InlineText key={lineIndex} value={"•  "+line.slice(2)} styles={styles}/>;
   if(/^>\s/.test(line))return <Text key={lineIndex} style={styles.quote}>{line.slice(2)}</Text>;
   return <InlineText key={lineIndex} value={line} styles={styles}/>;
  })}</View>;
 })}</View>;
}

export default function ChatScreen({project,theme="dark",onOpenSettings,initialPrompt="",onInitialPromptApplied}){
 const [messages,setMessages]=useState([]),[draft,setDraft]=useState(""),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(""),[failedDraft,setFailedDraft]=useState(""),[model,setModel]=useState("gpt-4.1-mini");
 const styles=useMemo(()=>makeStyles(theme),[theme]);
 useEffect(()=>{let mounted=true;Promise.all([AsyncStorage.getItem(historyKey(project.id)),SecureStore.getItemAsync(MODEL_KEY)]).then(([raw,savedModel])=>{if(mounted&&raw)setMessages(JSON.parse(raw));if(mounted)setModel(savedModel||"gpt-4.1-mini");}).catch(()=>{if(mounted)setError("Local chat history or settings could not be loaded.");}).finally(()=>{if(mounted)setReady(true);});return()=>{mounted=false;};},[project.id]);
 useEffect(()=>{if(ready&&initialPrompt.trim()){setDraft(initialPrompt.trim());onInitialPromptApplied?.();}},[ready,initialPrompt]);
 async function handleAgentToolCall(name,args){
  if(name==="list_project_files"){const files=await readProjectFiles(AsyncStorage,project.id);return {ok:true,files:files.map(file=>({file_name:file.name,characters:file.content.length}))};}
  if(name==="read_project_file"){const files=await readProjectFiles(AsyncStorage,project.id);const file=files.find(item=>item.name===args.file_name);if(!file)return {ok:false,error:"File not found: "+args.file_name};return {ok:true,file_name:file.name,content:file.content};}
  if(name==="write_project_file"){
   const fileName=String(args.file_name||"").trim(),content=String(args.content??"");
   const files=await readProjectFiles(AsyncStorage,project.id),existing=files.find(item=>item.name===fileName);
   const approved=await new Promise(resolve=>Alert.alert(existing?"Overwrite project file?":"Create project file?",fileName+" ko local project mein save karne ki permission do.",[{text:"Cancel",style:"cancel",onPress:()=>resolve(false)},{text:"Allow",onPress:()=>resolve(true)}],{cancelable:false}));
   if(!approved)return {ok:false,error:"User did not approve saving "+fileName+"."};
   const file=existing?{...existing,content}:{...createProjectFile(fileName,content)};
   const updated=await saveProjectFile(AsyncStorage,project.id,file);
   return {ok:true,saved_file:fileName,total_files:updated.length,message:"File saved locally on this phone."};
  }
  throw new Error("Unknown project tool: "+name);
 }
 async function sendMessage(content,history){
  if(!content.trim()||busy)return;
  setError("");setFailedDraft("");
  const userMessage={id:String(Date.now()),role:"user",content},next=[...history,userMessage],assistantId=String(Date.now()+1);
  setMessages([...next,{id:assistantId,role:"assistant",content:""}]);setBusy(true);
  try{
   await AsyncStorage.setItem(historyKey(project.id),JSON.stringify(next));
   const [apiKey,savedModel,projectFiles]=await Promise.all([SecureStore.getItemAsync(API_KEY),SecureStore.getItemAsync(MODEL_KEY),readProjectFiles(AsyncStorage,project.id)]);
   const answer=await sendChatMessage({apiKey,model:savedModel||model,messages:next.slice(-30).map(({role,content:text})=>({role,content:text})),projectFiles,onToolCall:handleAgentToolCall,onDelta:delta=>setMessages(current=>current.map(item=>item.id===assistantId?{...item,content:item.content+delta}:item))});
   const completed=[...next,{id:assistantId,role:"assistant",content:answer}];setMessages(completed);await AsyncStorage.setItem(historyKey(project.id),JSON.stringify(completed));
  }catch(cause){setMessages(next);setFailedDraft(content);setError(cause?.message||"Message send nahi hua. Internet aur API settings check karo.");}
  finally{setBusy(false);}
 }
 function send(){const content=draft.trim();if(!content||busy)return;setDraft("");sendMessage(content,messages);}
 function retry(){if(!failedDraft||busy)return;const base=messages.at(-1)?.role==="user"&&messages.at(-1)?.content===failedDraft?messages.slice(0,-1):messages;sendMessage(failedDraft,base);}
 function newChat(){
  Alert.alert("Start a new chat?","This clears the current project's saved conversation history.",[{text:"Cancel",style:"cancel"},{text:"New chat",style:"destructive",onPress:async()=>{try{await AsyncStorage.removeItem(historyKey(project.id));setMessages([]);setError("");setFailedDraft("");}catch{setError("Could not clear chat history.");}}}]);
 }
 return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==="ios"?"padding":undefined}>
  <View style={styles.header}>
   <View style={{flex:1}}><Text style={styles.title}>AI Chat</Text><Text style={styles.subtitle}>{project.name} · {model} · Project files in context</Text></View>
   <Pressable onPress={onOpenSettings} style={styles.headerAction}><Text style={styles.headerActionText}>Model</Text></Pressable>
   <Pressable onPress={newChat} style={styles.headerAction}><Text style={styles.headerActionText}>New</Text></Pressable>
  </View>
  {!ready?<ActivityIndicator color={theme==="dark"?"#a9bcff":"#4267e8"} style={styles.loader}/>:<FlatList style={styles.list} data={messages} keyExtractor={item=>item.id} contentContainerStyle={messages.length?styles.messageList:styles.empty} ListEmptyComponent={<Text style={styles.emptyText}>Welcome! Ask MY AI AGENT about this project or ask it to create a file.</Text>} renderItem={({item})=><View style={[styles.bubble,item.role==="user"?styles.userBubble:styles.aiBubble]}><Text style={styles.role}>{item.role==="user"?"YOU":"MY AI AGENT"}</Text><MessageBody content={item.content||(busy?"…":"")} styles={styles}/></View>}/>}
  {busy?<View style={styles.waiting}><ActivityIndicator color={theme==="dark"?"#a9bcff":"#4267e8"}/><Text style={styles.waitText}>AI is responding…</Text></View>:null}
  {error?<View style={styles.errorWrap}><Text style={styles.error}>{error}</Text>{failedDraft?<Pressable onPress={retry} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>:null}</View>:null}
  <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Message MY AI AGENT…" placeholderTextColor={theme==="dark"?"#78839a":"#7b879a"} style={styles.input} multiline editable={!busy}/><Pressable onPress={send} disabled={busy||!draft.trim()} style={[styles.send,(busy||!draft.trim())&&styles.disabled]}><Text style={styles.sendText}>↑</Text></Pressable></View>
  <Text style={styles.footnote}>Local chat history · AI replies need internet and your own API key.</Text>
 </KeyboardAvoidingView>;
}
function makeStyles(theme){
 const light=theme==="light",bg=light?"#F3F6FC":"#09111f",surface=light?"#FFFFFF":"#131f32",surface2=light?"#E9EFF9":"#26385d",border=light?"#D9E2F0":"#1d2b43",text=light?"#17233B":"#f4f7ff",muted=light?"#65738D":"#91a0bb",accent=light?"#4267e8":"#a9bcff";
 return StyleSheet.create({
  container:{flex:1,backgroundColor:bg},header:{flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:14,paddingTop:12,paddingBottom:12,borderBottomWidth:1,borderBottomColor:border},title:{color:text,fontSize:21,fontWeight:"900"},subtitle:{color:muted,fontSize:10,marginTop:3},headerAction:{paddingHorizontal:10,paddingVertical:8,borderRadius:9,backgroundColor:surface2},headerActionText:{color:accent,fontSize:11,fontWeight:"900"},list:{flex:1},messageList:{padding:14,gap:11},empty:{flexGrow:1,justifyContent:"center",alignItems:"center",padding:32},emptyText:{color:muted,textAlign:"center",lineHeight:22},bubble:{maxWidth:"92%",padding:13,borderRadius:15,gap:7},userBubble:{alignSelf:"flex-end",backgroundColor:surface2},aiBubble:{alignSelf:"flex-start",backgroundColor:surface},role:{color:accent,fontSize:9,fontWeight:"900",letterSpacing:1.2},message:{color:text,fontSize:14,lineHeight:21},inlineCode:{fontFamily:Platform.OS==="ios"?"Menlo":"monospace",color:accent,backgroundColor:surface2},markdownHeading:{color:text,fontSize:16,fontWeight:"900",marginTop:4},quote:{color:muted,borderLeftWidth:2,borderLeftColor:accent,paddingLeft:8,fontSize:13},codeCard:{backgroundColor:light?"#EDF2FA":"#080D19",borderWidth:1,borderColor:border,borderRadius:10,overflow:"hidden"},codeHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:10,paddingVertical:7,backgroundColor:surface2},codeLabel:{color:muted,fontSize:9,fontWeight:"900"},copyCode:{color:accent,fontSize:10,fontWeight:"900"},codeText:{color:text,fontFamily:Platform.OS==="ios"?"Menlo":"monospace",fontSize:11,lineHeight:17,padding:11},composer:{flexDirection:"row",alignItems:"flex-end",padding:11,gap:8,borderTopWidth:1,borderTopColor:border},input:{flex:1,maxHeight:110,minHeight:48,color:text,backgroundColor:surface,borderRadius:13,paddingHorizontal:13,paddingVertical:11,fontSize:14},send:{width:48,height:48,borderRadius:13,alignItems:"center",justifyContent:"center",backgroundColor:accent},sendText:{color:"#09111f",fontSize:25,fontWeight:"900"},disabled:{opacity:0.45},waiting:{flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:18,paddingBottom:8},waitText:{color:accent,fontSize:12},errorWrap:{paddingHorizontal:14,paddingBottom:7},error:{color:light?"#B52D4B":"#ffc0ce",fontSize:11},retry:{alignSelf:"flex-start",paddingVertical:6,paddingHorizontal:10,marginTop:5,borderRadius:8,backgroundColor:surface2},retryText:{color:accent,fontWeight:"900",fontSize:11},footnote:{color:muted,fontSize:9,textAlign:"center",paddingBottom:6}
 });
}
