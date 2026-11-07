export type PlayerProfile = { uuid:string; name:string; skinUrl:string|null; capeUrl:string|null; updatedAt:string };
export type PublicPlayer = Pick<PlayerProfile,"uuid"|"name"|"skinUrl">;

type Account = { id:string; name:string };
type SessionProfile = Account & { properties?:{ name:string; value:string }[] };
type TexturePayload = { profileId?:string; textures?:{ SKIN?:{url?:string}; CAPE?:{url?:string} } };

export class PlayerLookupError extends Error {
 readonly code:"not_found"|"unavailable";
 constructor(code:"not_found"|"unavailable") {
  super(code === "not_found" ? "해당 Java Edition 닉네임을 찾지 못했습니다." : "프로필 조회 서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요.");
  this.code=code;
 }
}

export function textureUrl(value:unknown):string|null {
 if(typeof value !== "string") return null;
 try {const url=new URL(value);if(url.hostname !== "textures.minecraft.net" || !/^\/texture\/[a-f0-9]{32,128}$/i.test(url.pathname) || !["http:","https:"].includes(url.protocol))return null;return `https://textures.minecraft.net${url.pathname}`;}catch{return null;}
}

function accountFrom(data:unknown, name:string, expectedId?:string):Account|null {
 if(!data || typeof data !== "object")return null;
 const account=data as Partial<Account>;
 if(typeof account.id !== "string" || !/^[a-f0-9]{32}$/i.test(account.id) || typeof account.name !== "string" || account.name.toLowerCase() !== name.toLowerCase())return null;
 if(expectedId && account.id.toLowerCase() !== expectedId.toLowerCase())return null;
 return {id:account.id.toLowerCase(),name:account.name};
}

function profileFrom(data:unknown, name:string, expectedId?:string):PlayerProfile|null {
 const account=accountFrom(data,name,expectedId);
 if(!account)return null;
 const properties=(data as SessionProfile).properties;
 if(!Array.isArray(properties))return null;
 const value=properties.find(p=>p?.name === "textures")?.value;
 if(typeof value !== "string")return null;
 try {
  const payload=JSON.parse(atob(value)) as TexturePayload;
  if(!payload || !payload.textures || (payload.profileId && payload.profileId.toLowerCase() !== account.id))return null;
  const skinUrl=textureUrl(payload.textures.SKIN?.url);
  const capeUrl=textureUrl(payload.textures.CAPE?.url);
  if((payload.textures.SKIN && !skinUrl) || (payload.textures.CAPE && !capeUrl))return null;
  return {uuid:account.id,name:account.name,skinUrl,capeUrl,updatedAt:new Date().toISOString()};
 }catch{return null;}
}

async function getJson(url:string, fetcher:typeof fetch):Promise<{status:number;data:unknown}> {
 const host=new URL(url).hostname;
 try {
  const response=await fetcher(url,{signal:AbortSignal.timeout(5000),headers:{accept:"application/json"}});
  if(!response.ok){console.warn("[player-profile] upstream failure",{host,status:response.status});return {status:response.status,data:null};}
  if(response.status === 204)return {status:204,data:null};
  return {status:response.status,data:await response.json()};
 }catch(cause){
  console.warn("[player-profile] upstream failure",{host,reason:cause instanceof Error ? cause.name : "request_failed"});
  return {status:0,data:null};
 }
}

export async function lookupPlayer(name:string, fetcher:typeof fetch=fetch):Promise<PlayerProfile> {
 if(!/^[A-Za-z0-9_]{3,16}$/.test(name))throw new Error("Java Edition 닉네임을 3~16자의 영문, 숫자, 밑줄로 입력하세요.");
 // Minecraft Services is the current official name lookup. The old api.mojang.com
 // endpoint can reject datacenter requests even for existing players.
 const identity=await getJson(`https://api.minecraftservices.com/minecraft/profile/lookup/name/${encodeURIComponent(name)}`,fetcher);
 if(identity.status === 404 || identity.status === 204)throw new PlayerLookupError("not_found");
 const account=accountFrom(identity.data,name);
 if(account){
  const session=await getJson(`https://sessionserver.mojang.com/session/minecraft/profile/${account.id}`,fetcher);
  const profile=profileFrom(session.data,name,account.id);
  if(profile)return profile;
 }
 // Crafthead provides cached Mojang session profiles from a separate service.
 // When official identity succeeded, require the same UUID to avoid stale names.
 const fallback=await getJson(`https://crafthead.net/profile/${account?.id ?? encodeURIComponent(name)}`,fetcher);
 const profile=profileFrom(fallback.data,name,account?.id);
 if(profile)return profile;
 if(!account && (fallback.status === 404 || fallback.status === 204))throw new PlayerLookupError("not_found");
 throw new PlayerLookupError("unavailable");
}
