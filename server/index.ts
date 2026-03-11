import express from "express";
import cors from "cors";
import { connectDB } from "./lib/db";
import healthRouter from "./routes/health";
import authGoogleRouter from "./routes/auth/google";
import financeStateRouter from "./routes/finance/state";

const app = express();
const PORT = Number(process.env.PORT ?? process.env.SERVER_PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(authGoogleRouter);
app.use(financeStateRouter);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("[Server] Failed to connect to database:", error);
    process.exit(1);
  });
