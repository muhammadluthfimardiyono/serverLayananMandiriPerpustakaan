var mysql = require("mysql");

var connection = mysql.createPool({
  host: "localhost",
  user: "libr9119_root",
  password: "Xf~bxZ[,db2v",
  database: "libr9119_libraryData",
});
connection.getConnection((err, connection) => {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection was refused.");
    }
  }
  if (connection) connection.release();
  return;
});
module.exports = connection;
