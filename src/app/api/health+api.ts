import { connectDB } from "../../lib/db";

/**
 * GET /api/health
 *
 * Returns server status and MongoDB connectivity.
 */
export async function GET() {
  try {
    await connectDB();
    return Response.json(
      { status: "ok", mongo: "connected" },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { status: "error", mongo: "disconnected", error: message },
      { status: 503 },
    );
  }
}
