// Server-to-server bridge. Uses only the project's service-role credential.
// No tokens are stored or logged, and callers cannot choose an upstream URL.
type Runtime = {env:{get(name:string):string|undefined};serve(handler:(request:Request)=>Promise<Response>):void};
const runtime=(globalThis as unknown as {Deno?:Runtime}).Deno;
const headers={'content-type':'application/json','cache-control':'no-store'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
async function equalSecret(a:string,b:string){
 const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [x,y]=await Promise.all([digest(a),digest(b)]);let difference=0;for(let i=0;i<x.length;i++)difference|=x[i]^y[i];return difference===0;
}
// A valid legacy service-role JWT can differ from the exact key injected into
// this runtime. Claims only prefilter requests; Auth verifies the signature and
// administrative privilege before any Minecraft request is allowed.
async function verifyServiceRole(bearer:string,supabaseUrl:string|undefined,fetcher:typeof fetch):Promise<'authorized'|'unauthorized'|'unavailable'>{
 if(!supabaseUrl)return 'unauthorized';
 let origin:URL;
 try{origin=new URL(supabaseUrl);}catch{return 'unauthorized';}
 if(origin.protocol!=='https:' || !/^[a-z0-9]+\.supabase\.co$/.test(origin.hostname) || origin.port || origin.username || origin.password)return 'unauthorized';
 try{
  const parts=bearer.split('.');
  if(parts.length!==3 || !parts.every(part=>/^[A-Za-z0-9_-]+$/.test(part)))return 'unauthorized';
  const claims=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'))) as {iss?:unknown;ref?:unknown;role?:unknown;exp?:unknown};
  if(claims.iss!=='supabase' || claims.ref!==origin.hostname.split('.')[0] || claims.role!=='service_role' || typeof claims.exp!=='number' || claims.exp<=Date.now()/1000)return 'unauthorized';
 }catch{return 'unauthorized';}
 try{
  const response=await fetcher(new URL('/auth/v1/admin/users?page=1&per_page=1',origin).href,{headers:{apikey:bearer,authorization:`Bearer ${bearer}`},redirect:'error',signal:AbortSignal.timeout(2000)});
  await response.body?.cancel();
  if(response.status===200)return 'authorized';
  return response.status===401 || response.status===403 ? 'unauthorized' : 'unavailable';
 }catch{return 'unavailable';}
}
export async function handle(request:Request,secret=runtime?.env.get('SUPABASE_SERVICE_ROLE_KEY'),fetcher:typeof fetch=fetch,supabaseUrl=runtime?.env.get('SUPABASE_URL')):Promise<Response>{
 if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
 if(!secret)return reply({error:'relay_not_configured'},503);
 const bearer=request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
 let keys:string[]=[secret];try{const extra=JSON.parse(runtime?.env.get('SUPABASE_SECRET_KEYS') ?? '{}');keys.push(...Object.values(extra).filter((v):v is string=>typeof v==='string'));}catch{}
 if(!bearer || bearer.length>8192)return reply({error:'unauthorized'},401);
 if(!(await Promise.all(keys.map(key=>equalSecret(bearer,key)))).some(Boolean)){
  const permission=await verifyServiceRole(bearer,supabaseUrl,fetcher);
  if(permission!=='authorized')return reply({error:permission==='unavailable' ? 'relay_auth_unavailable' : 'unauthorized'},permission==='unavailable' ? 503 : 401);
 }
 if(!request.headers.get('content-type')?.includes('application/json'))return reply({error:'invalid_request'},400);
 let input:{operation?:unknown;identityToken?:unknown;accessToken?:unknown};
 try{const body=await request.text();if(body.length>40000)return reply({error:'request_too_large'},413);input=JSON.parse(body);if(!input || typeof input!=='object')return reply({error:'invalid_request'},400);}catch{return reply({error:'invalid_request'},400);}
 let url:string;let init:RequestInit;
 if(input.operation==='exchange' && typeof input.identityToken==='string' && input.identityToken.length<=32768 && /^XBL3\.0 x=[a-zA-Z0-9]+;[a-zA-Z0-9_=+/.\-]+$/.test(input.identityToken)){
  url='https://api.minecraftservices.com/authentication/login_with_xbox';init={method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({identityToken:input.identityToken})};
 }else if(input.operation==='profile' && typeof input.accessToken==='string' && input.accessToken.length<=16384 && /^[a-zA-Z0-9_.\-]+$/.test(input.accessToken)){
  url='https://api.minecraftservices.com/minecraft/profile';init={headers:{authorization:`Bearer ${input.accessToken}`,accept:'application/json'}};
 }else if(input.operation==='health'){
  url='https://api.minecraftservices.com/authentication/login_with_xbox';init={method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({identityToken:'XBL3.0 x=0;invalid-diagnostic-token'})};
 }else{return reply({error:'invalid_request'},400);}
 try{
  const response=await fetcher(url,{...init,redirect:'error',signal:AbortSignal.timeout(12000)});
  const isJson=response.headers.get('content-type')?.includes('application/json') ?? false;
  if(input.operation==='health')return reply({reachable:response.status===401 && isJson,upstreamStatus:response.status},response.status===401 && isJson ? 200 : 502);
  if(!isJson)return reply({error:'minecraft_network_denied'},502);
  const data=await response.json() as Record<string,unknown>|null;
  if(!response.ok){
   // Keep only known error codes. Never reflect upstream bodies or credentials.
   const notApproved=/invalid app registration/i.test(String(data?.errorMessage ?? ''));
   return reply({error:notApproved ? 'minecraft_app_not_approved' : response.status===404 && input.operation==='profile' ? 'minecraft_no_java_profile' : 'minecraft_upstream_rejected'},response.status);
  }
  return reply(data);
 }catch{return reply({error:'minecraft_transport_failed'},502);}
}
if(runtime)runtime.serve(request=>handle(request));
