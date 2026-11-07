"use client";
import { createContext,useContext,useEffect,useState,useRef,type ReactNode } from "react";
import type { PublicPlayer } from "../lib/player-profile";
const Context=createContext<Record<string,PublicPlayer>>({});
export function PlayerIdentityProvider({children}:{children:ReactNode}) {
 const [profiles,setProfiles]=useState<Record<string,PublicPlayer>>({});
 useEffect(()=>{let active=true;let controller:AbortController|null=null;const refresh=()=>{controller?.abort();controller=new AbortController();void fetch("/api/player-profile",{signal:controller.signal,cache:"no-store"}).then(async r=>r.ok ? await r.json() as {profiles:Record<string,PublicPlayer>} : null).then(d=>{if(active && d)setProfiles(d.profiles);}).catch(()=>{});};refresh();window.addEventListener("player-profile-updated",refresh);return()=>{active=false;controller?.abort();window.removeEventListener("player-profile-updated",refresh);};},[]);
 return <Context.Provider value={profiles}>{children}</Context.Provider>;
}
export function usePlayerIdentity(userId?:string){const profiles=useContext(Context);return userId ? profiles[userId] : undefined;}
export function SkinFace({skinUrl,className="",fallback=null}:{skinUrl:string;className?:string;fallback?:ReactNode}) {
 const [failed,setFailed]=useState(false);
 const [legacy,setLegacy]=useState(false);
 const imageRef=useRef<HTMLImageElement>(null);
 useEffect(()=>{const img=imageRef.current;if(img?.complete && img.naturalHeight)setLegacy(img.naturalHeight===32);},[skinUrl]);
 if(failed)return fallback;
 return <span className={`player-face ${className}`} aria-hidden="true"><img ref={imageRef} src={skinUrl} alt="" onLoad={e=>setLegacy(e.currentTarget.naturalHeight === 32)} onError={()=>setFailed(true)}/>{!legacy && <img src={skinUrl} alt="" className="player-face-hat" onError={()=>setFailed(true)}/>}</span>;
}
export function PlayerName({userId,name}:{userId?:string;name:string}){const profile=usePlayerIdentity(userId);return <span className="player-name">{profile?.skinUrl && <SkinFace key={profile.skinUrl} skinUrl={profile.skinUrl}/>}<span>{name}</span></span>;}
