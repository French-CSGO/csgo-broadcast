const express = require('express');
const fs = require('fs');
const path = require('path');
const log = require('./helpers/logger');
require('dotenv').config();

const app = express();
const BIN_DIR = path.join(__dirname, 'bin');

if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR);

app.use('/api', require('./routes/api'));
app.use('/', require('./routes/ingest'));
app.use('/', require('./routes/viewer'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  log.info('server', 'Démarrage', {
    port: PORT,
    frag_delay: process.env.FRAG_DELAY || 10,
    timeonline: process.env.TIMEONLINE || 5,
    db_host: process.env.DB_HOST,
    db_name: process.env.DB_NAME,
    log_level: process.env.LOG_LEVEL || 'info',
  });
});
