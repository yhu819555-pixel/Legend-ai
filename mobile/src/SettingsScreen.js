import React,{useEffect,useState} from "react";
import {ActivityIndicator,Alert,Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import * as SecureStore from "expo-secure-store";
import {GITHUB_SETTING_KEYS,getGitHubAccount,pollGitHubDeviceFlow,startGitHubDeviceFlow,testGitHubConnection} from "./githubSync.js";
import {testOpenAIConnection} from "./chatClient.js";

const API_KEY="legend_ai_provider_api_key";
const MODEL_KEY="legend_ai_model";
const DEFAULT_MODEL="gpt-4.1-mini";
// Set EXPO_PUBLIC_GITHUB_CLIENT_ID in the release build to make GitHub login one-tap for every user.
const BUILT_IN_GITHUB_CLIENT_ID=process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID||"";

export default function SettingsScreen({onBack}){
 const [apiKey,setApiKey]=useState("");
 const [model,setModel]=useState(DEFAULT_MODEL);
 const [hasKey,setHasKey]=useState(false);
 const [testingAI,setTestingAI]=useState(false);
 const [owner,setOwner]=useState("");
 const [repo,setRepo]=useState("");
 const [branch,setBranch]=useState("main");
 const [hasGhToken,setHasGhToken]=useState(false);
  const [advancedOpen,setAdvancedOpen]=useState(false);
 const [connecting,setConnecting]=useState(false);
 const [deviceCode,setDeviceCode]=useState("");
 const [saving,setSaving]=useState(false);
 const [testing,setTesting]=useState(false);
 const [message,setMessage]=useState("");

 useEffect(()=>{
  let mounted=true;
  Promise.all([
   SecureStore.getItemAsync(API_KEY),SecureStore.getItemAsync(MODEL_KEY),
   SecureStore.getItemAsync(GITHUB_SETTING_KEYS.token),SecureStore.getItemAsync(GITHUB_SETTING_KEYS.owner),
   SecureStore.getItemAsync(GITHUB_SETTING_KEYS.repo),SecureStore.getItemAsync(GITHUB_SETTING_KEYS.branch),
  ]).then(([key,selectedModel,token,savedOwner,savedRepo,savedBranch,savedClientId])=>{
   if(!mounted)return;
   setHasKey(Boolean(key));setModel(selectedModel||DEFAULT_MODEL);setHasGhToken(Boolean(token));
   setOwner(savedOwner||"");setRepo(savedRepo||"");setBranch(savedBranch||"main");
  }).catch(()=>{if(mounted)setMessage("Could not load saved settings.");});
  return()=>{mounted=false;};
 },[]);

 async function save(){
  const key=apiKey.trim(),selectedModel=model.trim();
  if(key&&!key.startsWith("sk-")){setMessage("Check your OpenAI API key format.");return;}
  if(!selectedModel||selectedModel.length>80){setMessage("Enter a valid model name.");return;}
  setSaving(true);setMessage("");
  try{
   if(key)await SecureStore.setItemAsync(API_KEY,key);
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
   const result=await testOpenAIConnection({apiKey:key,model});
   setMessage("AI is connected · "+result.model+" · "+result.response);
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
   while(Date.now()<deadline){
    await new Promise(resolve=>setTimeout(resolve,delay));
    const result=await pollGitHubDeviceFlow({clientId:id,deviceCode:flow.deviceCode});
    if(result.status==="complete"){
     await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.token,result.accessToken);
     if(result.refreshToken)await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.refreshToken,result.refreshToken);
     if(result.expiresIn)await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.expiresAt,String(Date.now()+result.expiresIn*1000));
     const account=await getGitHubAccount({token:result.accessToken});
     await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.owner,account.login);
     setOwner(account.login);setHasGhToken(true);setDeviceCode("");
     setMessage("GitHub connected. Add a repository name below to enable optional backup.");
     return;
    }
    if(result.status==="slow_down")delay+=5000;
   }
   throw new Error("GitHub sign-in expired. Please try again.");
  }catch(error){setMessage(error.message||"GitHub connection failed.");}
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
  try{await SecureStore.deleteItemAsync(API_KEY);setHasKey(false);setApiKey("");setMessage("Saved API key removed from this phone.");}
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
  <Text style={styles.eyebrow}>LEGEND AI</Text>
  <Text style={styles.title}>Settings</Text>
  <Text style={styles.description}>Add your own OpenAI API key to use AI. Your key stays in this phone's secure storage. Every user can use their own key; no Legend AI account or server is required.</Text>

  <Text style={styles.section}>AI PROVIDER</Text>
  <Text style={styles.label}>OPENAI API KEY</Text>
  <TextInput value={apiKey} onChangeText={setApiKey} placeholder={hasKey?"Saved securely · enter a new key to replace":"Paste your API key"} placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} secureTextEntry style={styles.input}/>
  <Text style={styles.hint}>{hasKey?"An API key is saved on this phone.":"You need your own OpenAI API billing/credits to use AI."}</Text>
  <Text style={styles.label}>MODEL</Text>
  <TextInput value={model} onChangeText={setModel} placeholder={DEFAULT_MODEL} placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
  <Pressable onPress={testAI} disabled={testingAI} style={[styles.secondary,testingAI&&styles.disabled]}>{testingAI?<ActivityIndicator color="#c3d0f2"/>:<Text style={styles.secondaryText}>Test AI connection</Text>}</Pressable>
  <Pressable onPress={save} disabled={saving} style={[styles.button,saving&&styles.disabled]}>{saving?<ActivityIndicator color="#09111f"/>:<Text style={styles.buttonText}>Save settings</Text>}</Pressable>
  {hasKey?<Pressable onPress={clearAI} style={styles.clear}><Text style={styles.clearText}>Remove saved API key</Text></Pressable>:null}

  <View style={styles.separator}/>
  <Pressable onPress={()=>setAdvancedOpen(value=>!value)} style={styles.advancedHeader}>
   <View><Text style={styles.section}>OPTIONAL GITHUB BACKUP</Text><Text style={styles.hint}>Only needed if you want to sync project files.</Text></View>
   <Text style={styles.chevron}>{advancedOpen?"−":"+"}</Text>
  </Pressable>
  {advancedOpen?<>
   <Text style={styles.description}>GitHub is optional. Tap Connect GitHub, enter the one-time code shown here on GitHub, and approve access. Your projects and chats remain on this phone.</Text>
   <Pressable onPress={connectGitHub} disabled={connecting} style={[styles.secondary,connecting&&styles.disabled]}>{connecting?<ActivityIndicator color="#c3d0f2"/>:<Text style={styles.secondaryText}>{hasGhToken?"Reconnect GitHub":"Connect GitHub"}</Text>}</Pressable>
   {deviceCode?<Text style={styles.message}>Enter this code on GitHub: {deviceCode}</Text>:null}
   <Text style={styles.label}>REPOSITORY NAME</Text>
   <TextInput value={repo} onChangeText={setRepo} placeholder="your-backup-repository" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
   <Text style={styles.label}>BRANCH (OPTIONAL)</Text>
   <TextInput value={branch} onChangeText={setBranch} placeholder="main" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
   <Pressable onPress={testGitHub} disabled={testing||!hasGhToken} style={[styles.secondary,(testing||!hasGhToken)&&styles.disabled]}>{testing?<ActivityIndicator color="#c3d0f2"/>:<Text style={styles.secondaryText}>Test backup repository</Text>}</Pressable>
   {hasGhToken?<Pressable onPress={clearGitHub} style={styles.clear}><Text style={styles.clearText}>Disconnect GitHub</Text></Pressable>:null}
  </>:null}
  {message?<Text style={styles.message}>{message}</Text>:null}
  <Text style={styles.warning}>AI usage may cost money through your provider. Never share your API key with anyone or commit it to GitHub.</Text>
 </ScrollView>;
}

const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:"#09111f"},
 content:{padding:24,paddingTop:42,paddingBottom:50},
 back:{color:"#a9bcff",fontSize:16,fontWeight:"700",marginBottom:25},
 eyebrow:{color:"#8ea8ff",fontSize:11,fontWeight:"900",letterSpacing:2,marginBottom:8},
 title:{color:"#f4f7ff",fontSize:29,fontWeight:"800",marginBottom:8},
 description:{color:"#9ba8bf",lineHeight:20,fontSize:12,marginBottom:10},
 section:{color:"#a9bcff",fontSize:11,fontWeight:"900",letterSpacing:1.4,marginTop:20,marginBottom:5},
 label:{color:"#91a0bb",fontSize:10,fontWeight:"900",letterSpacing:1.1,marginBottom:7,marginTop:14},
 input:{backgroundColor:"#131f32",borderColor:"#263651",borderWidth:1,borderRadius:12,padding:14,color:"#fff",fontSize:14},
 hint:{color:"#7889a5",fontSize:11,marginTop:7},
 button:{marginTop:16,backgroundColor:"#a9bcff",borderRadius:12,padding:15,alignItems:"center"},
 buttonText:{color:"#09111f",fontWeight:"900"},
 secondary:{marginTop:14,backgroundColor:"#172640",borderRadius:12,padding:14,alignItems:"center"},
 secondaryText:{color:"#c3d0f2",fontWeight:"800"},
 disabled:{opacity:.45},
 clear:{padding:12,alignItems:"center"},
 clearText:{color:"#ffb6c5",fontWeight:"700",fontSize:12},
 separator:{height:1,backgroundColor:"#263651",marginTop:22},
 advancedHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 chevron:{color:"#a9bcff",fontSize:24,padding:8},
 message:{color:"#c7d3ef",fontSize:12,marginTop:14,lineHeight:18},
 warning:{color:"#d7b98a",fontSize:11,lineHeight:17,marginTop:20}
});
