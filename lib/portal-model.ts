import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import type { LiveServer } from "./portal-types";

export const serverSlugs = ["network", "dongwon", "bose", "reability"] as const;
export const serverSlugSchema = z.enum(serverSlugs);
export const bookmarkSchema = z.object({ kind: z.enum(["post", "guide", "version"]), resourceId: z.string().trim().min(1).max(100) });
export const updateSchema = z.object({
  serverSlug: serverSlugSchema,
  category: z.enum(["announcement", "update", "development", "maintenance"]),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(2).max(10000),
  published: z.boolean(),
});
export const heartbeatSchema = z.object({
  state: z.enum(["online", "offline"]).default("online"),
  playersOnline: z.number().int().min(0).max(100000),
  playersMax: z.number().int().min(1).max(1000000),
  gameVersion: z.string().trim().min(1).max(80),
  supportedVersions: z.array(z.string().trim().min(1).max(80)).max(20),
  software: z.string().trim().min(1).max(80),
}).refine(value => value.playersOnline <= value.playersMax, { message: "Invalid player capacity" });

export type BookmarkKind = z.infer<typeof bookmarkSchema>["kind"];
export const updateCategoryLabels = { announcement: "안내", update: "업데이트", development: "개발 소식", maintenance: "점검" };
export const serverNames: Record<string, string> = { network: "리뱅 네트워크", dongwon: "Dongwon", bose: "Bose", reability: "ReAbility" };

export class PortalError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function randomSecret(bytes = 24) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), value => value.toString(16).padStart(2, "0")).join("");
}
export async function hashSecret(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function equalDigests(left: string, right: string) {
  return /^[a-f0-9]{64}$/.test(left) && /^[a-f0-9]{64}$/.test(right) && timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function bridgeState(state: "online" | "offline", updatedAt: number, now = Date.now()): LiveServer["state"] {
  return now - updatedAt > 90000 || updatedAt > now + 30000 ? "unknown" : state;
}

export async function readPortalJson(request: Request, maxBytes = 16384): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) throw new PortalError(415, "JSON 형식으로 요청하세요.");
  if (!request.body) throw new PortalError(400, "요청 내용이 없습니다.");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new PortalError(413, "요청 내용이 너무 큽니다."); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new PortalError(400, "요청 내용을 확인하세요."); }
}

export function portalResponse(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } }); }
export function portalFailure(error: unknown) {
  if (error instanceof PortalError) return portalResponse({ error: error.message }, error.status);
  if (error instanceof z.ZodError) return portalResponse({ error: "입력 내용을 확인하세요." }, 400);
  console.error(JSON.stringify({ event: "portal_request_failed", type: error instanceof Error ? error.name : "Unknown" }));
  return portalResponse({ error: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 503);
}
