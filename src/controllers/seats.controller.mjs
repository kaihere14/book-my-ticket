import pool from "../config/db.mjs";

export const getAllSeats = async (req, res) => {
  const result = await pool.query("SELECT * FROM seats");
  res.send(result.rows);
};

export const bookSeat = async (req, res) => {
  try {
    const { id, name } = req.params;
    console.log(id, name);
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
    console.error(ex);
    res.status(500).send({ error: "Internal server error" });
  }
};
