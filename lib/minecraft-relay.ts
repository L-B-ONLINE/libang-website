export type MinecraftRelayConfig = { enabled:boolean;supabaseUrl?:string;serviceRoleKey?:string };
export function minecraftRelayRequest(url:string,init:RequestInit,config:MinecraftRelayConfig):{url:string;init:RequestInit}|null {
 const target=new URL(url);
 if(!config.enabled || target.origin!=='https://api.minecraftservices.com')return null;
 if(!config.supabaseUrl || !config.serviceRoleKey)throw new Error('minecraft_relay_not_configured');
 const origin=new URL(config.supabaseUrl);
 if(origin.protocol!=='https:' || origin.username || origin.password || !/^[a-z0-9]+\.supabase\.co$/.test(origin.hostname) || origin.port)throw new Error('minecraft_relay_not_configured');
 let body:object;
 if(target.pathname==='/authentication/login_with_xbox' && init.method?.toUpperCase()==='POST'){
  const payload=JSON.parse(String(init.body)) as {identityToken?:string};
  body={operation:'exchange',identityToken:payload.identityToken};
 }else if(target.pathname==='/minecraft/profile' && (!init.method || init.method.toUpperCase()==='GET')){
  const token=new Headers(init.headers).get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if(!token)throw new Error('minecraft_auth_failed');
  body={operation:'profile',accessToken:token};
 }else{throw new Error('minecraft_relay_invalid_request');}
 return {url:new URL('/functions/v1/minecraft-auth',origin).href,init:{method:'POST',headers:{'content-type':'application/json',accept:'application/json',authorization:`Bearer ${config.serviceRoleKey}`,apikey:config.serviceRoleKey},body:JSON.stringify(body)}};
}
