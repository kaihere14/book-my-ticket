import pool from "../config/db.mjs";

export const getAllUsers = async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.send(result.rows);
};

export const registerUser = async (req, res) => {
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
};
