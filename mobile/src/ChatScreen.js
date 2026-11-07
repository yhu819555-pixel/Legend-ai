import React,{useEffect,useState} from "react";
import {ActivityIndicator,FlatList,KeyboardAvoidingView,Platform,Pressable,StyleSheet,Text,TextInput,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {sendChatMessage} from "./chatClient.js";
import {readProjectFiles} from "./projectFiles.js";
const historyKey=(id)=>"@legend-ai/chat/"+id,API_KEY="legend_ai_provider_api_key",MODEL_KEY="legend_ai_model";
export default function ChatScreen({project}){
 const [messages,setMessages]=useState([]),[draft,setDraft]=useState(""),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState("");
 useEffect(()=>{let mounted=true;AsyncStorage.getItem(historyKey(project.id)).then(raw=>{if(mounted&&raw)setMessages(JSON.parse(raw));}).catch(()=>{if(mounted)setError("Local chat history load nahi hui.");}).finally(()=>{if(mounted)setReady(true);});return()=>{mounted=false;};},[project.id]);
 async function send(){
  const content=draft.trim();if(!content||busy)return;setDraft("");setError("");
  const userMessage={id:String(Date.now()),role:"user",content},next=[...messages,userMessage],assistantId=String(Date.now()+1);
  setMessages([...next,{id:assistantId,role:"assistant",content:""}]);setBusy(true);
  try{
   await AsyncStorage.setItem(historyKey(project.id),JSON.stringify(next));
   const [apiKey,model,projectFiles]=await Promise.all([SecureStore.getItemAsync(API_KEY),SecureStore.getItemAsync(MODEL_KEY),readProjectFiles(AsyncStorage,project.id)]);
   const answer=await sendChatMessage({apiKey,model:model||"gpt-4.1-mini",messages:next.slice(-30).map(({role,content:text})=>({role,content:text})),projectFiles,onDelta:delta=>setMessages(current=>current.map(item=>item.id===assistantId?{...item,content:item.content+delta}:item))});
   const completed=[...next,{id:assistantId,role:"assistant",content:answer}];setMessages(completed);await AsyncStorage.setItem(historyKey(project.id),JSON.stringify(completed));
  }catch(cause){setMessages(next);setError(cause?.message||"Message send nahi hua. Internet aur API settings check karo.");}finally{setBusy(false);}
 }
 return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==="ios"?"padding":undefined}>
  <View style={styles.header}><Text style={styles.title}>AI Chat</Text><Text style={styles.subtitle}>{project.name} · Local project files are included as context</Text></View>
  {!ready?<ActivityIndicator color="#a9bcff" style={styles.loader}/>:<FlatList style={styles.list} data={messages} keyExtractor={item=>item.id} contentContainerStyle={messages.length?styles.messageList:styles.empty} ListEmptyComponent={<Text style={styles.emptyText}>Namaste! Is project ke baare mein AI se kuch bhi poochho.</Text>} renderItem={({item})=><View style={[styles.bubble,item.role==="user"?styles.userBubble:styles.aiBubble]}><Text style={styles.role}>{item.role==="user"?"YOU":"LEGEND AI"}</Text><Text style={styles.message}>{item.content||(busy?"…":"")}</Text></View>}/>}
  {busy?<View style={styles.waiting}><ActivityIndicator color="#a9bcff"/><Text style={styles.waitText}>AI soch raha hai…</Text></View>:null}
  {error?<Text style={styles.error}>{error}</Text>:null}
  <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Message Legend AI…" placeholderTextColor="#78839a" style={styles.input} multiline editable={!busy}/><Pressable onPress={send} disabled={busy||!draft.trim()} style={[styles.send,(busy||!draft.trim())&&styles.disabled]}><Text style={styles.sendText}>↑</Text></Pressable></View>
  <Text style={styles.footnote}>Projects and chats stay on this phone. AI replies need internet and your API key.</Text>
 </KeyboardAvoidingView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:"#09111f"},header:{paddingHorizontal:20,paddingTop:14,paddingBottom:12,borderBottomWidth:1,borderBottomColor:"#1d2b43"},title:{color:"#f4f7ff",fontSize:22,fontWeight:"800"},subtitle:{color:"#91a0bb",fontSize:11,marginTop:3},list:{flex:1},messageList:{padding:16,gap:12},empty:{flexGrow:1,justifyContent:"center",alignItems:"center",padding:32},emptyText:{color:"#9ba8bf",textAlign:"center",lineHeight:22},bubble:{maxWidth:"88%",padding:13,borderRadius:15,gap:6},userBubble:{alignSelf:"flex-end",backgroundColor:"#26385d"},aiBubble:{alignSelf:"flex-start",backgroundColor:"#131f32"},role:{color:"#9eb4ff",fontSize:9,fontWeight:"900",letterSpacing:1.2},message:{color:"#f4f7ff",fontSize:15,lineHeight:22},composer:{flexDirection:"row",alignItems:"flex-end",padding:12,gap:9,borderTopWidth:1,borderTopColor:"#1d2b43"},input:{flex:1,maxHeight:110,minHeight:48,color:"#fff",backgroundColor:"#131f32",borderRadius:14,paddingHorizontal:14,paddingVertical:12,fontSize:15},send:{width:48,height:48,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:"#a9bcff"},sendText:{color:"#09111f",fontSize:25,fontWeight:"900"},disabled:{opacity:0.45},waiting:{flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:18,paddingBottom:8},waitText:{color:"#a9bcff",fontSize:12},error:{color:"#ffc0ce",paddingHorizontal:16,paddingBottom:8,fontSize:12},footnote:{color:"#66758e",fontSize:10,textAlign:"center",paddingBottom:7}});
