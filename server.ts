import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { createServer as createHttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { AIService, AIError } from "./server/ai";

// Local overrides take precedence; exported environment variables still win.
dotenv.config({ path: [".env.local", ".env"], quiet: true });
const dirname = path.dirname(fileURLToPath(import.meta.url));
export function createApp(
  ai = new AIService({
    apiKey: process.env.NEBIUS_API_KEY || process.env.NEBIUS_TOKEN_FACTORY_KEY,
    baseUrl: process.env.NEBIUS_BASE_URL,
    fastModel: process.env.NEBIUS_FAST_MODEL,
    deepModel: process.env.NEBIUS_DEEP_MODEL,
  }),
) {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  app.get("/api/health", (_req, res) =>
    res.json({
      status: "ok",
      ai: ai.status(),
      timestamp: new Date().toISOString(),
    }),
  );
  for (const [route, handler] of Object.entries({
    "infer-workflow": ai.infer.bind(ai),
    "compare-demonstrations": ai.compare.bind(ai),
    "match-workflow": ai.match.bind(ai),
    "generate-reply": ai.reply.bind(ai),
  })) {
    app.post(`/api/ai/${route}`, async (req, res) => {
      try {
        res.json(await handler(req.body));
      } catch (error) {
        if (error instanceof z.ZodError)
          res
            .status(422)
            .json({
              error: "Invalid request or model output schema",
              details: error.issues.map((i) => ({
                path: i.path,
                message: i.message,
              })),
            });
        else if (error instanceof AIError)
          res.status(error.status).json({ error: error.message });
        else
          res
            .status(502)
            .json({
              error: "AI operation failed; no fallback result was generated",
            });
      }
    });
  }
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API route not found" }),
  );
  app.use(
    (
      error: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) =>
      res
        .status(error.status === 413 ? 413 : 400)
        .json({ error: "Invalid JSON request or request too large" }),
  );
  return app;
}
async function startServer() {
  const app = createApp();
  const httpServer = createHttpServer(app);
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr:
          process.env.DISABLE_HMR === "true" ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(dirname, "dist")));
    app.get("*", (_req, res) =>
      res.sendFile(path.join(dirname, "dist/index.html")),
    );
  }
  const port = Number(process.env.PORT || 3000);
  httpServer.listen(port, "0.0.0.0", () =>
    console.log(`ShadowOps running on http://localhost:${port}`),
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  startServer().catch(() => {
    console.error("ShadowOps failed to start");
    process.exitCode = 1;
  });
