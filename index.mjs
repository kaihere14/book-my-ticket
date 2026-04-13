import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "changeme_use_env_in_prod";
const SALT_ROUNDS = 10;

const pool = new pg.Pool({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "postgres",
  database: "sql_class_2_db",
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

const app = new express();
app.use(cors());
app.use(express.json({ limit: "16kb" }));

// mock movie data
const movies = [
  { id: 1, title: "Dhurandhar The Revenge", genre: "Action", duration: "2h 15m", language: "Hindi" },
  { id: 2, title: "Chai Aur Code",          genre: "Drama",  duration: "1h 50m", language: "Hindi" },
  { id: 3, title: "The Last Debugger",      genre: "Sci-Fi", duration: "2h 5m",  language: "English" },
];

// helpers
function generateAccessToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = payload;
    next();
  });
}

// public routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/movies", (req, res) => {
  res.json(movies);
});

// register new user
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password ||
        typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Please enter valid data" });
    }

    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      const existing = await conn.query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rowCount > 0) {
        await conn.query("ROLLBACK");
        return res.status(409).json({ error: "User already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await conn.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
        [name, email, hashedPassword]
      );

      await conn.query("COMMIT");
      const user = result.rows[0];
      const token = generateAccessToken(user.id);
      return res.status(201).json({ user, token });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// login user and return token
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password ||
        typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Please enter valid data" });
    }

    const result = await pool.query(
      "SELECT id, name, email, password FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateAccessToken(user.id);
    const { password: _pw, ...safeUser } = user;
    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// get all seats - anyone can see this
app.get("/seats", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM seats");
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// book seat, need valid token for this
app.put("/:id/:name", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.params.name;
    const userId = req.user.userId;

    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      const result = await conn.query(
        "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE",
        [id]
      );

      if (result.rowCount === 0) {
        await conn.query("ROLLBACK");
        return res.status(409).json({ error: "Seat already booked" });
      }

      const updateResult = await conn.query(
        "UPDATE seats SET isbooked = 1, name = $2, user_id = $3 WHERE id = $1 RETURNING *",
        [id, name, userId]
      );

      await conn.query("COMMIT");
      res.status(200).json({ seat: updateResult.rows[0] });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
