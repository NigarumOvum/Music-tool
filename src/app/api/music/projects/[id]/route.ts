import { errorResponse, jsonResponse, parseJsonBody } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { getProject, updateProject, deleteProject } from "@/lib/music/db";
import type { MusicProjectDraftInput } from "@/lib/music/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireApiUser(_request);
    const { id } = await context.params;
    const project = await getProject(id, user.id);

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    return jsonResponse({ project });
  } catch (error) {
    return errorResponse((error as Error).message || "Failed to load project");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    const body = await parseJsonBody<MusicProjectDraftInput>(request, { name: "" });
    const project = await updateProject(id, user.id, body);
    return jsonResponse({ project });
  } catch (error) {
    const message = (error as Error).message || "Failed to update project";
    return errorResponse(message, message === "Project not found" ? 404 : 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    await deleteProject(id, user.id);
    return jsonResponse({ ok: true });
  } catch (error) {
    const message = (error as Error).message || "Failed to delete project";
    return errorResponse(message, message === "Project not found" ? 404 : 400);
  }
}
