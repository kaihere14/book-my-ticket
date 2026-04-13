import express from "express";
import cors from "cors";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import seatsRouter from "./routes/seats.routes.mjs";
import usersRouter from "./routes/users.routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(cors());
app.use(express.static(join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "../public/index.html"));
});

app.use(seatsRouter);
app.use(usersRouter);

export default app;
