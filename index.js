const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const BIN_DIR = path.join(__dirname, "bin");

if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR);

app.use("/api", require("./routes/api"));
app.use("/", require("./routes/ingest"));
app.use("/", require("./routes/viewer"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(process.env.PORT || 8181, () => {
  console.log(`Listening on port ${process.env.PORT || 8181}`);
});
