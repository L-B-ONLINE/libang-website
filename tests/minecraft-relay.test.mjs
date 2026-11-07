import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../supabase/functions/minecraft-auth/index.ts';
import {minecraftRelayRequest} from '../lib/minecraft-relay.ts';
const secret='test-server-credential';
const request=data=>new Request('https://project.supabase.co/functions/v1/minecraft-auth',{method:'POST',headers:{authorization:`Bearer ${secret}`,'content-type':'application/json'},body:JSON.stringify(data)});
const config={enabled:true,supabaseUrl:'https://bincitlebgzjsfnmngrm.supabase.co',serviceRoleKey:secret};
test('anonymous, publishable and user credentials cannot use the bridge',async()=>{
 for(const key of ['', 'public-key', 'user-jwt']){
  const r=new Request('https://project.supabase.co',{method:'POST',headers:{authorization:`Bearer ${key}`,'content-type':'application/json'},body:'{"operation":"health"}'});
  assert.equal((await handle(r,secret,()=>{throw Error('must not fetch');})).status,401);
 }
});
test('bridge accepts only the two fixed operations, no arbitrary proxy',async()=>{
 for(const data of [{operation:'fetch',url:'https://example.com'},{operation:'profile',accessToken:'a\r\nX-Evil: yes'},{operation:'exchange',identityToken:'nope'}]){
  assert.equal((await handle(request(data),secret,()=>{throw Error('must not fetch');})).status,400);
 }
});
test('exchange forwards XSTS identity only to the official endpoint',async()=>{
 let called=false;
 const result=await handle(request({operation:'exchange',identityToken:'XBL3.0 x=123;xsts-token'}),secret,async(url,init)=>{
  called=true;assert.equal(url,'https://api.minecraftservices.com/authentication/login_with_xbox');assert.equal(init.redirect,'error');assert.deepEqual(JSON.parse(init.body),{identityToken:'XBL3.0 x=123;xsts-token'});assert.ok(!JSON.stringify(init).includes(secret));return Response.json({access_token:'minecraft-token'});
 });
 assert.ok(called);assert.deepEqual(await result.json(),{access_token:'minecraft-token'});assert.equal(result.headers.get('cache-control'),'no-store');
});
test('profile request uses Minecraft bearer and never server credential upstream',async()=>{
 const r=await handle(request({operation:'profile',accessToken:'minecraft-token'}),secret,async(url,init)=>{
  assert.equal(url,'https://api.minecraftservices.com/minecraft/profile');assert.equal(new Headers(init.headers).get('authorization'),'Bearer minecraft-token');return Response.json({id:'uuid',name:'kkaemok',capes:[]});
 });assert.equal(r.status,200);
});
test('HTML access rejection is distinct from app approval and missing profile',async()=>{
 const cases=[{response:()=>new Response('<h1>forbidden</h1>',{status:403,headers:{'content-type':'text/html'}}),error:'minecraft_network_denied',status:502},{response:()=>Response.json({errorMessage:'Invalid app registration'},{status:403}),error:'minecraft_app_not_approved',status:403},{response:()=>Response.json({error:'NOT_FOUND'},{status:404}),error:'minecraft_no_java_profile',status:404}];
 for(const c of cases){const r=await handle(request({operation:'profile',accessToken:'token'}),secret,async()=>c.response());assert.equal(r.status,c.status);assert.equal((await r.json()).error,c.error);}
});
test('health reports reachability without sending user credentials',async()=>{
 const r=await handle(request({operation:'health'}),secret,async(url,init)=>{assert.ok(String(init.body).includes('invalid-diagnostic-token'));return Response.json({error:'UNAUTHORIZED'},{status:401});});assert.deepEqual(await r.json(),{reachable:true,upstreamStatus:401});
});
test('site routing changes only Minecraft requests and isolates service credential',()=>{
 assert.equal(minecraftRelayRequest('https://login.microsoftonline.com/token',{method:'POST'},config),null);
 assert.equal(minecraftRelayRequest('https://evil.example/minecraft/profile',{},config),null);
 const result=minecraftRelayRequest('https://api.minecraftservices.com/minecraft/profile',{headers:{authorization:'Bearer minecraft-token'}},config);
 assert.equal(result.url,'https://bincitlebgzjsfnmngrm.supabase.co/functions/v1/minecraft-auth');assert.deepEqual(JSON.parse(result.init.body),{operation:'profile',accessToken:'minecraft-token'});assert.equal(new Headers(result.init.headers).get('authorization'),`Bearer ${secret}`);
 assert.throws(()=>minecraftRelayRequest('https://api.minecraftservices.com/minecraft/profile',{headers:{authorization:'Bearer token'}},{...config,supabaseUrl:'https://evil.example'}));
 assert.throws(()=>minecraftRelayRequest('https://api.minecraftservices.com/other',{method:'POST'},config));
});
