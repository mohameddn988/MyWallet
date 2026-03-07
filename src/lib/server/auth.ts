import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production",
);

export interface ApiAuthUser {
  userId: string;
  email?: string;
  name?: string;
}

export async function getApiAuthUser(
  request: Request,
): Promise<ApiAuthUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub || typeof payload.sub !== "string") return null;

    return {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

export function unauthorizedResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
