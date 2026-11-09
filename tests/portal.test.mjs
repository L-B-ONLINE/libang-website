import test from 'node:test';
import assert from 'node:assert/strict';
import { searchEntries, searchExcerpt, searchTokens } from '../lib/search-model.ts';
import { safeReturnPath } from '../lib/portal-types.ts';
import { bridgeState, readPortalJson, hashSecret, equalDigests, randomSecret, heartbeatSchema } from '../lib/portal-model.ts';

test('Spotlight ranks titles first, requires every token, and keeps stable ties', () => {
  const entries = [
    {id:'a',kind:'guide',title:'접속 방법',description:'Dongwon 서버'},
    {id:'b',kind:'server',title:'Dongwon',description:'평화 야생'},
    {id:'c',kind:'post',title:'Dongwon 소식',description:'평화 야생'},
    {id:'d',kind:'version',title:'26.3',description:'Wilderness Bound'},
  ];
  assert.deepEqual(searchEntries(entries,'DONGWON').map(x=>x.id),['b','c','a']);
  assert.deepEqual(searchEntries(entries,'dongwon 평화').map(x=>x.id),['b','c']);
  assert.deepEqual(searchEntries(entries,'26.3 Wilderness').map(x=>x.id),['d']);
  assert.deepEqual(searchEntries(entries,'없는 내용'),[]);
  assert.deepEqual(searchEntries(entries,' ').map(x=>x.id),['a','b']);
});
test('login return path stays on site and avoids login loops', () => {
  for(const invalid of [null,'https://evil.example','//evil.example','/\\evil.example','/login?return_to=/login','/x\r\nLocation:evil']) assert.equal(safeReturnPath(invalid),'/saved');
  assert.equal(safeReturnPath('/guide#dongwon'),'/guide#dongwon');
  assert.equal(safeReturnPath('/minecraft/versions/26.3?a=b'),'/minecraft/versions/26.3?a=b');
});
test('stale or implausibly future heartbeats never claim an online server', () => {
  assert.equal(bridgeState('online',100000,189999),'online');
  assert.equal(bridgeState('online',100000,190001),'unknown');
  assert.equal(bridgeState('offline',100000,120000),'offline');
  assert.equal(bridgeState('online',160000,120000),'unknown');
});
test('pair secrets are unique and only matching well-formed SHA256 digests compare', async () => {
  const first=randomSecret(20), second=randomSecret(20);
  assert.match(first,/^[a-f0-9]{40}$/); assert.notEqual(first,second);
  const hash=await hashSecret(first);
  assert.equal(equalDigests(hash,await hashSecret(first)),true);
  assert.equal(equalDigests(hash,await hashSecret(second)),false);
  assert.equal(equalDigests(hash,'x'.repeat(64)),false);
  assert.equal(equalDigests(hash,hash.slice(1)),false);
});
test('JSON reader bounds streamed UTF8 bytes and rejects malformed or wrong content type', async () => {
  const json = s => new Request('https://local.invalid',{method:'POST',headers:{'content-type':'application/json'},body:s});
  assert.deepEqual(await readPortalJson(json('{"x":"한"}')),{x:'한'});
  await assert.rejects(readPortalJson(json('{')),e=>e.status===400);
  await assert.rejects(readPortalJson(json('"한한한"'),8),e=>e.status===413);
  await assert.rejects(readPortalJson(new Request('https://local.invalid',{method:'POST',body:'{}'})),e=>e.status===415);
});
test('heartbeat rejects invented capacity and unbounded inputs', () => {
  const sample={state:'online',playersOnline:4,playersMax:100,gameVersion:'26.3',supportedVersions:['26.3'],software:'Leaf'};
  assert.equal(heartbeatSchema.safeParse(sample).success,true);
  for(const overrides of [{playersOnline:-1},{playersOnline:101},{playersMax:0},{gameVersion:''},{software:'x'.repeat(81)},{supportedVersions:Array(21).fill('26.3')}]) assert.equal(heartbeatSchema.safeParse({...sample,...overrides}).success,false);
});


test('search scopes isolate kinds while preserving title ranking and empty scoped browsing', () => {
  const entries=[{id:'a',kind:'post',title:'평화 야생',description:'동원'},{id:'b',kind:'server',title:'동원',description:'평화 야생'},{id:'c',kind:'post',title:'동원',description:'평화 야생'}];
  assert.deepEqual(searchEntries(entries,'동원',24,'post').map(e=>e.id),['c','a']);
  assert.deepEqual(searchEntries(entries,'',24,'post').map(e=>e.id),['a','c']);
  assert.deepEqual(searchEntries(entries,'평화',24,'server').map(e=>e.id),['b']);
  assert.deepEqual(searchEntries(entries,'동원',24,'guide'),[]);
});
test('forum excerpts reveal body matches far beyond the old truncated preview', () => {
  const text='도입부 '.repeat(800)+'나침반은 보관함에 있습니다. '+'끝부분 '.repeat(100);
  const excerpt=searchExcerpt(text,'나침반');
  assert.ok(excerpt.startsWith('…')); assert.ok(excerpt.includes('나침반은 보관함')); assert.ok(excerpt.length<=182);
  assert.deepEqual(searchTokens('  PAPER   나침반  '),['paper','나침반']);
  assert.deepEqual(searchTokens('100% _ \\'),['100%','_','\\']);
});
