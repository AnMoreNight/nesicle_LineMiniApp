import { buildApp } from "./app.js";
import { env } from "./env.js";

buildApp()
  .then((app) => app.listen({ port: env.port, host: "0.0.0.0" }))
  .then(() => {
    console.log(`API listening on http://localhost:${env.port}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
