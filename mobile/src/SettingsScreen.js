import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as SecureStore from "expo-secure-store";
const API_KEY = "legend_ai_provider_api_key", MODEL_KEY = "legend_ai_model", DEFAULT_MODEL = "gpt-4.1-mini";
export default function SettingsScreen({ onBack }) {
  const [apiKey,setApiKey]=useState(""),[model,setModel]=useState(DEFAULT_MODEL),[hasKey,setHasKey]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
  useEffect(()=>{let mounted=true;Promise.all([SecureStore.getItemAsync(API_KEY),SecureStore.getItemAsync(MODEL_KEY)]).then(([key,savedModel])=>{if(mounted){setHasKey(Boolean(key));setModel(savedModel||DEFAULT_MODEL);}}).catch(()=>{if(mounted)setMessage("Saved settings read nahi ho paayi.");});return()=>{mounted=false;};},[]);
  async function save(){
    const key=apiKey.trim(),selectedModel=model.trim();
    if(key&&!key.startsWith("sk-")){setMessage("OpenAI API key ka format check karo.");return;}
    if(!key&&!hasKey){setMessage("Apni OpenAI API key dalo.");return;}
    if(!selectedModel||selectedModel.length>80){setMessage("Valid model name dalo.");return;}
    setSaving(true);setMessage("");
    try{if(key)await SecureStore.setItemAsync(API_KEY,key);await SecureStore.setItemAsync(MODEL_KEY,selectedModel);setApiKey("");setHasKey(true);setMessage("API key aur model phone ke Secure Storage mein save ho gaye.");}
    catch{setMessage("Settings save nahi hui. Dobara try karo.");}finally{setSaving(false);}
  }
  async function clearKey(){try{await SecureStore.deleteItemAsync(API_KEY);setHasKey(false);setApiKey("");setMessage("Phone se saved API key hata di.");}catch{setMessage("API key remove nahi ho paayi.");}}
  return <View style={styles.screen}>
    <Pressable onPress={onBack}><Text style={styles.back}>‹  Back</Text></Pressable>
    <Text style={styles.eyebrow}>ON-DEVICE AI</Text><Text style={styles.title}>AI settings</Text>
    <Text style={styles.description}>Apni OpenAI API key yahan save karo. AI request phone se seedha OpenAI ko jayegi; Legend AI hosting server ya database ki zarurat nahi hai. API usage ka bill alag se lag sakta hai.</Text>
    <Text style={styles.label}>OPENAI API KEY</Text>
    <TextInput value={apiKey} onChangeText={setApiKey} placeholder={hasKey?"Saved securely — enter new key to replace":"sk-..."} placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} secureTextEntry style={styles.input}/>
    <Text style={styles.hint}>{hasKey?"Key saved in Android SecureStore.":"No API key saved on this device."}</Text>
    <Text style={styles.label}>MODEL</Text><TextInput value={model} onChangeText={setModel} placeholder={DEFAULT_MODEL} placeholderTextColor="#78839a" autoCapitalize="none" autoCorrect={false} style={styles.input}/>
    <Pressable onPress={save} disabled={saving} style={styles.button}>{saving?<ActivityIndicator color="#09111f"/>:<Text style={styles.buttonText}>Save AI settings</Text>}</Pressable>
    {hasKey?<Pressable onPress={clearKey} style={styles.clear}><Text style={styles.clearText}>Remove saved API key</Text></Pressable>:null}
    {message?<Text style={styles.message}>{message}</Text>:null}
    <Text style={styles.warning}>Security: mobile app ki key server-side secret jitni secure nahi hoti. Rooted/compromised phone se expose ho sakti hai. Dedicated key aur provider usage limits use karo.</Text>
  </View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:"#09111f",padding:24,paddingTop:42},back:{color:"#a9bcff",fontSize:16,fontWeight:"700",marginBottom:28},eyebrow:{color:"#8ea8ff",fontSize:11,fontWeight:"900",letterSpacing:2,marginBottom:10},title:{color:"#f4f7ff",fontSize:29,fontWeight:"800",marginBottom:10},description:{color:"#9ba8bf",lineHeight:21,marginBottom:20},label:{color:"#91a0bb",fontSize:10,fontWeight:"900",letterSpacing:1.2,marginBottom:8,marginTop:16},input:{backgroundColor:"#131f32",borderColor:"#263651",borderWidth:1,borderRadius:13,padding:15,color:"#fff",fontSize:14},hint:{color:"#7889a5",fontSize:11,marginTop:8},button:{marginTop:26,backgroundColor:"#a9bcff",borderRadius:13,padding:16,alignItems:"center"},buttonText:{color:"#09111f",fontWeight:"900"},clear:{padding:15,alignItems:"center"},clearText:{color:"#ffb6c5",fontWeight:"700"},message:{color:"#c7d3ef",fontSize:12,marginTop:14},warning:{color:"#d7b98a",fontSize:11,lineHeight:17,marginTop:22}});
