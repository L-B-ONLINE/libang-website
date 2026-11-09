import { authenticateBridge } from "@/db/portal";
import { getD1 } from "@/db";
import { heartbeatSchema, PortalError, portalFailure, portalResponse, readPortalJson } from "@/lib/portal-model";
export async function POST(request: Request) {
  try {
    const credential = await authenticateBridge(request);
    const body = heartbeatSchema.parse(await readPortalJson(request));
    const now = Date.now();
    // Recheck the credential in the write itself so revocation/rotation wins a race with an in-flight heartbeat.
    const row = await getD1().prepare("INSERT INTO server_heartbeats(server_slug,credential_id,state,players_online,players_max,game_version,supported_versions,software,updated_at) SELECT server_slug,id,?,?,?,?,?,?,? FROM server_credentials WHERE id=? AND server_slug=? ON CONFLICT(server_slug) DO UPDATE SET credential_id=excluded.credential_id,state=excluded.state,players_online=excluded.players_online,players_max=excluded.players_max,game_version=excluded.game_version,supported_versions=excluded.supported_versions,software=excluded.software,updated_at=excluded.updated_at RETURNING server_slug")
      .bind(body.state, body.state === "online" ? body.playersOnline : 0, body.playersMax, body.gameVersion, JSON.stringify(body.supportedVersions.length ? body.supportedVersions : [body.gameVersion]), body.software, now, credential.id, credential.serverSlug).first();
    if (!row) throw new PortalError(401, "서버 인증이 만료되었습니다.");
    return portalResponse({ accepted: true, receivedAt: new Date(now).toISOString() });
  } catch (error) { return portalFailure(error); }
}
