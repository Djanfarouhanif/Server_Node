let map;
let routeLayer;
let positionMarker;
let accuracyCircle;
let markersLayer;
let currentPoints = [];

window.addEventListener('DOMContentLoaded', () => {
  // Initialiser la carte centrée sur Paris
  map = L.map('map').setView([6.134187, 1.21966], 13);
  
  L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
  }).addTo(map);

  // Gérer le fichier JSON
  document.getElementById('fileInput').addEventListener('change', handleFile);
  document.getElementById('locateBtn').addEventListener('click', locateMe);
  // Choice panel buttons
  const showRouteBtn = document.getElementById('showRouteBtn');
  const showMarkersBtn = document.getElementById('showMarkersBtn');
  if (showRouteBtn) showRouteBtn.addEventListener('click', () => displayRouteFromPoints());
  if (showMarkersBtn) showMarkersBtn.addEventListener('click', () => displayMarkers());
});

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const points = extractCoordinates(data);

      if (!points.length) {
        alert("Aucune coordonnée trouvée !");
        return;
      }

      // Stocke les points et affiche le panneau de choix
      currentPoints = points;
      const panel = document.getElementById('choicePanel');
      if (panel) panel.classList.remove('hidden');
      
    } catch (err) {
      alert("Fichier JSON invalide !");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

function displayRoute(data) {
  // Gardé pour compatibilité si on veut afficher directement depuis un objet
  const points = Array.isArray(data) ? data : extractCoordinates(data);
  if (!points || !points.length) return;

  // Nettoyer les marqueurs si présents
  if (markersLayer) {
    map.removeLayer(markersLayer);
    markersLayer = null;
  }

  if (routeLayer) map.removeLayer(routeLayer);
  routeLayer = L.polyline(points, { color: 'cyan', weight: 4 }).addTo(map);
  map.fitBounds(routeLayer.getBounds());
}

function displayRouteFromPoints() {
  const panel = document.getElementById('choicePanel');
  if (panel) panel.classList.add('hidden');
  if (!currentPoints || !currentPoints.length) return;
  // enlever markers
  if (markersLayer) {
    map.removeLayer(markersLayer);
    markersLayer = null;
  }
  if (routeLayer) map.removeLayer(routeLayer);
  routeLayer = L.polyline(currentPoints, { color: 'cyan', weight: 4 }).addTo(map);
  map.fitBounds(routeLayer.getBounds());
}

function displayMarkers() {
  const panel = document.getElementById('choicePanel');
  if (panel) panel.classList.add('hidden');
  if (!currentPoints || !currentPoints.length) return;

  // retirer polyline si existante
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }

  // Nettoyer ancien groupe
  if (markersLayer) map.removeLayer(markersLayer);
  markersLayer = L.layerGroup();

  currentPoints.forEach((pt, idx) => {
    // pt attendu [lat, lng]
    const marker = L.marker(pt).bindPopup(`Point ${idx + 1}`);
    markersLayer.addLayer(marker);
  });

  markersLayer.addTo(map);

  // Ajuster la vue
  try {
    map.fitBounds(markersLayer.getBounds(), { maxZoom: 16 });
  } catch (e) {
    // si une seule position, center directement
    if (currentPoints[0]) map.setView(currentPoints[0], 14);
  }
}

// 🔍 Extraction souple (pour différents formats de JSON)
function extractCoordinates(data) {
  // Si c’est une liste directe
  if (Array.isArray(data) && data[0]?.latitude !== undefined && data[0]?.longitude !== undefined) {
    // Leaflet attend [lat, lng]
    return data.map(p => [Number(p.latitude), Number(p.longitude)]);
  }

  // Si c’est une structure plus complexe
  const found = [];
  function recurse(obj) {
    if (Array.isArray(obj)) obj.forEach(recurse);
    else if (obj && typeof obj === 'object') {
      if ('lat' in obj && 'lng' in obj) {
        found.push([obj.lat, obj.lng]);
      } else {
        Object.values(obj).forEach(recurse);
      }
    }
  }
  recurse(data);
  return found;
}

// Géolocalisation : demande la position et l'affiche sur la carte
function locateMe() {
  if (!navigator.geolocation) {
    alert('Géolocalisation non supportée par votre navigateur.');
    return;
  }

  navigator.geolocation.getCurrentPosition(onLocationFound, onLocationError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
}

function onLocationFound(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const accuracy = position.coords.accuracy; // en mètres

  // Nettoyer anciens éléments
  if (positionMarker) map.removeLayer(positionMarker);
  if (accuracyCircle) map.removeLayer(accuracyCircle);

  positionMarker = L.marker([lat, lng]).addTo(map).bindPopup('Vous êtes ici').openPopup();
  accuracyCircle = L.circle([lat, lng], { radius: accuracy, color: 'blue', fillColor: '#cce5ff', fillOpacity: 0.3 }).addTo(map);

  // Ajuster la vue pour inclure la précision
  const group = L.featureGroup([positionMarker, accuracyCircle]);
  map.fitBounds(group.getBounds(), { maxZoom: 16 });
}

function onLocationError(err) {
  console.error(err);
  switch (err.code) {
    case err.PERMISSION_DENIED:
      alert('Permission refusée pour la géolocalisation.');
      break;
    case err.POSITION_UNAVAILABLE:
      alert('Position indisponible.');
      break;
    case err.TIMEOUT:
      alert('La demande de position a expiré.');
      break;
    default:
      alert('Erreur de géolocalisation : ' + err.message);
  }
}
