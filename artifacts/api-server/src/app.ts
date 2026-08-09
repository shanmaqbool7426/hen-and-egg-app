import express, { type Express } from "express";
import cors from "cors";
import pinoHttpImport from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
// connectDB and startDailyEggsJob are initialized in index.ts AFTER .env is loaded
export { connectDB } from "./db/mongoose";
export { startDailyEggsJob } from "./jobs/daily-eggs";

// pino-http is CommonJS; local esbuild and Vercel's own TypeScript build
// resolve its default export's callability differently depending on which
// esModuleInterop setting they end up picking up. It's the same function at
// runtime either way, so cast to `any` here to make this immune to that.
const pinoHttp = pinoHttpImport as any;

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);


export default app;

