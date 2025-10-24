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

// Fonction pour supprimer une donnée par index
function deleteData(index) {
 
  if (index >= 0 && index < storedData.length) {
    const removed = storedData.splice(index, 1)[0];
    fs.writeFileSync(DATA_FILE, JSON.stringify(storedData, null, 2));
    return removed;
  }
  return null;
}
// Fonction pour tous supprimer 
function deleteOldDatat(){
  if (storedData) {
    const removed = [...storedData];
    storedData.length = 0;
    fs.writeFileSync(DATA_FILE, JSON.stringify(storedData, null, 2));
    return removed;
  }
  return null;
  
};

const server = http.createServer((req, res) => {
  // Route POST pour ajouter des données
  if (req.method === 'POST' && req.url === '/upload') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        appendData(data);
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
  // Route DELETE pour supprimer une donnée par index
  else if (req.method === 'DELETE' && req.url.startsWith('/data/')) {
    const index = parseInt(req.url.split('/')[2], 10);
    const removed = deleteData(index);

    if (removed) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Donnée supprimée', removed }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Index invalide' }));
    }
  }
   else if (req.method === 'DELETE' && req.url.startsWith('/data_all')) {
    
    const removed = deleteOldDatat()

    if (removed) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Donnée supprimée', removed }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Index invalide' }));
    }
  }
  // Autres routes
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(3000, () => console.log('Serveur sur http://localhost:3000'));
