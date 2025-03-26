const ParkingMap = (function() {
    let map;
    let markingMode = false;
    let markers = [];
    
    function init() {
        map = L.map('map').setView([51.505, -0.09], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        map.on('click', function(e) {
            if (markingMode) {
                if (typeof ParkingApp.handleMapClick === 'function') {
                    ParkingApp.handleMapClick(e.latlng);
                }
            }
        });
        
        map.on('locationfound', (e) => {
            L.circle(e.latlng, {radius: 100, color: 'blue', fill: false}).addTo(map);
        });
        
        map.on('locationerror', (e) => {
            alert("Could not find your location: " + e.message);
        });
    }
    
    function setMarkingMode(isOn) {
        markingMode = isOn;
        map.getContainer().style.cursor = markingMode ? 'crosshair' : '';
    }
    
    function addMarker(spot) {
        const markerOptions = {
            icon: L.icon({
                iconUrl: spot.isAvailable ? 
                    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png' : 
                    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
            })
        };
        
        const marker = L.marker([spot.lat, spot.lng], markerOptions).addTo(map);
        
        marker.bindPopup(() => {
            return ParkingApp.createPopupContent(spot);
        });
        
        markers.push({id: spot.id, marker});
        
        return marker;
    }
    
    function clearMarkers() {
        markers.forEach(m => map.removeLayer(m.marker));
        markers = [];
    }
    
    function findMarker(spotId) {
        return markers.find(m => m.id === spotId);
    }
    
    function centerOn(lat, lng, zoom = 18) {
        map.setView([lat, lng], zoom);
    }
    
    function findUserLocation() {
        map.locate({setView: true, maxZoom: 16});
    }
    
    function fitAllMarkers(spots) {
        if (spots.length === 0) return;
        
        const bounds = L.latLngBounds(spots.map(spot => [spot.lat, spot.lng]));
        map.fitBounds(bounds, {padding: [50, 50]});
    }
    
    function updateMarkerAppearance(spotId, isAvailable) {
        const markerObj = findMarker(spotId);
        if (!markerObj) return;
        
        map.removeLayer(markerObj.marker);
        
        const spot = ParkingApp.getSpotById(spotId);
        if (!spot) return;
        
        const newMarker = addMarker(spot);
        
        const index = markers.findIndex(m => m.id === spotId);
        if (index !== -1) {
            markers[index].marker = newMarker;
        }
    }
    
    return {
        init,
        setMarkingMode,
        addMarker,
        clearMarkers,
        findMarker,
        centerOn,
        findUserLocation,
        fitAllMarkers,
        updateMarkerAppearance
    };
})();