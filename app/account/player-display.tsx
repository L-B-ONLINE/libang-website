"use client";
import MinecraftAccount from './minecraft-account';
import {useAuth} from '../auth-provider';
export default function PlayerDisplay(){const {session,loading}=useAuth();if(loading)return <p className="auth-status">불러오는 중…</p>;return session ? <MinecraftAccount key={session.user.id}/> : <p className="auth-status">로그인이 필요합니다. <a href="/login">로그인</a></p>;}
