const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = 'data/data.json';
const PUBLIC_DIR = 'map';

// Lecture initiale des données
let storedData = [];
if (fs.existsSync(DATA_FILE)) {
  try { storedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } 
  catch { storedData = []; }
}

// Fonctions pour gérer les données
function appendData(newData) { storedData.push(newData); fs.writeFileSync(DATA_FILE, JSON.stringify(storedData, null, 2)); }
function deleteData(index) { if(index>=0 && index<storedData.length){const removed = storedData.splice(index,1)[0]; fs.writeFileSync(DATA_FILE, JSON.stringify(storedData,null,2)); return removed;} return null; }
function deleteOldDatat(){ const removed = [...storedData]; storedData.length=0; fs.writeFileSync(DATA_FILE, JSON.stringify(storedData,null,2)); return removed; }

const server = http.createServer((req, res) => {

  // Servir fichiers statiques
  if (req.method === 'GET' && (req.url.startsWith('/map') || req.url === '/' || req.url.startsWith('/'))) {

    // Déterminer le fichier à servir
    let filePath;
    if (req.url === '/' || req.url === '/map' || req.url === '/map/') {
      filePath = path.join(PUBLIC_DIR, 'index.html'); // page principale
    } else {
      // enlever le slash initial pour path.join
      const relativePath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
      filePath = path.join(PUBLIC_DIR, relativePath);
    }

    // Vérifier que c'est un fichier
    if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
      res.writeHead(404, {'Content-Type':'text/plain'});
      return res.end('Fichier introuvable');
    }

    // Type MIME
    const ext = path.extname(filePath);
    let contentType = 'text/plain';
    if (ext === '.html') contentType = 'text/html';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    const content = fs.readFileSync(filePath);
    res.writeHead(200, {'Content-Type': contentType});
    return res.end(content);
  }

  // POST /upload
  else if(req.method==='POST' && req.url==='/upload'){
    let body=''; req.on('data',chunk=>body+=chunk.toString());
    req.on('end',()=>{
      try{ const data = JSON.parse(body); appendData(data); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({message:'Donnée reçue', data})); }
      catch{ res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'JSON invalide'})); }
    });
  }

  // GET /data
  else if(req.method==='GET' && req.url==='/data'){
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify(storedData,null,2));
  }

  // DELETE par index
  else if(req.method==='DELETE' && req.url.startsWith('/data/')){
    const index = parseInt(req.url.split('/')[2],10);
    const removed = deleteData(index);
    if(removed){ res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({message:'Donnée supprimée', removed})); }
    else{ res.writeHead(404,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'Index invalide'})); }
  }

  // DELETE tout
  else if(req.method==='DELETE' && req.url==='/data_all'){
    const removed = deleteOldDatat();
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({message:'Toutes les données supprimées', removed}));
  }

  else{
    res.writeHead(404,{'Content-Type':'text/plain'});
    res.end('Not found');
  }

});

server.listen(3000,()=>console.log('Serveur sur http://localhost:3000'));
