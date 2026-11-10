import React,{useEffect,useMemo,useState} from "react";
import {ActivityIndicator,AppState,Alert,Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import * as SecureStore from "expo-secure-store";
import {GITHUB_SETTING_KEYS,getGitHubAccount,pollGitHubDeviceFlow,startGitHubDeviceFlow,testGitHubConnection} from "./githubSync.js";
import {testProviderConnection,PROVIDER_DEFAULTS} from "./chatClient.js";

const API_KEY="legend_ai_provider_api_key";
const MODEL_KEY="legend_ai_model";
const PROVIDER_KEY="legend_ai_provider";
const BASE_URL_KEY="legend_ai_base_url";
const DEFAULT_MODEL="gpt-4.1-mini";
// Set EXPO_PUBLIC_GITHUB_CLIENT_ID in the release build to make GitHub login one-tap for every user.
const BUILT_IN_GITHUB_CLIENT_ID=process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID||"";

export default function SettingsScreen({onBack,theme="dark"}){
 const styles=useMemo(()=>makeStyles(theme),[theme]);
 const [apiKey,setApiKey]=useState("");
 const [model,setModel]=useState(DEFAULT_MODEL);
 const [provider,setProvider]=useState("openai");
 const [baseUrl,setBaseUrl]=useState(PROVIDER_DEFAULTS.openai.baseUrl);
 const [hasKey,setHasKey]=useState(false);
 const [testingAI,setTestingAI]=useState(false);
 const [owner,setOwner]=useState("");
 const [repo,setRepo]=useState("");
 const [branch,setBranch]=useState("main");
 const [hasGhToken,setHasGhToken]=useState(false);
 const [githubToken,setGithubToken]=useState("");
 const [advancedOpen,setAdvancedOpen]=useState(false);
 const [connecting,setConnecting]=useState(false);
 const [deviceCode,setDeviceCode]=useState("");
 const [saving,setSaving]=useState(false);
 const [testing,setTesting]=useState(false);
 const [message,setMessage]=useState("");

 useEffect(()=>{
  let mounted=true;
  Promise.all([
   SecureStore.getItemAsync(API_KEY),SecureStore.getItemAsync(MODEL_KEY),SecureStore.getItemAsync(PROVIDER_KEY),SecureStore.getItemAsync(BASE_URL_KEY),
   SecureStore.getItemAsync(GITHUB_SETTING_KEYS.token),SecureStore.getItemAsync(GITHUB_SETTING_KEYS.owner),
   SecureStore.getItemAsync(GITHUB_SETTING_KEYS.repo),SecureStore.getItemAsync(GITHUB_SETTING_KEYS.branch),
   ]).then(([key,selectedModel,savedProvider,savedBaseUrl,token,savedOwner,savedRepo,savedBranch])=>{
   if(!mounted)return;
   setHasKey(Boolean(key));const selectedProvider=savedProvider||"openai";setProvider(selectedProvider);setModel(selectedModel||PROVIDER_DEFAULTS[selectedProvider]?.model||DEFAULT_MODEL);setBaseUrl(savedBaseUrl||PROVIDER_DEFAULTS[selectedProvider]?.baseUrl||"");setHasGhToken(Boolean(token));
   setOwner(savedOwner||"");setRepo(savedRepo||"");setBranch(savedBranch||"main");
  }).catch(()=>{if(mounted)setMessage("Could not load saved settings.");});
  return()=>{mounted=false;};
 },[]);

 async function save(){
  const key=apiKey.trim(),selectedModel=model.trim();
   if(!key&&!hasKey){setMessage("Paste your selected provider API key before saving.");return;}
  if(!selectedModel||selectedModel.length>80){setMessage("Enter a valid model name.");return;}
  setSaving(true);setMessage("");
  try{
   if(key)await SecureStore.setItemAsync(API_KEY,key);
   await SecureStore.setItemAsync(PROVIDER_KEY,provider);
   await SecureStore.setItemAsync(BASE_URL_KEY,baseUrl.trim());
   await SecureStore.setItemAsync(MODEL_KEY,selectedModel);
   if(owner.trim())await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.owner,owner.trim());
   if(repo.trim())await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.repo,repo.trim());
   await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.branch,branch.trim()||"main");
   setApiKey("");setHasKey(Boolean(key)||hasKey);setMessage("Settings saved securely on this phone.");
  }catch{setMessage("Settings could not be saved. Please retry.");}
  finally{setSaving(false);}
 }

 async function testAI(){
  setTestingAI(true);setMessage("");
  try{
   const key=apiKey.trim()||await SecureStore.getItemAsync(API_KEY);
   const result=await testProviderConnection({provider,apiKey:key,model,baseUrl});
   setMessage("AI connected · "+provider+" · "+result.model+" · "+result.response);
  }catch(error){setMessage(error.message||"AI connection test failed.");}
  finally{setTestingAI(false);}
 }

 async function connectGitHub(){
  setConnecting(true);setMessage("");setDeviceCode("");
  try{
   const id=BUILT_IN_GITHUB_CLIENT_ID;
   if(!id)throw new Error("GitHub login abhi app publisher ki taraf se enable nahi hua hai. App publisher ko ek baar GitHub OAuth Client ID configure karni hogi.");
   const flow=await startGitHubDeviceFlow(id);
   setDeviceCode(flow.userCode);
   await Linking.openURL(flow.verificationUri);
   const deadline=Date.now()+flow.expiresIn*1000;
   let delay=flow.interval*1000;
   while(true){
    await new Promise(resolve=>setTimeout(resolve,delay));
    // Android may pause JS while Chrome is open. Poll only after returning to the app,
    // and allow one final poll on resume even if the local deadline elapsed in background.
    if(AppState.currentState!=="active")continue;
    const result=await pollGitHubDeviceFlow({clientId:id,deviceCode:flow.deviceCode});
    if(result.status==="complete"){
     await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.token,result.accessToken);
     await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.clientId,id);
     if(result.refreshToken)await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.refreshToken,result.refreshToken);
     if(result.expiresIn)await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.expiresAt,String(Date.now()+result.expiresIn*1000));
     const account=await getGitHubAccount({token:result.accessToken});
     await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.owner,account.login);
     setOwner(account.login);setHasGhToken(true);setDeviceCode("");
     setMessage("GitHub connected. Add a repository name below to enable optional backup.");
     return;
    }
    if(result.status==="slow_down")delay+=5000;
    if(Date.now()>=deadline)throw new Error("GitHub sign-in expired. Please try again.");
   }
   throw new Error("GitHub sign-in expired. Please try again.");
  }catch(error){setMessage(error.message||"GitHub connection failed.");}
  finally{setConnecting(false);}
 }

 async function connectGitHubWithToken(){
  const token=githubToken.trim();
  if(!token){setMessage("Paste a GitHub token with public_repo permission.");return;}
  setConnecting(true);setMessage("");
  try{
   const account=await getGitHubAccount({token});
   await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.token,token);
   await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.owner,account.login);
   setOwner(account.login);setHasGhToken(true);setGithubToken("");
   setMessage("GitHub account connected as "+account.login+". Enter a public repository name, then test it.");
  }catch(error){setMessage(error.message||"GitHub token verify nahi hua.");}
  finally{setConnecting(false);}
 }

 async function testGitHub(){
  setTesting(true);setMessage("");
  try{
   if(!owner.trim()||!repo.trim())throw new Error("Enter the repository owner and name.");
   await Promise.all([
    SecureStore.setItemAsync(GITHUB_SETTING_KEYS.owner,owner.trim()),
    SecureStore.setItemAsync(GITHUB_SETTING_KEYS.repo,repo.trim()),
    SecureStore.setItemAsync(GITHUB_SETTING_KEYS.branch,branch.trim()||"main")
   ]);
   const result=await testGitHubConnection();
   const selectedBranch=result.defaultBranch||"main";
   setBranch(selectedBranch);
   await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.branch,selectedBranch);
   setMessage("Backup repository connected · "+result.fullName);
  }catch(error){setMessage(error.message||"GitHub connection failed.");}
  finally{setTesting(false);}
 }

 async function clearAI(){
  try{await Promise.all([SecureStore.deleteItemAsync(API_KEY),SecureStore.deleteItemAsync(PROVIDER_KEY),SecureStore.deleteItemAsync(BASE_URL_KEY),SecureStore.deleteItemAsync(MODEL_KEY)]);setHasKey(false);setApiKey("");setProvider("openai");setBaseUrl(PROVIDER_DEFAULTS.openai.baseUrl);setModel(DEFAULT_MODEL);setMessage("Saved AI settings removed from this phone.");}
  catch{setMessage("Could not remove the API key.");}
 }
 async function clearGitHub(){
  try{
   await Promise.all(Object.values(GITHUB_SETTING_KEYS).map(key=>SecureStore.deleteItemAsync(key)));
   setHasGhToken(false);setOwner("");setRepo("");setBranch("main");setDeviceCode("");
   setMessage("GitHub account disconnected from this phone.");
  }catch{setMessage("Could not disconnect GitHub.");}
 }

 return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <Pressable onPress={onBack}><Text style={styles.back}>‹  Back</Text></Pressable>
  <Text style={styles.eyebrow}>MY AI AGENT</Text>
  <Text style={styles.title}>Settings</Text>
  <Text style={styles.description}>Choose an AI provider and add your own API key. Keys stay in this phone secure storage. API credits are separate from ChatGPT subscriptions.</Text>

  <Text style={styles.section}>PROFILE & PRIVACY</Text>
  <View style={{backgroundColor:theme==="light"?"#E9EFF9":"#131f32",borderRadius:12,padding:13}}>
   <Text style={{color:theme==="light"?"#17233B":"#f4f7ff",fontWeight:"800"}}>Local device profile</Text>
   <Text style={styles.hint}>No MY AI AGENT account is required. Projects and chats stay on this phone; provider requests use your own API key.</Text>
  </View>
  <Text style={styles.section}>LANGUAGE</Text>
  <Text style={styles.hint}>The current interface uses English with some Hindi guidance. In-app language switching is not implemented yet.</Text>
  <Text style={styles.section}>AI PROVIDER</Text>
  <Text style={styles.label}>AI PROVIDER</Text>
  <View style={{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:8}}>
   {["openai","gemini","groq","openrouter","custom"].map(item=><Pressable key={item} onPress={()=>{setProvider(item);setModel(PROVIDER_DEFAULTS[item].model);setBaseUrl(PROVIDER_DEFAULTS[item].baseUrl);setMessage("");}} style={{paddingVertical:9,paddingHorizontal:12,borderRadius:9,backgroundColor:provider===item?(theme==="light"?"#4267e8":"#526a9c"):(theme==="light"?"#E9EFF9":"#172640")}}><Text style={{color:provider===item?"#fff":(theme==="light"?"#17233B":"#f4f7ff"),fontWeight:"800",fontSize:11}}>{item==="custom"?"Custom URL":item[0].toUpperCase()+item.slice(1)}</Text></Pressable>)}
  </View>
  <Text style={styles.label}>API KEY</Text>
  <TextInput value={apiKey} onChangeText={setApiKey} placeholder={hasKey?"Saved securely · enter a new key to replace":"Paste "+provider+" API key"} placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} secureTextEntry style={styles.input}/>
  <Text style={styles.hint}>{hasKey?"An API key is saved on this phone.":"You need your own provider API billing/credits to use AI."}</Text>
  {provider==="custom"||provider==="openai"||provider==="groq"||provider==="openrouter"?<><Text style={styles.label}>API BASE URL</Text><TextInput value={baseUrl} onChangeText={setBaseUrl} placeholder="https://your-provider.example/v1" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/></>:null}
  <Text style={styles.label}>MODEL</Text>
  <TextInput value={model} onChangeText={setModel} placeholder={DEFAULT_MODEL} placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
  <Pressable onPress={testAI} disabled={testingAI} style={[styles.secondary,testingAI&&styles.disabled]}>{testingAI?<ActivityIndicator color="#c3d0f2"/>:<Text style={styles.secondaryText}>Test AI connection</Text>}</Pressable>
  <Pressable onPress={save} disabled={saving} style={[styles.button,saving&&styles.disabled]}>{saving?<ActivityIndicator color="#09111f"/>:<Text style={styles.buttonText}>Save settings</Text>}</Pressable>
  {hasKey?<Pressable onPress={clearAI} style={styles.clear}><Text style={styles.clearText}>Remove saved API key</Text></Pressable>:null}

  <View style={styles.separator}/>
  <Text style={styles.section}>AGENT PERMISSIONS</Text>
  <Text style={styles.hint}>Project file creation and edits require an approval prompt in AI Chat. Shell/terminal access is disabled because no isolated execution service is connected.</Text>
  <View style={styles.separator}/>
  <Pressable onPress={()=>setAdvancedOpen(value=>!value)} style={styles.advancedHeader}>
   <View><Text style={styles.section}>OPTIONAL GITHUB BACKUP</Text><Text style={styles.hint}>Only needed if you want to sync project files.</Text></View>
   <Text style={styles.chevron}>{advancedOpen?"−":"+"}</Text>
  </Pressable>
  {advancedOpen?<>
   <Text style={styles.description}>GitHub backup optional hai aur sirf public repositories support karta hai. Connect GitHub dabao, phir yahan dikhaya code github.com/login/device par enter karke approve karo. Projects aur chats phone par hi rahenge.</Text>
   <Pressable onPress={connectGitHub} disabled={connecting} style={[styles.secondary,connecting&&styles.disabled]}>{connecting?<ActivityIndicator color="#c3d0f2"/>:<Text style={styles.secondaryText}>{hasGhToken?"Reconnect with GitHub browser":"Connect with GitHub browser"}</Text>}</Pressable>
   {deviceCode?<Text style={styles.message}>Enter this code on GitHub: {deviceCode}</Text>:null}
   {!BUILT_IN_GITHUB_CLIENT_ID?<Text style={styles.hint}>Browser sign-in is not enabled in this build yet. You can connect with a GitHub token below instead.</Text>:null}
   <Text style={styles.label}>GITHUB TOKEN (PUBLIC_REPO)</Text>
   <TextInput value={githubToken} onChangeText={setGithubToken} placeholder="Paste GitHub token" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} secureTextEntry style={styles.input}/>
   <Pressable onPress={connectGitHubWithToken} disabled={connecting||!githubToken.trim()} style={[styles.secondary,(connecting||!githubToken.trim())&&styles.disabled]}><Text style={styles.secondaryText}>Connect with token</Text></Pressable>
   <Text style={styles.label}>REPOSITORY NAME</Text>
   <TextInput value={repo} onChangeText={setRepo} placeholder="your-backup-repository" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
   <Text style={styles.label}>BRANCH (OPTIONAL)</Text>
   <TextInput value={branch} onChangeText={setBranch} placeholder="main" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
   <Pressable onPress={testGitHub} disabled={testing||!hasGhToken} style={[styles.secondary,(testing||!hasGhToken)&&styles.disabled]}>{testing?<ActivityIndicator color="#c3d0f2"/>:<Text style={styles.secondaryText}>Test backup repository</Text>}</Pressable>
   {hasGhToken?<Pressable onPress={clearGitHub} style={styles.clear}><Text style={styles.clearText}>Disconnect GitHub</Text></Pressable>:null}
  </>:null}
  {message?<Text style={styles.message}>{message}</Text>:null}
  <Text style={styles.warning}>AI usage may cost money through your provider. Gemini has its own API format; Groq, OpenRouter and Custom use OpenAI-compatible Chat Completions. Project file approval tools currently work only with OpenAI. Never share or commit API keys.</Text>
 </ScrollView>;
}

function makeStyles(theme){
 const light=theme==="light",bg=light?"#F3F6FC":"#09111f",surface=light?"#FFFFFF":"#131f32",surface2=light?"#E9EFF9":"#172640",border=light?"#D9E2F0":"#263651",text=light?"#17233B":"#f4f7ff",muted=light?"#65738D":"#9ba8bf",accent=light?"#4267e8":"#a9bcff",danger=light?"#C0445B":"#ffb6c5",notice=light?"#435B85":"#c7d3ef",warning=light?"#93621D":"#d7b98a";
 return StyleSheet.create({
 screen:{flex:1,backgroundColor:bg},content:{padding:24,paddingTop:24,paddingBottom:50},back:{color:accent,fontSize:16,fontWeight:"700",marginBottom:25},eyebrow:{color:accent,fontSize:11,fontWeight:"900",letterSpacing:2,marginBottom:8},title:{color:text,fontSize:29,fontWeight:"800",marginBottom:8},description:{color:muted,lineHeight:20,fontSize:12,marginBottom:10},section:{color:accent,fontSize:11,fontWeight:"900",letterSpacing:1.4,marginTop:20,marginBottom:5},label:{color:muted,fontSize:10,fontWeight:"900",letterSpacing:1.1,marginBottom:7,marginTop:14},input:{backgroundColor:surface,borderColor:border,borderWidth:1,borderRadius:12,padding:14,color:text,fontSize:14},hint:{color:muted,fontSize:11,marginTop:7},button:{marginTop:16,backgroundColor:accent,borderRadius:12,padding:15,alignItems:"center"},buttonText:{color:light?"#FFFFFF":"#09111f",fontWeight:"900"},secondary:{marginTop:14,backgroundColor:surface2,borderRadius:12,padding:14,alignItems:"center"},secondaryText:{color:text,fontWeight:"800"},disabled:{opacity:.45},clear:{padding:12,alignItems:"center"},clearText:{color:danger,fontWeight:"700",fontSize:12},separator:{height:1,backgroundColor:border,marginTop:22},advancedHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},chevron:{color:accent,fontSize:24,padding:8},message:{color:notice,fontSize:12,marginTop:14,lineHeight:18},warning:{color:warning,fontSize:11,lineHeight:17,marginTop:20}
 });
}
