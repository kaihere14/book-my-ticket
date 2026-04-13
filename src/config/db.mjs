import pg from "pg";

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

export default pool;
