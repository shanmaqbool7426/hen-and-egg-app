import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

const MONGOOSE_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

router.get("/dbstatus", (_req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    connected: state === 1,
    state: MONGOOSE_STATES[state] || "unknown",
    note: state === 1
      ? "Real MongoDB is connected - all data is real."
      : "MongoDB is NOT connected - the app is using the in-memory fallback (only Shan Dealer / Ali Buyer test accounts exist here, nothing you seeded).",
  });
});

export default router;
