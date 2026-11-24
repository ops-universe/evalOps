/** Explicitly configured OpenAI-compatible Chat Completions transport.
 * No automatic retries, model discovery, tools or default endpoint.
 * Caller owns credentials, endpoint trust and provider data policy.
 */
export function chatCompletionsAdapter({endpoint,apiKey,model,fetchImpl=globalThis.fetch}){
 const url=new URL(endpoint);
 if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search)throw new Error('Explicit HTTPS endpoint required');
 if(typeof apiKey!=='string'||!apiKey||/[\r\n]/.test(apiKey)||typeof model!=='string'||!model||model.length>128||typeof fetchImpl!=='function')throw new Error('Invalid adapter configuration');
 return {id:'chat-completions',model,external:true,async judge(request,{signal}){
  const response=await fetchImpl(url.href,{method:'POST',redirect:'error',signal,headers:{'content-type':'application/json',authorization:'Bearer '+apiKey},body:JSON.stringify({model,messages:[{role:'system',content:request.system+'\nTrusted rubric: '+JSON.stringify(request.rubric)},{role:'user',content:JSON.stringify(request.data)}],temperature:0,max_tokens:1024,response_format:{type:'json_object'}})});
  if(!response.ok)throw new Error('Judge provider HTTP '+response.status);
  if(!response.body)throw new Error('Missing provider body');
  const reader=response.body.getReader();const chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536)throw new Error('Provider response too large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  const decoded=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));
  let payload;try{payload=JSON.parse(decoded);}catch{throw new Error('Invalid provider JSON');}
  const choice=payload?.choices?.[0];
  if(choice?.finish_reason!=='stop'||typeof choice.message?.content!=='string'||choice.message.tool_calls?.length)throw new Error('Incomplete or unsupported provider response');
  return choice.message.content;
 }};
}
