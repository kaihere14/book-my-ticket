import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8080;

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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// get all seats
app.get("/seats", async (req, res) => {
  const result = await pool.query("SELECT * FROM seats");
  res.send(result.rows);
});

// get all users
app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.send(result.rows);
});

// register user
app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;
  if (
    !name ||
    !email ||
    !password ||
    typeof name != "string" ||
    typeof email != "string" ||
    typeof password != "string"
  ) {
    return res.status(401).json({ message: "Please enter valid data" });
  }

  const conn = await pool.connect();
  await conn.query("BEGIN");

  const sql = "SELECT * FROM users WHERE email = $1";
  const usersResult = await conn.query(sql, [email]);

  if (usersResult.rowCount > 0) {
    await conn.query("ROLLBACK");
    conn.release();
    return res.send({ error: "User already registered" });
  }

  const sqlU = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`;
  const updateResult = await conn.query(sqlU, [name, email, password]);

  await conn.query("COMMIT");
  conn.release();
  res.send(updateResult);
});

// book a seat
app.put("/:id/:name", async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.params.name;
    const conn = await pool.connect();

    await conn.query("BEGIN");

    const sql = "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.send({ error: "Seat already booked" });
    }

    const sqlU = "UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1";
    const updateResult = await conn.query(sqlU, [id, name]);

    await conn.query("COMMIT");
    conn.release();
    res.send(updateResult);
  } catch (ex) {
    console.log(ex);
    res.send(500);
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
