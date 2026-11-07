"use client";
import Link from "@/components/site-link";
import { useState } from "react";
import { useAuth } from "../auth-provider";
import { PlayerName } from "../player-identity";
type Field = "username" | "email" | "password";
export default function AccountSettings() {
  const { client, session, loading } = useAuth();
  const [values,setValues] = useState({username:"",email:"",password:""});
  const [busy,setBusy] = useState<Field | null>(null);
  const [messages,setMessages] = useState<Partial<Record<Field,string>>>({});
  if(loading) return <p className="auth-status">불러오는 중…</p>;
  if(!client || !session) return <p className="auth-status">로그인이 필요합니다. <Link href="/login">로그인</Link></p>;
  const currentName = session.user.user_metadata?.username || session.user.user_metadata?.full_name || "미설정";
  async function save(event:React.FormEvent,field:Field) {
    event.preventDefault(); if(!client || busy) return;
    setBusy(field);setMessages(v=>({...v,[field]:""}));
    try {
      const value=field === "password" ? values[field] : values[field].trim();
      if(!value) throw new Error("변경할 내용을 입력하세요.");
      const changes=field === "username" ? {data:{username:value,full_name:value}} : {[field]:value};
      const {error}=await client.auth.updateUser(changes,{emailRedirectTo:`${window.location.origin}/account`});
      if(error) throw error;
      setValues(v=>({...v,[field]:""}));setMessages(v=>({...v,[field]:field === "email" ? "이메일 변경 확인 메일을 보냈습니다. 확인 링크를 열어 변경을 완료하세요." : "저장했습니다."}));
    }catch(cause){setMessages(v=>({...v,[field]:cause instanceof Error ? cause.message : "저장하지 못했습니다."}));}finally{setBusy(null);}
  }
  return <div className="account-fields">{([{key:"username",label:"아이디",current:String(currentName),type:"text",autoComplete:"username"},{key:"email",label:"이메일",current:session.user.email || "미설정",type:"email",autoComplete:"email"},{key:"password",label:"비밀번호",current:"••••••••",type:"password",autoComplete:"new-password"}] as const).map(field=><details className="account-field" key={field.key}><summary><span>{field.label}<strong>{field.key === "username" ? <PlayerName userId={session.user.id} name={field.current}/> : field.current}</strong></span><span className="account-change">변경</span></summary><form className="login-form" onSubmit={event=>void save(event,field.key)}><label htmlFor={`account-${field.key}`}>새 {field.label}</label><input id={`account-${field.key}`} type={field.type} minLength={field.key === "password" ? 6 : field.key === "username" ? 2 : undefined} maxLength={field.key === "username" ? 24 : undefined} autoComplete={field.autoComplete} required value={values[field.key]} onChange={event=>setValues(v=>({...v,[field.key]:event.target.value}))}/>{messages[field.key] && <p className="auth-status" role="status">{messages[field.key]}</p>}<button className="login-primary" disabled={Boolean(busy)} type="submit">{busy === field.key ? "저장 중…" : "저장"}</button></form></details>)}</div>;
}
