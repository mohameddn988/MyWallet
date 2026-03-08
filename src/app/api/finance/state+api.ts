import { getApiAuthUser, unauthorizedResponse } from "../../../lib/server/auth";
import {
  DEFAULT_BASE_CURRENCY,
  ensureWallet,
  saveWalletState,
  toWalletStatePayload,
} from "../../../lib/server/wallet";
import { WalletStatePayload } from "../../../lib/models/Wallet";

export async function GET(request: Request) {
  try {
    const authUser = await getApiAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const wallet = await ensureWallet(authUser.userId);
    return Response.json(toWalletStatePayload(wallet));
  } catch (error) {
    console.error("[API /finance/state GET]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authUser = await getApiAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = (await request.json()) as Partial<WalletStatePayload>;

    const nextState: WalletStatePayload = {
      hasCompleted: Boolean(body.hasCompleted),
      baseCurrency:
        typeof body.baseCurrency === "string" && body.baseCurrency.trim()
          ? body.baseCurrency.trim().toUpperCase()
          : DEFAULT_BASE_CURRENCY,
      accounts: Array.isArray(body.accounts) ? body.accounts : [],
      exchangeRates: Array.isArray(body.exchangeRates) ? body.exchangeRates : [],
      transactions: Array.isArray(body.transactions) ? body.transactions : [],
      settings: body.settings && typeof body.settings === "object" ? body.settings : undefined,
    };

    const updated = await saveWalletState(authUser.userId, nextState);
    return Response.json(toWalletStatePayload(updated));
  } catch (error) {
    console.error("[API /finance/state PUT]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
