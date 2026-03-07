import { SignJWT } from "jose";
import { connectDB } from "../../../lib/db";
import type { UserDocument } from "../../../lib/models/User";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

/**
 * POST /api/auth/google
 *
 * For now this uses mock Google-shaped data so you can test the full
 * database + JWT flow without real OAuth. When real Google sign-in is
 * integrated (expo-auth-session), just replace the `mockPayload` block
 * with the actual ID-token claims.
 */
export async function POST(request: Request) {
  try {
    // ── Mock Google OAuth payload ──────────────────────────────────────
    // In production this will come from verifying a real Google ID token.
    const now = Date.now();
    const mockPayload = {
      googleId: `google_mock_${now}`,
      email: "mockuser@gmail.com",
      name: "Mock User",
      givenName: "Mock",
      familyName: "User",
      picture: `https://ui-avatars.com/api/?name=Mock+User&background=4285F4&color=fff&size=96`,
      provider: "google" as const,
    };

    // ── Upsert user in MongoDB ─────────────────────────────────────────
    const db = await connectDB();
    const users = db.collection<UserDocument>("users");
    const timestamp = new Date();

    const user = await users.findOneAndUpdate(
      { email: mockPayload.email },
      {
        $set: { ...mockPayload, updatedAt: timestamp },
        $setOnInsert: { createdAt: timestamp },
      },
      { upsert: true, returnDocument: "after" }
    );

    if (!user) {
      return Response.json({ error: "Failed to create user" }, { status: 500 });
    }

    // ── Sign JWT ───────────────────────────────────────────────────────
    const token = await new SignJWT({
      sub: user._id!.toString(),
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    return Response.json({
      token,
      user: {
        id: user._id!.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
        givenName: user.givenName,
        familyName: user.familyName,
      },
    });
  } catch (err) {
    console.error("[API /auth/google]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
