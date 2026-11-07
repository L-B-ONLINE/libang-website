"use client";

import { useCallback } from "react";
import { useAuth } from "../auth-provider";
import AdminWorkspace, { type AdminRequest } from "./admin-workspace";

export default function AdminClient() {
  const { session, loading } = useAuth();
  const token = session?.access_token;
  const request = useCallback<AdminRequest>(async <T,>(path: string, init?: RequestInit) => {
    const response = await fetch(path, {
      ...init, cache: "no-store",
      headers: { "content-type": "application/json", ...init?.headers, authorization: `Bearer ${token}` },
    });
    const result = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(result.error || "요청을 처리하지 못했습니다.");
    return result;
  }, [token]);
  if (loading) return <p className="admin-state" role="status">관리 권한을 확인하는 중…</p>;
  if (!session) return <div className="admin-state"><p>관리자 계정으로 로그인하세요.</p><a className="btn" href="/login">로그인</a></div>;
  return <AdminWorkspace key={session.user.id} request={request} />;
}
