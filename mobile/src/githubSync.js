import * as SecureStore from "expo-secure-store";
import { readProjectFiles, saveProjectFile } from "./projectFiles.js";

const KEYS={token:"legend_ai_github_token",owner:"legend_ai_github_owner",repo:"legend_ai_github_repo",branch:"legend_ai_github_branch"};
export async function getGitHubConfig(store=SecureStore){
 const [token,owner,repo,branch]=await Promise.all([store.getItemAsync(KEYS.token),store.getItemAsync(KEYS.owner),store.getItemAsync(KEYS.repo),store.getItemAsync(KEYS.branch)]);
 if(!token||!owner||!repo)return null;
 if(!/^[A-Za-z0-9-]{1,39}$/.test(owner)||!/^[A-Za-z0-9._-]{1,100}$/.test(repo)||/[.]{2}/.test(repo))return null;
 return {token,owner,repo,branch:branch||"main"};
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
async function github(path,{method="GET",body,config,fetchImpl=fetch}={}){
 const response=await fetchImpl("https://api.github.com"+path,{method,headers:{authorization:"Bearer "+config.token,accept:"application/vnd.github+json","x-github-api-version":"2022-11-28",...(body?{"content-type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok){let detail="";try{detail=(await response.json()).message||"";}catch{}const error=new Error("GitHub API "+response.status+(detail?": "+detail:""));error.status=response.status;throw error;}
 return response.status===204?{}:response.json();
}
function projectPath(projectId){if(!/^[A-Za-z0-9._-]{1,100}$/.test(projectId))throw new TypeError("Invalid project ID.");return "legend-ai-projects/"+projectId;}
export async function testGitHubConnection({config:provided,store=SecureStore,fetchImpl=fetch}={}){
 const config=provided||await getGitHubConfig(store);if(!config)throw new Error("Settings mein GitHub token, owner aur repository save karo.");
 const result=await github("/repos/"+encodeURIComponent(config.owner)+"/"+encodeURIComponent(config.repo),{config,fetchImpl});
 return {fullName:result.full_name,defaultBranch:result.default_branch,private:result.private};
}
export async function pushProjectToGitHub(project,storage,{config:provided,store=SecureStore,fetchImpl=fetch}={}){
 const config=provided||await getGitHubConfig(store);if(!config)throw new Error("GitHub Settings pehle configure karo.");
 const files=await readProjectFiles(storage,project.id),base=projectPath(project.id);
 for(const file of files){
  const path=base+"/"+encodeURIComponent(file.name);
  let sha;try{const current=await github("/repos/"+config.owner+"/"+config.repo+"/contents/"+path+"?ref="+encodeURIComponent(config.branch),{config,fetchImpl});sha=current.sha;}catch(error){if(error.status!==404)throw error;}
  await github("/repos/"+config.owner+"/"+config.repo+"/contents/"+path,{method:"PUT",config,fetchImpl,body:{message:"Legend AI: sync "+file.name,content:encodeBase64(file.content),branch:config.branch,...(sha?{sha}:{})}});
 }
 return {pushed:files.length,repository:config.owner+"/"+config.repo,path:base};
}
export async function pullProjectFromGitHub(project,storage,{config:provided,store=SecureStore,fetchImpl=fetch}={}){
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
