import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupPlayer, textureUrl, PlayerLookupError} from '../lib/player-profile.ts';

const id='c7a4c955531e4c14a8a358ed3a1bce33';
const skin=`http://textures.minecraft.net/texture/${'a'.repeat(64)}`;
const cape=`http://textures.minecraft.net/texture/${'b'.repeat(64)}`;
const session=(overrides={})=>({id,name:'kkaemok',properties:[{name:'textures',value:btoa(JSON.stringify({profileId:id,textures:{SKIN:{url:skin},CAPE:{url:cape}}}))}],...overrides});
function mock(...results){
 const calls=[];
 const fetcher=async (url)=>{calls.push(url);assert.ok(results.length,'unexpected upstream request');const next=results.shift();if(next instanceof Error)throw next;return Response.json(next.data,{status:next.status ?? 200});};
 return {fetcher,calls};
}
test('official lookup resolves skin, cape and canonical name',async()=>{
 const {fetcher,calls}=mock({data:{id,name:'kkaemok'}},{data:session()});
 const p=await lookupPlayer('KKaeMok',fetcher);
 assert.equal(p.uuid,id);assert.equal(p.name,'kkaemok');assert.equal(p.skinUrl,skin.replace('http:','https:'));assert.equal(p.capeUrl,cape.replace('http:','https:'));
 assert.ok(calls[0].startsWith('https://api.minecraftservices.com/'));assert.equal(calls.length,2);
});
test('official endpoint rejection falls back to cached full profile',async()=>{
 const {fetcher,calls}=mock({status:403,data:{}},{data:session()});
 assert.equal((await lookupPlayer('kkaemok',fetcher)).uuid,id);assert.equal(calls[1],'https://crafthead.net/profile/kkaemok');
});
test('session timeout falls back using verified UUID',async()=>{
 const {fetcher,calls}=mock({data:{id,name:'kkaemok'}},new DOMException('timed out','TimeoutError'),{data:session()});
 assert.equal((await lookupPlayer('kkaemok',fetcher)).name,'kkaemok');assert.equal(calls[2],`https://crafthead.net/profile/${id}`);
});
test('unknown official nickname does not use a cached old identity',async()=>{
 const {fetcher,calls}=mock({status:404,data:{}});
 await assert.rejects(lookupPlayer('missing_name',fetcher),e=>e instanceof PlayerLookupError && e.code==='not_found');assert.equal(calls.length,1);
});
test('fallback rejects wrong name, wrong UUID and mismatched texture identity',async()=>{
 for(const bad of [session({name:'someone_else'}),session({id:'d'.repeat(32)}),session({properties:[{name:'textures',value:btoa(JSON.stringify({profileId:'d'.repeat(32),textures:{SKIN:{url:skin}}}))}]})]){
  const {fetcher}=mock({data:{id,name:'kkaemok'}},{status:503,data:{}},{data:bad});
  await assert.rejects(lookupPlayer('kkaemok',fetcher),e=>e.code==='unavailable');
 }
});
test('bad response JSON and missing properties do not create an empty saved profile',async()=>{
 const {fetcher}=mock({status:500,data:{}},{data:{id,name:'kkaemok'}});
 await assert.rejects(lookupPlayer('kkaemok',fetcher),e=>e.code==='unavailable');
});
test('texture URLs cannot point at third-party hosts',()=>{
 assert.equal(textureUrl(`https://evil.example/texture/${'a'.repeat(64)}`),null);
 assert.equal(textureUrl('javascript:alert(1)'),null);
 assert.equal(textureUrl(skin),skin.replace('http:','https:'));
});
test('invalid nickname makes no upstream request',async()=>{
 const {fetcher,calls}=mock();await assert.rejects(lookupPlayer('깨목',fetcher));assert.equal(calls.length,0);
});
