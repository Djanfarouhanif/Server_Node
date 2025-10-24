const http = require('http');
const fs = require('fs');

const DATA_FILE = 'data/data.json';

// Au démarrage, on lit le fichier ou on crée un tableau vide
let storedData = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    storedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    storedData = [];
  }
}

// Fonction pour sauvegarder uniquement la dernière donnée ajoutée
function appendData(newData) {
  storedData.push(newData);
  fs.writeFileSync(DATA_FILE, JSON.stringify(storedData, null, 2));
}

const server = http.createServer((req, res) => {
  // Route POST pour ajouter des données
  if (req.method === 'POST' && req.url === '/upload') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        appendData(data); // on ajoute la nouvelle donnée
        console.log('Nouvelle donnée ajoutée :', data);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Donnée reçue et stockée', data }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON invalide' }));
      }
    });
  } 
  // Route GET pour voir toutes les données
  else if (req.method === 'GET' && req.url === '/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(storedData, null, 2));
  } 
  // Autres routes
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(3000, () => console.log('Serveur sur http://localhost:3000'));
