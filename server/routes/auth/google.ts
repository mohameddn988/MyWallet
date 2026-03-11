import { Router } from "express";
import { SignJWT } from "jose";
import { connectDB } from "../../lib/db";
import type { UserDocument } from "../../models/User";
import { ensureWallet, toWalletStatePayload } from "../../lib/wallet";

const router = Router();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production",
);

interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  aud: string;
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) {
    throw new Error(`Google tokeninfo rejected the ID token (${res.status})`);
  }
  const info = (await res.json()) as GoogleTokenInfo;
  if (info.email_verified !== "true") {
    throw new Error("Google account email is not verified");
  }
  return info;
}

/**
 * POST /api/auth/google
 *
 * Accepts a Google ID token from the client, verifies it with Google's
 * tokeninfo endpoint, upserts the user in MongoDB, and returns a signed JWT.
 */
router.post("/api/auth/google", async (req, res) => {
  try {
    const body = req.body as { idToken?: string };

    if (!body.idToken) {
      res.status(400).json({ error: "idToken is required" });
      return;
    }

    let googleInfo: GoogleTokenInfo;
    try {
      googleInfo = await verifyGoogleIdToken(body.idToken);
    } catch (err) {
      console.error("[API /auth/google] Token verification failed:", err);
      res.status(401).json({ error: "Invalid Google ID token" });
      return;
    }

    const payload = {
      googleId: googleInfo.sub,
      email: googleInfo.email.trim().toLowerCase(),
      name: googleInfo.name?.trim() ?? googleInfo.email.split("@")[0],
      givenName: googleInfo.given_name?.trim() ?? "",
      familyName: googleInfo.family_name?.trim() ?? "",
      picture:
        googleInfo.picture?.trim() ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(googleInfo.name ?? googleInfo.email)}&background=4285F4&color=fff&size=96`,
      provider: "google" as const,
    };

    const db = await connectDB();
    const users = db.collection<UserDocument>("users");
    const timestamp = new Date();

    const user = await users.findOneAndUpdate(
      {
        $or: [{ email: payload.email }, { googleId: payload.googleId }],
      },
      {
        $set: { ...payload, updatedAt: timestamp },
        $setOnInsert: { createdAt: timestamp },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (!user) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    const token = await new SignJWT({
      sub: user._id!.toString(),
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const wallet = await ensureWallet(user._id!.toString());
    const walletState = toWalletStatePayload(wallet);

    res.json({
      token,
      hasCompleted: walletState.hasCompleted,
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
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
