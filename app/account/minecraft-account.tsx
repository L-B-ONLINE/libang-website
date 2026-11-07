"use client";
import { useEffect, useState } from "react";
import {SkinFace} from "../player-identity";
import SkinModel from "./skin-model";
import { useAuth } from "../auth-provider";

type Cape = { id: string; name: string; url: string | null; active: boolean };
type Profile = { uuid: string; name: string; skinUrl: string | null; skinVariant: string | null; capes: Cape[]; connectedAt: string };

export default function MinecraftAccount() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session?.access_token) return;
    let active = true;
    setLoading(true);setProfile(null);
    const result = new URLSearchParams(window.location.search).get("minecraft");
    const status: Record<string, string> = {
      microsoft_app_credentials: "Microsoft 앱의 비밀 키가 만료되었거나 올바르지 않습니다. 앱 설정을 확인해야 합니다.",
      microsoft_token_failed: "Microsoft 로그인 코드를 교환하지 못했습니다. 다시 연결해주세요.",
      xbox_login_failed: "Xbox 계정 로그인 단계에서 실패했습니다.",
      xbox_permission_failed: "Xbox 계정 권한 확인에 실패했습니다. Xbox 프로필과 계정 설정을 확인해주세요.",
      connected: "마인크래프트 계정을 연결했습니다.",
      minecraft_app_not_approved: "Microsoft 앱의 Minecraft 서비스 접근 승인이 필요합니다.",
      minecraft_auth_denied: "Minecraft 서비스가 계정 인증을 거부했습니다.",
      minecraft_profile_denied: "Minecraft 서비스가 Java Edition 프로필 조회를 거부했습니다.",
      minecraft_network_denied: "인증 서버에서 Minecraft API에 접근하지 못했습니다.",
      minecraft_transport_failed: "Minecraft 인증 서버에 연결하지 못했습니다. 다시 시도해주세요.",
      minecraft_relay_not_configured: "Minecraft 인증 서버 설정을 확인해야 합니다.",
      minecraft_no_java_profile: "이 Microsoft 계정에 Java Edition 프로필이 없습니다.",
      invalid_state: "연결 요청이 만료되었습니다. 다시 시도해주세요.",
      failed: "연결하지 못했습니다. 다시 시도해주세요.",
    };
    if (result && status[result]) {
      queueMicrotask(() => { if (active) setMessage(status[result]); });
      window.history.replaceState(null, "", "/profile");
    }
    void fetch("/api/minecraft", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("마인크래프트 프로필을 불러오지 못했습니다.");
        return response.json() as Promise<{ configured: boolean; profile: Profile | null }>;
      })
      .then((data) => { if (active) { setConfigured(data.configured); setProfile(data.profile); window.dispatchEvent(new Event("player-profile-updated")); } })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "프로필을 불러오지 못했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.access_token, session?.user.email]);

  if (!session) return null;
  async function connect() {
    if (!session || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/minecraft", { method: "POST", headers: { authorization: `Bearer ${session.access_token}` } });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "연결을 시작하지 못했습니다.");
      window.location.assign(data.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "연결을 시작하지 못했습니다."); setBusy(false);
    }
  }
  async function disconnect() {
    if (!session || busy || !window.confirm("마인크래프트 계정 연결을 해제할까요?")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/minecraft", { method: "DELETE", headers: { authorization: `Bearer ${session.access_token}` } });
      if (!response.ok) throw new Error("연결을 해제하지 못했습니다.");
      setProfile(null); window.dispatchEvent(new Event("player-profile-updated")); setMessage("연결을 해제했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "연결을 해제하지 못했습니다."); }
    finally { setBusy(false); }
  }

  const equipped=profile?.capes.find(c=>c.active && c.url);
  const CapeImage=({url}:{url:string})=><span className="cape-preview" role="img" aria-label="망토 이미지" style={{backgroundImage:`url("${url}")`}}/>;
  return <section className="minecraft-account mc-unified" aria-labelledby="minecraft-heading">
    <h2 id="minecraft-heading">마인크래프트 프로필</h2>
    {loading ? <p className="auth-status">불러오는 중…</p> : profile ? <>
      <div className="mc-profile-heading">{profile.skinUrl && <SkinFace key={profile.skinUrl} skinUrl={profile.skinUrl}/>}<div><strong>{profile.name}</strong></div></div>
      <div className="mc-profile-main">{profile.skinUrl && <SkinModel skin={profile.skinUrl} cape={equipped?.url ?? null} slim={profile.skinVariant === "SLIM"}/>}<div className="mc-equipped"><h3>착용 중인 망토</h3>{equipped?.url ? <><CapeImage url={equipped.url}/><span>{equipped.name}</span></> : <p>착용 중인 망토가 없습니다.</p>}</div></div>
      <div className="mc-cape-collection"><h3>보유 망토 <span>{profile.capes.length}</span></h3>{profile.capes.length ? <ul>{profile.capes.map(cape=><li key={cape.id}>{cape.url && <CapeImage url={cape.url}/>}<strong>{cape.name}</strong>{cape.active && <small>착용 중</small>}</li>)}</ul> : <p>보유한 망토가 없습니다.</p>}</div>
      <div className="minecraft-actions"><button type="button" disabled={busy || !configured} onClick={()=>void connect()}>프로필 갱신</button><button type="button" disabled={busy} onClick={()=>void disconnect()}>연결 해제</button></div>
    </> : <><p className="auth-status">Microsoft 계정을 연결하면 캐릭터 얼굴이 프로필과 작성자 이름 앞에 표시됩니다.</p><button className="minecraft-connect" type="button" disabled={busy || !configured} onClick={()=>void connect()}>{busy ? "연결 중…" : configured ? "Microsoft 계정 연결" : "연결 준비 중"}</button></>}
    {message && <p role="status" className="auth-status">{message}</p>}
  </section>;
}
