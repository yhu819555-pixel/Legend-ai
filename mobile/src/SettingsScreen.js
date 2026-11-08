import React,{useEffect,useState} from "react";
import {ActivityIndicator,Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import * as SecureStore from "expo-secure-store";
import {GITHUB_SETTING_KEYS,getGitHubAccount,pollGitHubDeviceFlow,startGitHubDeviceFlow,testGitHubConnection} from "./githubSync.js";
import {testOpenAIConnection} from "./chatClient.js";
const API_KEY="legend_ai_provider_api_key",MODEL_KEY="legend_ai_model",DEFAULT_MODEL="gpt-4.1-mini";
export default function SettingsScreen({onBack}){
 const [apiKey,setApiKey]=useState(""),[model,setModel]=useState(DEFAULT_MODEL),[hasKey,setHasKey]=useState(false),[testingAI,setTestingAI]=useState(false);
 const [ghToken,setGhToken]=useState(""),[owner,setOwner]=useState(""),[repo,setRepo]=useState(""),[branch,setBranch]=useState("main"),[hasGhToken,setHasGhToken]=useState(false),[clientId,setClientId]=useState(""),[connecting,setConnecting]=useState(false),[deviceCode,setDeviceCode]=useState("");
 const [saving,setSaving]=useState(false),[testing,setTesting]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{let mounted=true;Promise.all([SecureStore.getItemAsync(API_KEY),SecureStore.getItemAsync(MODEL_KEY),SecureStore.getItemAsync(GITHUB_SETTING_KEYS.token),SecureStore.getItemAsync(GITHUB_SETTING_KEYS.owner),SecureStore.getItemAsync(GITHUB_SETTING_KEYS.repo),SecureStore.getItemAsync(GITHUB_SETTING_KEYS.branch),SecureStore.getItemAsync(GITHUB_SETTING_KEYS.clientId)]).then(([key,m,t,o,r,b,c])=>{if(mounted){setHasKey(Boolean(key));setModel(m||DEFAULT_MODEL);setHasGhToken(Boolean(t));setOwner(o||"");setRepo(r||"");setBranch(b||"main");setClientId(c||"");}}).catch(()=>{if(mounted)setMessage("Saved settings read nahi ho paayi.");});return()=>{mounted=false;};},[]);
 async function save(){
  const key=apiKey.trim(),selectedModel=model.trim(),token=ghToken.trim(),cleanOwner=owner.trim(),cleanRepo=repo.trim(),cleanBranch=branch.trim()||"main";
  if(key&&!key.startsWith("sk-")){setMessage("OpenAI API key ka format check karo.");return;}
  if(!selectedModel||selectedModel.length>80){setMessage("Valid model name dalo.");return;}
  if((token||cleanOwner||cleanRepo)&&(!cleanOwner||!cleanRepo||(!token&&!hasGhToken))){setMessage("GitHub sync ke liye token, owner aur repository teeno bharna zaroori hai.");return;}
  if(cleanOwner&&!/^[A-Za-z0-9-]{1,39}$/.test(cleanOwner)){setMessage("GitHub owner/username valid nahi hai.");return;}
  if(cleanRepo&&!/^[A-Za-z0-9._-]{1,100}$/.test(cleanRepo)){setMessage("GitHub repository name valid nahi hai.");return;}
  setSaving(true);setMessage("");
  try{
   if(key)await SecureStore.setItemAsync(API_KEY,key);await SecureStore.setItemAsync(MODEL_KEY,selectedModel);
   if(token)await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.token,token);
   if(cleanOwner)await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.owner,cleanOwner);
   if(cleanRepo)await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.repo,cleanRepo);
   await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.branch,cleanBranch);if(clientId.trim())await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.clientId,clientId.trim());
   setApiKey("");setGhToken("");setHasKey(Boolean(key)||hasKey);setHasGhToken(Boolean(token)||hasGhToken);setMessage("Settings phone ke Secure Storage mein save ho gayi.");
  }catch{setMessage("Settings save nahi hui. Dobara try karo.");}finally{setSaving(false);}
 }
 async function testAI(){setTestingAI(true);setMessage("");try{const key=apiKey.trim()||await SecureStore.getItemAsync(API_KEY);const result=await testOpenAIConnection({apiKey:key,model});setMessage("OpenAI API working. Model: "+result.model+" · Test response: "+result.response);}catch(e){setMessage(e.message||"OpenAI test fail.");}finally{setTestingAI(false);}}
 async function connectGitHub(){setConnecting(true);setMessage("");setDeviceCode("");try{
  const id=clientId.trim()||await SecureStore.getItemAsync(GITHUB_SETTING_KEYS.clientId);
  if(!id) throw new Error("GitHub OAuth App Client ID dalo. Password ya token share nahi karna.");
  const flow=await startGitHubDeviceFlow(id);setDeviceCode(flow.userCode);await Linking.openURL(flow.verificationUri);
  const deadline=Date.now()+flow.expiresIn*1000;let delay=flow.interval*1000;
  while(Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,delay));const result=await pollGitHubDeviceFlow({clientId:id,deviceCode:flow.deviceCode});
   if(result.status==="complete"){await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.token,result.accessToken);if(result.refreshToken)await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.refreshToken,result.refreshToken);if(result.expiresIn)await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.expiresAt,String(Date.now()+result.expiresIn*1000));const account=await getGitHubAccount({token:result.accessToken});await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.owner,account.login);await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.clientId,id);setOwner(account.login);setGhToken("");setHasGhToken(true);setDeviceCode("");setMessage("GitHub account connected: @"+account.login+". Repository name bharo aur Save all settings dabao.");return;}
   if(result.status==="slow_down")delay+=5000;
  }
  throw new Error("GitHub sign-in code expire ho gaya. Dobara Connect dabao.");
 }catch(e){setMessage(e.message||"GitHub connection fail.");}finally{setConnecting(false);}}
 async function testGitHub(){setTesting(true);setMessage("");try{await Promise.all([SecureStore.setItemAsync(GITHUB_SETTING_KEYS.owner,owner.trim()),SecureStore.setItemAsync(GITHUB_SETTING_KEYS.repo,repo.trim()),SecureStore.setItemAsync(GITHUB_SETTING_KEYS.branch,branch.trim()||"main")]);const result=await testGitHubConnection();const selectedBranch=result.defaultBranch||"main";setBranch(selectedBranch);await SecureStore.setItemAsync(GITHUB_SETTING_KEYS.branch,selectedBranch);setMessage("GitHub connected: "+result.fullName+" ("+(result.private?"private":"public")+") · Branch: "+selectedBranch);}catch(e){setMessage(e.message||"GitHub connection fail.");}finally{setTesting(false);}}
 async function clearAI(){try{await SecureStore.deleteItemAsync(API_KEY);setHasKey(false);setApiKey("");setMessage("OpenAI key phone se remove ho gayi.");}catch{setMessage("API key remove nahi ho paayi.");}}
 async function clearGitHub(){try{await Promise.all(Object.values(GITHUB_SETTING_KEYS).map(k=>SecureStore.deleteItemAsync(k)));setHasGhToken(false);setGhToken("");setOwner("");setRepo("");setBranch("main");setClientId("");setDeviceCode("");setMessage("GitHub credentials phone se remove ho gaye.");}catch{setMessage("GitHub credentials remove nahi ho paaye.");}}
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <Pressable onPress={onBack}><Text style={styles.back}>‹  Back</Text></Pressable>
  <Text style={styles.eyebrow}>ON-DEVICE AI</Text><Text style={styles.title}>Settings</Text>
  <Text style={styles.description}>AI request phone se seedha OpenAI ko jayegi. Hosting server ya database ki zarurat nahi. API usage ka bill alag se lag sakta hai.</Text>
  <Text style={styles.section}>OPENAI AI</Text><Text style={styles.label}>API KEY</Text>
  <TextInput value={apiKey} onChangeText={setApiKey} placeholder={hasKey?"Saved securely — enter new key to replace":"sk-..."} placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} secureTextEntry style={styles.input}/>
  <Text style={styles.hint}>{hasKey?"Key saved in Android SecureStore.":"No API key saved on this device."}</Text>
  <Pressable onPress={testAI} disabled={testingAI} style={[styles.secondary,testingAI&&styles.disabled]}>{testingAI?<ActivityIndicator color="#c3d0f2"/>:<Text style={styles.secondaryText}>Test OpenAI API</Text>}</Pressable>
  <Text style={styles.label}>MODEL</Text><TextInput value={model} onChangeText={setModel} placeholder={DEFAULT_MODEL} placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
  {hasKey?<Pressable onPress={clearAI} style={styles.clear}><Text style={styles.clearText}>Remove OpenAI API key</Text></Pressable>:null}
  <View style={styles.separator}/>
  <Text style={styles.section}>GITHUB ACCOUNT CONNECTION</Text>
  <Text style={styles.description}>GitHub OAuth App ka Client ID ek baar set karo (GitHub Settings → Developer settings → OAuth Apps → New OAuth App; Device Flow enable karo). Connect dabane par GitHub ka official login page khulega; wahan code approve karo. Password ya token paste nahi karna. Public repo scope tumhare account ke sab public repos tak access de sakta hai; private repo support is OAuth setup mein nahi hai.</Text>
  <Text style={styles.label}>GITHUB OAUTH APP CLIENT ID</Text><TextInput value={clientId} onChangeText={setClientId} placeholder="Iv1.xxxxxxxxxxxxxxxx" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
  <Pressable onPress={connectGitHub} disabled={connecting} style={[styles.button,connecting&&styles.disabled]}>{connecting?<ActivityIndicator color="#09111f"/>:<Text style={styles.buttonText}>Connect GitHub account</Text>}</Pressable>
  {deviceCode?<Text style={styles.message}>GitHub par ye code enter karo: {deviceCode}</Text>:null}
  <Text style={styles.section}>GITHUB BACKUP / SYNC</Text>
  <Text style={styles.description}>GitHub account OAuth se connect hota hai. Is public repository ke liye app public_repo permission maangti hai. Owner aur repository ka exact naam bharo; Test GitHub connection default branch khud select kar dega.</Text>
  <Text style={styles.hint}>{hasGhToken?"GitHub account authorized on this phone.":"GitHub account not connected yet."}</Text>
  <Text style={styles.label}>GITHUB OWNER / USERNAME</Text><TextInput value={owner} onChangeText={setOwner} placeholder="your-github-username" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
  <Text style={styles.label}>REPOSITORY</Text><TextInput value={repo} onChangeText={setRepo} placeholder="Legend-ai" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
  <Text style={styles.label}>BRANCH</Text><TextInput value={branch} onChangeText={setBranch} placeholder="main" placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
  <Pressable onPress={testGitHub} disabled={testing||!hasGhToken} style={[styles.secondary,(testing||!hasGhToken)&&styles.disabled]}>{testing?<ActivityIndicator color="#c3d0f2"/>:<Text style={styles.secondaryText}>Test GitHub connection</Text>}</Pressable>
  {hasGhToken?<Pressable onPress={clearGitHub} style={styles.clear}><Text style={styles.clearText}>Remove GitHub credentials</Text></Pressable>:null}
  <Pressable onPress={save} disabled={saving} style={styles.button}>{saving?<ActivityIndicator color="#09111f"/>:<Text style={styles.buttonText}>Save all settings</Text>}</Pressable>
  {message?<Text style={styles.message}>{message}</Text>:null}
  <Text style={styles.warning}>Security: phone mein saved keys/tokens rooted ya compromised device par expose ho sakte hain. Dedicated tokens, minimum permissions aur provider usage limits rakho. OAuth access token ko chat ya GitHub source code mein kabhi paste mat karo.</Text>
 </ScrollView>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:"#09111f"},content:{padding:24,paddingTop:42,paddingBottom:50},back:{color:"#a9bcff",fontSize:16,fontWeight:"700",marginBottom:25},eyebrow:{color:"#8ea8ff",fontSize:11,fontWeight:"900",letterSpacing:2,marginBottom:8},title:{color:"#f4f7ff",fontSize:29,fontWeight:"800",marginBottom:8},description:{color:"#9ba8bf",lineHeight:20,fontSize:12,marginBottom:10},section:{color:"#a9bcff",fontSize:11,fontWeight:"900",letterSpacing:1.4,marginTop:20,marginBottom:5},label:{color:"#91a0bb",fontSize:10,fontWeight:"900",letterSpacing:1.1,marginBottom:7,marginTop:14},input:{backgroundColor:"#131f32",borderColor:"#263651",borderWidth:1,borderRadius:12,padding:14,color:"#fff",fontSize:14},hint:{color:"#7889a5",fontSize:11,marginTop:7},button:{marginTop:22,backgroundColor:"#a9bcff",borderRadius:12,padding:15,alignItems:"center"},buttonText:{color:"#09111f",fontWeight:"900"},secondary:{marginTop:14,backgroundColor:"#172640",borderRadius:12,padding:14,alignItems:"center"},secondaryText:{color:"#c3d0f2",fontWeight:"800"},disabled:{opacity:.45},clear:{padding:12,alignItems:"center"},clearText:{color:"#ffb6c5",fontWeight:"700",fontSize:12},separator:{height:1,backgroundColor:"#263651",marginTop:22},message:{color:"#c7d3ef",fontSize:12,marginTop:14,lineHeight:18},warning:{color:"#d7b98a",fontSize:11,lineHeight:17,marginTop:20}});
