"use client";
import {useEffect,useRef,useState} from 'react';
import type {SkinViewer} from 'skinview3d';
export default function SkinModel({skin,cape,slim}:{skin:string;cape:string|null;slim:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);const holder=useRef<HTMLDivElement>(null);const [error,setError]=useState(false);
 useEffect(()=>{let active=true;let viewer:SkinViewer|undefined;let resize:ResizeObserver|undefined;let observer:IntersectionObserver|undefined;setError(false);
 void import('skinview3d').then(async({SkinViewer})=>{
  if(!active||!canvas.current||!holder.current)return;
  viewer=new SkinViewer({canvas:canvas.current,width:holder.current.clientWidth,height:360});viewer.autoRotate=!matchMedia('(prefers-reduced-motion: reduce)').matches;viewer.autoRotateSpeed=.35;viewer.zoom=.85;viewer.controls.enableZoom=false;viewer.controls.enablePan=false;
  await viewer.loadSkin(skin,{model:slim?'slim':'default'});if(!active)return;if(cape)await viewer.loadCape(cape);if(!active)return;
  resize=new ResizeObserver(()=>{if(viewer&&holder.current)viewer.width=holder.current.clientWidth;});resize.observe(holder.current);
  observer=new IntersectionObserver(([entry])=>{if(viewer)viewer.renderPaused=!entry.isIntersecting;});observer.observe(holder.current);
 }).catch(()=>{if(active)setError(true);});
 return()=>{active=false;resize?.disconnect();observer?.disconnect();viewer?.dispose();};
 },[skin,cape,slim]);
 return <div className="mc-model" ref={holder}>{error?<p role="status">이 기기에서 3D 미리보기를 표시하지 못했습니다.</p>:<><canvas ref={canvas} aria-label={`${slim?'슬림':'일반'} 플레이어 3D 모델`}/><small>드래그해서 회전</small></>}</div>;
}
