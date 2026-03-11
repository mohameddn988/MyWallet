import { Router } from "express";
import { getApiAuthUser } from "../../lib/auth";
import {
  DEFAULT_BASE_CURRENCY,
  ensureWallet,
  saveWalletState,
  toWalletStatePayload,
} from "../../lib/wallet";
import type { WalletStatePayload } from "../../models/Wallet";

const router = Router();

router.get("/api/finance/state", async (req, res) => {
  try {
    const authUser = await getApiAuthUser(req);
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const wallet = await ensureWallet(authUser.userId);
    res.json(toWalletStatePayload(wallet));
  } catch (error) {
    console.error("[API /finance/state GET]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/finance/state", async (req, res) => {
  try {
    const authUser = await getApiAuthUser(req);
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = req.body as Partial<WalletStatePayload>;

    const nextState: WalletStatePayload = {
      hasCompleted: Boolean(body.hasCompleted),
      baseCurrency:
        typeof body.baseCurrency === "string" && body.baseCurrency.trim()
          ? body.baseCurrency.trim().toUpperCase()
          : DEFAULT_BASE_CURRENCY,
      accounts: Array.isArray(body.accounts) ? body.accounts : [],
      exchangeRates: Array.isArray(body.exchangeRates) ? body.exchangeRates : [],
      transactions: Array.isArray(body.transactions) ? body.transactions : [],
      settings:
        body.settings && typeof body.settings === "object"
          ? {
              dateFormat: body.settings.dateFormat,
              firstDayOfWeek: body.settings.firstDayOfWeek,
              numberFormat: body.settings.numberFormat,
            }
          : undefined,
    };

    const updated = await saveWalletState(authUser.userId, nextState);
    res.json(toWalletStatePayload(updated));
  } catch (error) {
    console.error("[API /finance/state PUT]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
