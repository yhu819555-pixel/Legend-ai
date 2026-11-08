import { readProjectFiles, saveProjectFile } from "./projectFiles.js";

const KEYS={token:"legend_ai_github_token",clientId:"legend_ai_github_oauth_client_id",refreshToken:"legend_ai_github_refresh_token",expiresAt:"legend_ai_github_expires_at",owner:"legend_ai_github_owner",repo:"legend_ai_github_repo",branch:"legend_ai_github_branch"};
export async function getGitHubConfig(store){
 const secureStore=store || await import("expo-secure-store");
 const [token,owner,repo,branch,clientId,refreshToken,expiresAt]=await Promise.all([secureStore.getItemAsync(KEYS.token),secureStore.getItemAsync(KEYS.owner),secureStore.getItemAsync(KEYS.repo),secureStore.getItemAsync(KEYS.branch),secureStore.getItemAsync(KEYS.clientId),secureStore.getItemAsync(KEYS.refreshToken),secureStore.getItemAsync(KEYS.expiresAt)]);
 if(!token||!owner||!repo)return null;
 if(!/^[A-Za-z0-9-]{1,39}$/.test(owner)||!/^[A-Za-z0-9._-]{1,100}$/.test(repo)||/[.]{2}/.test(repo))return null;
 return {token,owner,repo,branch:branch||"main",clientId,refreshToken,expiresAt:expiresAt?Number(expiresAt):null,store:secureStore};
}

export async function startGitHubDeviceFlow(clientId,{fetchImpl=fetch}={}) {
 const id=String(clientId||"").trim();
 if(!id) throw new Error("GitHub OAuth App Client ID Settings mein dalo.");
 const response=await fetchImpl("https://github.com/login/device/code",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded",accept:"application/json"},body:"client_id="+encodeURIComponent(id)+"&scope=public_repo"});
 const data=await response.json();
 if(!response.ok||!data.device_code||!data.user_code) throw new Error(data.error_description||data.message||"GitHub sign-in shuru nahi hua.");
 return {deviceCode:data.device_code,userCode:data.user_code,verificationUri:data.verification_uri||"https://github.com/login/device",expiresIn:Number(data.expires_in)||900,interval:Math.max(5,Number(data.interval)||5)};
}
export async function pollGitHubDeviceFlow({clientId,deviceCode,fetchImpl=fetch}={}) {
 const response=await fetchImpl("https://github.com/login/oauth/access_token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded",accept:"application/json"},body:"client_id="+encodeURIComponent(String(clientId||""))+"&device_code="+encodeURIComponent(String(deviceCode||""))+"&grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code"});
 const data=await response.json();
 if(data.access_token) return {status:"complete",accessToken:data.access_token,scope:data.scope};
 if(data.error==="authorization_pending") return {status:"pending"};
 if(data.error==="slow_down") return {status:"slow_down"};
 if(data.error==="expired_token"||data.error==="access_denied") throw new Error(data.error_description||"GitHub authorization expired or was denied.");
 throw new Error(data.error_description||data.message||"GitHub sign-in failed.");
}
export async function getGitHubAccount({token,fetchImpl=fetch}={}) {
 const response=await fetchImpl("https://api.github.com/user",{headers:{authorization:"Bearer "+token,accept:"application/vnd.github+json","x-github-api-version":"2022-11-28"}});
 if(!response.ok) throw new Error("GitHub account verify nahi hua ("+response.status+").");
 return response.json();
}

function encodeBase64(value){
 const bytes=new TextEncoder().encode(String(value));
 let binary="";for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
 if(typeof btoa!=="function")throw new Error("Base64 encoder unavailable on this device.");
 return btoa(binary);
}
function decodeBase64(value){
 const clean=String(value||"").replace(/\s/g,"");
 if(typeof atob!=="function")throw new Error("Base64 decoder unavailable on this device.");
 const binary=atob(clean),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return new TextDecoder().decode(bytes);
}

async function refreshGitHubToken(config,fetchImpl=fetch) {
 if(!config.refreshToken||!config.clientId||!config.expiresAt||Date.now()<config.expiresAt-60000)return;
 const response=await fetchImpl("https://github.com/login/oauth/access_token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded",accept:"application/json"},body:"client_id="+encodeURIComponent(config.clientId)+"&grant_type=refresh_token&refresh_token="+encodeURIComponent(config.refreshToken)});
 const data=await response.json();
 if(!response.ok||!data.access_token)throw new Error(data.error_description||data.error||"GitHub login expire ho gaya. Dobara Connect GitHub karo.");
 config.token=data.access_token;
 config.refreshToken=data.refresh_token||config.refreshToken;
 config.expiresAt=Date.now()+(Number(data.expires_in)||28800)*1000;
 if(config.store){await config.store.setItemAsync(KEYS.token,config.token);if(data.refresh_token)await config.store.setItemAsync(KEYS.refreshToken,config.refreshToken);await config.store.setItemAsync(KEYS.expiresAt,String(config.expiresAt));}
}
\nasync function github(path,{method="GET",body,config,fetchImpl=fetch}={}){\n await refreshGitHubToken(config,fetchImpl);
 const response=await fetchImpl("https://api.github.com"+path,{method,headers:{authorization:"Bearer "+config.token,accept:"application/vnd.github+json","x-github-api-version":"2022-11-28",...(body?{"content-type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok){let detail="";try{detail=(await response.json()).message||"";}catch{}const error=new Error("GitHub API "+response.status+(detail?": "+detail:""));error.status=response.status;throw error;}
 return response.status===204?{}:response.json();
}
function projectPath(projectId){if(!/^[A-Za-z0-9._-]{1,100}$/.test(projectId))throw new TypeError("Invalid project ID.");return "legend-ai-projects/"+projectId;}
export async function testGitHubConnection({config:provided,store,fetchImpl=fetch}={}){
 const config=provided||await getGitHubConfig(store);if(!config)throw new Error("Settings mein GitHub token, owner aur repository save karo.");
 const result=await github("/repos/"+encodeURIComponent(config.owner)+"/"+encodeURIComponent(config.repo),{config,fetchImpl});
 return {fullName:result.full_name,defaultBranch:result.default_branch,private:result.private};
}
export async function pushProjectToGitHub(project,storage,{config:provided,store,fetchImpl=fetch}={}){
 const config=provided||await getGitHubConfig(store);if(!config)throw new Error("GitHub Settings pehle configure karo.");
 const files=await readProjectFiles(storage,project.id),base=projectPath(project.id);
 for(const file of files){
  const path=base+"/"+encodeURIComponent(file.name);
  let sha;try{const current=await github("/repos/"+config.owner+"/"+config.repo+"/contents/"+path+"?ref="+encodeURIComponent(config.branch),{config,fetchImpl});sha=current.sha;}catch(error){if(error.status!==404)throw error;}
  await github("/repos/"+config.owner+"/"+config.repo+"/contents/"+path,{method:"PUT",config,fetchImpl,body:{message:"Legend AI: sync "+file.name,content:encodeBase64(file.content),branch:config.branch,...(sha?{sha}:{})}});
 }
 return {pushed:files.length,repository:config.owner+"/"+config.repo,path:base};
}
export async function pullProjectFromGitHub(project,storage,{config:provided,store,fetchImpl=fetch}={}){
 const config=provided||await getGitHubConfig(store);if(!config)throw new Error("GitHub Settings pehle configure karo.");
 const base=projectPath(project.id),url="/repos/"+config.owner+"/"+config.repo+"/contents/"+base+"?ref="+encodeURIComponent(config.branch);
 let remote;try{remote=await github(url,{config,fetchImpl});}catch(error){if(error.status===404)return {pulled:0,repository:config.owner+"/"+config.repo,path:base};throw error;}
 if(!Array.isArray(remote))throw new Error("GitHub project folder response invalid hai.");
 const local=await readProjectFiles(storage,project.id);
 let pulled=0;
 for(const entry of remote){
  if(entry.type!=="file"||entry.size>20000||!entry.name||entry.name.includes("/")||entry.name==="."||entry.name==="..")continue;
  const detail=await github("/repos/"+config.owner+"/"+config.repo+"/contents/"+base+"/"+encodeURIComponent(entry.name)+"?ref="+encodeURIComponent(config.branch),{config,fetchImpl});
  if(detail.encoding!=="base64"||typeof detail.content!=="string")continue;
  const content=decodeBase64(detail.content),existing=local.find(item=>item.name===entry.name);
  await saveProjectFile(storage,project.id,{id:existing?.id||"",name:entry.name,content});
  pulled++;
 }
 return {pulled,repository:config.owner+"/"+config.repo,path:base};
}
export const GITHUB_SETTING_KEYS=KEYS;
