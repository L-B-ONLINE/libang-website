import { getStaffRole } from "../../../../db/forum";
import { getSupabaseUser } from "../../../supabase-server";
export async function GET(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) return Response.json({ user: null, isAdmin: false }, { status: 401 });
  const role = await getStaffRole(user);
  return Response.json({ user: { id: user.userId, email: user.email, name: user.displayName }, role, isAdmin: role !== "member", isOwner: role === "owner" });
}
