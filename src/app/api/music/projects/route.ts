import { errorResponse, jsonResponse, parseJsonBody } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/music/db";
import type { MusicProjectDraftInput } from "@/lib/music/types";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const projects = await listProjects(user.id);
    return jsonResponse({ projects });
  } catch (error) {
    return errorResponse((error as Error).message || "Failed to load projects");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = await parseJsonBody<MusicProjectDraftInput>(request, { name: "" });

    if (!body.name || !body.name.trim()) {
      return errorResponse("Project/Band name is required", 400);
    }

    const project = await createProject(user.id, body);
    return jsonResponse({ project }, 201);
  } catch (error) {
    return errorResponse((error as Error).message || "Failed to create project", 400);
  }
}
