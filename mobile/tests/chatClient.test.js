import test from "node:test";
import assert from "node:assert/strict";
import {testProviderConnection,sendChatMessage} from "../src/chatClient.js";

function jsonResponse(payload,status=200){
 return {ok:status>=200&&status<300,status,json:async()=>payload};
}

test("Groq/OpenAI-compatible provider uses configured URL and bearer key",async()=>{
 let request;
 const result=await testProviderConnection({provider:"groq",apiKey:"test-key",model:"test-model",fetchImpl:async(url,options)=>{request={url,options};return jsonResponse({choices:[{message:{content:"OK"}}]});}});
 assert.equal(request.url,"https://api.groq.com/openai/v1/chat/completions");
 assert.equal(request.options.headers.authorization,"Bearer test-key");
 assert.equal(JSON.parse(request.options.body).model,"test-model");
 assert.equal(result.response,"OK");
});

test("Gemini adapter sends key and reads candidate text",async()=>{
 let request;
 const result=await testProviderConnection({provider:"gemini",apiKey:"test-gemini-key",model:"gemini-test",fetchImpl:async(url,options)=>{request={url,options};return jsonResponse({candidates:[{content:{parts:[{text:"OK"}]}}]});}});
 assert.match(request.url,/key=test-gemini-key/);
 assert.equal(JSON.parse(request.options.body).contents[0].parts[0].text,"Connection test");
 assert.equal(result.response,"OK");
});

test("custom OpenAI-compatible endpoint supports chat replies",async()=>{
 const result=await sendChatMessage({provider:"custom",baseUrl:"https://example.test/v1/",apiKey:"test-key",model:"custom-model",messages:[{role:"user",content:"Hi"}],fetchImpl:async(url)=>{assert.equal(url,"https://example.test/v1/chat/completions");return jsonResponse({choices:[{message:{content:"Hello"}}]});}});
 assert.equal(result,"Hello");
});

test("provider request reports authentication errors",async()=>{
 await assert.rejects(()=>testProviderConnection({provider:"groq",apiKey:"bad",model:"x",fetchImpl:async()=>jsonResponse({error:{message:"Unauthorized"}},401)}),/API key invalid/);
});
