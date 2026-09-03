import { errorResponse, jsonResponse } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { listCollaboratorUsers } from "@/lib/music/db";

export async function GET(request: Request) {
  try {
    await requireApiUser(request);
    const users = await listCollaboratorUsers();
    return jsonResponse({ users });
  } catch (error) {
    return errorResponse((error as Error).message || "Failed to load collaborators");
  }
}
