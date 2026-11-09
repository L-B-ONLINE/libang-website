"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../auth-provider";
import { safeReturnPath } from "@/lib/portal-types";

export default function LoginForm() {
  const { client, session, loading, configured, error: configError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.has("return_to") ? safeReturnPath(searchParams.get("return_to")) : "/forum";
  const [signup, setSignup] = useState(searchParams.get("mode") === "signup");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { if (session) router.replace(returnTo); }, [router, session, returnTo]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!client || busy) return;
    setBusy(true); setMessage("");
    const result = signup
      ? await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: username.trim(), full_name: username.trim() },
            emailRedirectTo: `${window.location.origin}${returnTo}`,
          },
        })
      : await client.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (signup && !result.data.session) setMessage("확인 메일을 보냈습니다.");
    else router.replace(returnTo);
  }
  async function oauth(provider: "google" | "discord") {
    if (!client) return; setMessage("");
    const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}${returnTo}` } });
    if (error) setMessage(error.message);
  }
  if (loading) return <><h1 className="page-title">{signup ? "가입하기" : "로그인"}</h1><p className="auth-status">로그인을 준비하는 중…</p></>;
  if (!configured) return <><h1 className="page-title">{signup ? "가입하기" : "로그인"}</h1><p className="auth-status form-error">{configError ?? "Supabase가 아직 연결되지 않았습니다."}</p></>;
  return <>
    <h1 className="page-title">{signup ? "가입하기" : "로그인"}</h1>
    <form className="login-form" onSubmit={submit}>
      {signup && <label>아이디<input autoComplete="username" minLength={2} maxLength={24} required value={username} onChange={(event) => setUsername(event.target.value)} /></label>}
      <label>이메일<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>비밀번호<input type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {message && <p className="auth-status" role="status">{message}</p>}
      <button className="login-primary" disabled={busy} type="submit">{busy ? "처리 중…" : signup ? "가입하기" : "로그인"}</button>
    </form>
    <div className="login-divider"><span>또는</span></div>
    <div className="oauth-buttons"><button type="button" onClick={() => void oauth("google")}>Google로 계속</button><button type="button" onClick={() => void oauth("discord")}>Discord로 계속</button></div>
    <button className="login-switch" type="button" onClick={() => { setSignup(!signup); setMessage(""); }}>{signup ? "이미 계정이 있나요? 로그인" : "계정이 없나요? 가입하기"}</button>
  </>;
}
