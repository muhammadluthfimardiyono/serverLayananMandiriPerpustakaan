const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(express.json());

const db = require("./db");

app.get("/user-data", (req, res) => {
  const sql = "SELECT * FROM users";

  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err });
    }

    return res.json(data);
  });
});

app.get("/user-data/:id", (req, res) => {
  const userId = req.params.id;
  const sql = "SELECT * FROM users WHERE id = ?";

  db.query(sql, [userId], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err });
    }

    return res.json(data);
  });
});

app.delete("/user-delete/:id", (req, res) => {
  const userId = req.params.id;

  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  });
});

app.put("/user-update/:id", (req, res) => {
  const userID = req.params.id;
  const { nama, tempat_lahir, tgl_lahir, prodi, nim, no_telp, email } =
    req.body;

  const sql =
    "UPDATE users SET nama = ?, tempat_lahir = ?, tgl_lahir = ?, prodi = ?, nim = ?, no_telp = ?, email = ? WHERE id = ?";

  const values = [
    nama,
    tempat_lahir,
    tgl_lahir,
    prodi,
    nim,
    no_telp,
    email,
    userID,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "User updated successfully" });
  });
});

// AUTH
app.post("/signup", (req, res) => {
  const {
    name,
    email,
    password,
    prodi,
    nim,
    no_telp,
    tempat_lahir,
    tgl_lahir,
  } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }

    const sql =
      "INSERT INTO users (nama, email, password, prodi,nim, no_telp, tempat_lahir, tgl_lahir) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
      name,
      email,
      hashedPassword,
      prodi,
      nim,
      no_telp,
      tempat_lahir,
      tgl_lahir,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.log(err); // Add this line to see the error object in the console
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(422).json({
            error: "Email address already registered",
          });
        } else {
          return res.status(500).json({ error: "Internal server error" });
        }
      }

      return res.status(201).json({ message: "User created successfully" });
    });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, data) => {
    if (data.length > 0) {
      const storedHashedPassword = data[0].password;

      bcrypt.compare(password, storedHashedPassword, (err, result) => {
        if (err) {
          return res.status(500).json({ error: "Internal server error" });
        }

        if (result) {
          // Passwords match, proceed with login
          return res.json(data);
        } else {
          // Passwords don't match, handle unsuccessful login
          return res.json({ message: "Invalid credentials" });
        }
      });
    } else {
      return res.json({ message: "No record existed" });
    }
  });
});

// BOOKS
app.get("/books", (req, res) => {
  const sql = "SELECT * FROM data_buku";

  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err });
    }

    return res.json(data);
  });
});

app.get("/denda-buku", (req, res) => {
  const sql = "SELECT * FROM denda_buku";

  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Barcode not found" });
    }

    return res.json(data);
  });
});

app.get("/data-buku/:barcode", (req, res) => {
  const { barcode } = req.params;

  const sql = "SELECT * FROM data_buku WHERE kode_barcode = ?";

  db.query(sql, [barcode], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Barcode not found" });
    }

    return res.json(data);
  });
});

app.put("/data-buku/:barcode", (req, res) => {
  const { barcode } = req.params;
  const { tersedia, peminjam, tenggat_kembali } = req.body;

  const sql =
    "UPDATE data_buku SET tersedia = ?, peminjam = ?, tenggat_kembali = ? WHERE kode_barcode = ?";

  db.query(
    sql,
    [tersedia, peminjam, tenggat_kembali, barcode],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database query failed" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Barcode not found" });
      }

      return res.json({ message: "Status and peminjam updated successfully" });
    }
  );
});

app.post("/buku-dipinjam", (req, res) => {
  const { id_transaksi, id_buku, hilang } = req.body;

  const sql =
    "INSERT INTO buku_dipinjam (id_transaksi, id_buku, hilang) VALUES ( ?, ?, ?)";
  const values = [id_transaksi, id_buku, hilang];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    return res
      .status(201)
      .json({ message: "Buku dipinjam added successfully" });
  });
});

app.put("/buku-hilang/:id", (req, res) => {
  const { id } = req.params;
  // const { hilang } = req.body;

  const sql = "UPDATE buku_dipinjam SET hilang = true WHERE id_buku = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Barcode not found" });
    }

    return res.json({ message: "Buku hilang updated successfully" });
  });
});

app.put("/buku-kembali/:id", (req, res) => {
  const { id } = req.params;
  // const { hilang } = req.body;

  const sql = "UPDATE buku_dipinjam SET hilang = false WHERE id_buku = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Barcode not found" });
    }

    return res.json({ message: "Buku hilang updated successfully" });
  });
});

app.get("/buku-dipinjam", (req, res) => {
  const sql = "SELECT * FROM buku_dipinjam";

  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "buku not found" });
    }

    return res.json(data);
  });
});

app.post("/add-buku", (req, res) => {
  const {
    pengarang,
    judul,
    penerbit,
    tahun_terbit,
    isbn_issn,
    jumlah_halaman,
    deskripsi,
    tersedia,
    sumber,
    kode_barcode,
    kode_rak,
  } = req.body;

  const sql =
    "INSERT INTO data_buku (pengarang, judul, penerbit, tahun_terbit, isbn_issn, jumlah_halaman, deskripsi, tersedia, sumber, kode_barcode, kode_rak) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [
    pengarang,
    judul,
    penerbit,
    tahun_terbit,
    isbn_issn,
    jumlah_halaman,
    deskripsi,
    tersedia,
    sumber,
    kode_barcode,
    kode_rak,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    return res.status(201).json({ message: "Book added successfully" });
  });
});

app.delete("/delete-buku/:id", (req, res) => {
  const bookId = req.params.id;

  const sql = "DELETE FROM data_buku WHERE kode_barcode = ?";
  db.query(sql, [bookId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    return res.json({ message: "Book deleted successfully" });
  });
});

app.put("/update-buku/:id", (req, res) => {
  const bookId = req.params.id;
  const {
    pengarang,
    judul,
    penerbit,
    tahun_terbit,
    isbn_issn,
    jumlah_halaman,
    deskripsi,
    sumber,
    kode_barcode,
    kode_rak,
  } = req.body;

  const sql =
    "UPDATE data_buku SET pengarang = ?, judul = ?, penerbit = ?, tahun_terbit = ?, isbn_issn = ?, jumlah_halaman = ?, deskripsi = ?, sumber = ?, kode_barcode = ?, kode_rak = ? WHERE kode_barcode = ?";
  const values = [
    pengarang,
    judul,
    penerbit,
    tahun_terbit,
    isbn_issn,
    jumlah_halaman,
    deskripsi,
    sumber,
    kode_barcode,
    kode_rak,
    bookId,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    return res.json({ message: "Book updated successfully" });
  });
});

app.put("/pengembalian-buku/:id", (req, res) => {
  const bookId = req.params.id;
  const { tersedia, peminjam, tenggat_kembali } = req.body;

  const sql =
    "UPDATE data_buku SET tersedia = ?, peminjam = ?, tenggat_kembali = ? WHERE kode_barcode = ?";
  const values = [tersedia, peminjam, tenggat_kembali, bookId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    return res.json({ message: "Book updated successfully" });
  });
});

app.post("/denda-buku", (req, res) => {
  const { id_peminjam, kode_barcode } = req.body;

  const sql =
    "INSERT INTO denda_buku (id_peminjam, kode_barcode) VALUES ( ?, ?)";
  const values = [id_peminjam, kode_barcode];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    return res.status(201).json({ message: "Denda Buku added successfully" });
  });
});

app.post("/duplicate-buku/:id", (req, res) => {
  const bookId = req.params.id;

  const sql = "SELECT * FROM data_buku WHERE kode_barcode = ?";
  db.query(sql, [bookId], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    const generateKodeBarcode = () => {
      const randomNumber = Math.floor(Math.random() * 1000000);
      const formattedNumber = randomNumber.toString().padStart(6, "0");
      return formattedNumber;
    };

    const book = data[0];
    const duplicatedBook = { ...book };
    delete duplicatedBook.no_buku; // Remove the id field to insert as a new record

    const newKodeBarcode = generateKodeBarcode();
    duplicatedBook.kode_barcode = newKodeBarcode;

    const insertSql = "INSERT INTO data_buku SET ?";
    db.query(insertSql, duplicatedBook, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Duplication failed" });
      }

      return res.json({ message: "Book duplicated successfully" });
    });
  });
});

// TRANSACTION
app.get("/transaction", (req, res) => {
  const sql = "SELECT * FROM transaksi";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err });
    }

    // if (data.length === 0) {
    //   return res.status(404).json({ error: "Transaction not found" });
    // }

    return res.json(data);
  });
});

app.get("/fetch-transaction/:transactionID", (req, res) => {
  const { transactionID } = req.params;

  const sql = "SELECT * FROM transaksi WHERE id_transaksi = ?";
  db.query(sql, [transactionID], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.json(data[0]);
  });
});

app.post("/add-transaksi", (req, res) => {
  const { id_user, kode_barcode, tanggal_pinjam, tenggat_kembali, status } =
    req.body;

  const sql =
    "INSERT INTO transaksi (id_user, kode_barcode, tanggal_pinjam, tenggat_kembali, status) VALUES ( ?, ?, ?, ?, ?)";
  const values = [
    id_user,
    kode_barcode,
    tanggal_pinjam,
    tenggat_kembali,
    status,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const transactionId = result.insertId;

    return res
      .status(201)
      .json({ message: "Transaction added successfully", transactionId });
  });
});

// TRANSAKSI PENGEMBALIAN
app.get("/pengembalian", (req, res) => {
  const sql = "SELECT * FROM transaksi WHERE status = 'Selesai'";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    // if (data.length === 0) {
    //   return res.status(404).json({ error: "Transaction not found" });
    // }

    return res.json(data);
  });
});

app.get("/pengembalian/:transactionID", (req, res) => {
  const { transactionID } = req.params;

  const sql = "SELECT * FROM transaksi WHERE id_transaksi = ?";
  db.query(sql, [transactionID], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.json(data[0]);
  });
});

app.put("/pengembalian/:transactionId", (req, res) => {
  const { transactionId } = req.params;
  const newStatus = "Selesai";
  const currentDate = new Date().toISOString().split("T")[0];
  const { denda } = req.body;
  const sql =
    "UPDATE transaksi SET status = ?, tanggal_kembali = ?, denda = ? WHERE id_transaksi = ?";
  const values = [newStatus, currentDate, denda, transactionId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.json({ message: "Status updated successfully" });
  });
});

// USERS
app.get("/users", (req, res) => {
  const userIds = req.query.userIds.split(",").map(Number);

  const sql = "SELECT * FROM users WHERE id IN (?)";
  db.query(sql, [userIds], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    return res.json(data);
  });
});

app.get("/users/:userID", (req, res) => {
  const { userID } = req.params;

  const sql =
    "SELECT t.*, u.nama AS peminjam FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.id = ?";
  db.query(sql, [userID], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.json(data[0]);
  });
});

app.listen(8080, () => {
  console.log("running on PORT 8080");
});
