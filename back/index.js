const express = require('express');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const natural = require('natural');
const Fuse = require('fuse.js');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();
const PORT = 3000;
const configadjust = 0.3;

const db = new sqlite3.Database('./database.db');

moment.locale('pt-br');

// Criação das tabelas no banco de dados (se não existirem)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      desc TEXT,
      key TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS live_streams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_name TEXT,
      m3u8_url TEXT,
      createdIn TEXT,
      createdAt TEXT,
      FOREIGN KEY (channel_name) REFERENCES channels(name)
    )
  `);
});

let channels = {};
let liveStreams = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'html')));

// Função para carregar dados do banco de dados (channels)
async function loadDatabase() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM channels', [], (err, rows) => {
      if (err) reject(err);
      channels = {};
      rows.forEach((channel) => {
        channels[channel.name] = channel;
      });
      resolve();
    });
  });
}

// Função para carregar dados do banco de dados (live_streams)
async function loadLiveStreams() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM live_streams', [], (err, rows) => {
      if (err) return reject(err);

      liveStreams = rows.map(stream => ({
        id: stream.id,
        channel_name: stream.channel_name,
        m3u8_url: stream.m3u8_url,
        createdIn: stream.createdIn,
        createdAt: stream.createdAt
      }));

      resolve();
    });
  });
}

function lemmatizeText(text) {
  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(text.toLowerCase());
  const stemmer = natural.PorterStemmer;
  return words.map(word => stemmer.stem(word)).join(' ');
}

function search(query) {
  const lemmatizedQuery = lemmatizeText(query);
  const options = {
    includeScore: true,
    keys: ['name', 'desc'],
    threshold: configadjust,
  };
  const fuse = new Fuse(Object.values(channels), options);
  return fuse.search(lemmatizedQuery);
}

app.use(async (req, res, next) => {
  try {
    await Promise.all([loadDatabase(), loadLiveStreams()]);
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar a database', details: error.message });
  }
});

app.get('/add-channel', (req, res) => {
  const { name, desc } = req.query;
  if (!name || !desc) {
    return res.status(400).json({ error: 'Faltando parâmetros (name, desc)' });
  }
  if (!/^[a-z]+$/.test(name)) {
    return res.status(400).json({ error: 'Nome do canal deve conter apenas letras de a-z e sem espaços' });
  }
  if (channels[name]) {
    return res.status(400).json({ error: 'Canal já existe' });
  }
  const key = crypto.randomBytes(16).toString('hex');
  db.run('INSERT INTO channels (name, desc, key) VALUES (?, ?, ?)', [name, desc, key], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar canal', details: err.message });
    }
    channels[name] = { name, desc, key, id: this.lastID };
    res.json({ message: 'Canal criado com sucesso', key });
  });
});

app.post('/release-live', async (req, res) => {
  const { channel, key } = req.body;
  if (!channel || !key) {
    return res.status(400).json({ error: 'Faltando parâmetros (channel, key)' });
  }

  const channelData = channels[channel];
  if (!channelData || channelData.key !== key) {
    return res.status(403).json({ error: 'Canal inexistente ou chave inválida' });
  }

  const m3u8Url = `SERVIDOR_HLS_NGINX_AQUI`;

  try {
    const response = await axios.head(m3u8Url);
    if (response.status !== 200) {
      return res.status(404).json({ error: 'Arquivo .m3u8 não encontrado para o canal especificado' });
    }

    const createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
    const createdIn = moment().fromNow();

    db.run('INSERT INTO live_streams (channel_name, m3u8_url, createdIn, createdAt) VALUES (?, ?, ?, ?)',
      [channel, m3u8Url, createdIn, createdAt], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erro ao liberar transmissão ao vivo', details: err.message });
        }
        res.json({ message: `Canal ${channel} está liberado com sucesso e sua transmissão já está disponível para o público. Para encerrar a transmissão ao vivo, acesse: https://localhost:${PORT}/rem-live?channel=${channel}&key=${key}` });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar o arquivo .m3u8', details: error.message });
  }
});

app.get('/rem-live', (req, res) => {
  const { channel, key } = req.query;
  if (!channel || !key) {
    return res.status(400).json({ error: 'Faltando parâmetros (channel, key)' });
  }

  const channelData = channels[channel];
  if (!channelData || channelData.key !== key) {
    return res.status(403).json({ error: 'Canal inexistente ou chave inválida' });
  }

  db.run('DELETE FROM live_streams WHERE channel_name = ?', [channel], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao remover transmissão ao vivo', details: err.message });
    }
    fs.rmdirSync(`/var/www/html/hls/${channel}`, { recursive: true });
    res.json({ message: `Transmissão ao vivo do canal ${channel} foi encerrada com sucesso.` });
  });
});

app.get('/get-live-streams', (req, res) => {
  const { ofchannel } = req.query;
  const sql = ofchannel ?
    'SELECT * FROM live_streams WHERE channel_name = ? ORDER BY createdAt DESC' :
    'SELECT * FROM live_streams ORDER BY createdAt DESC';

  db.all(sql, ofchannel ? [ofchannel] : [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter transmissões ao vivo', details: err.message });
    }
    res.json({ liveStreams: rows.map(row => ({
      channel: row.channel_name,
      m3u8_url: row.m3u8_url,
      createdIn: row.createdIn,
      createdAt: moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss')
    })) });
  });
});

app.get('/query-live-streams', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta o parâmetro de pesquisa (query)' });
  }
  const results = search(query).map(result => ({
    channel: result.item.name,
    m3u8_url: result.item.m3u8_url,
    createdIn: result.item.createdIn,
    createdAt: result.item.createdAt,
  }));
  res.json({ results });
});

app.get('/get-channels', (req, res) => {
  db.all('SELECT name, desc FROM channels', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter canais', details: err.message });
    }
    res.json({ channels: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
