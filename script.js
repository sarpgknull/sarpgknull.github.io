const ParkingApp = (function() {
    let parkingSpots = [];
    
    let toggleMarkingModeBtn;
    let centerLocationBtn;
    let exportDataBtn;
    let showAllSpotsBtn;
    let refreshAvailabilityBtn;
    let spotItemsContainer;
    
    function init() {
        toggleMarkingModeBtn = document.getElementById('toggleMarkingMode');
        centerLocationBtn = document.getElementById('centerLocation');
        exportDataBtn = document.getElementById('exportData');
        showAllSpotsBtn = document.getElementById('showAllSpots');
        refreshAvailabilityBtn = document.getElementById('refreshAvailability');
        spotItemsContainer = document.getElementById('spotItems');
        
        toggleMarkingModeBtn.addEventListener('click', toggleMarkingMode);
        centerLocationBtn.addEventListener('click', ParkingMap.findUserLocation);
        exportDataBtn.addEventListener('click', exportParkingSpots);
        showAllSpotsBtn.addEventListener('click', showAllSpots);
        refreshAvailabilityBtn.addEventListener('click', refreshAvailability);
        
        ParkingMap.init();
    }
    
    function toggleMarkingMode() {
        const isOn = toggleMarkingModeBtn.textContent === 'Mark Parking Spot';
        toggleMarkingModeBtn.textContent = isOn ? 'Cancel Marking' : 'Mark Parking Spot';
        toggleMarkingModeBtn.style.backgroundColor = isOn ? '#e74c3c' : '#3498db';
        ParkingMap.setMarkingMode(isOn);
    }
    
    function handleMapClick(latlng) {
        addParkingSpot(latlng);
    }
    
    function addParkingSpot(latlng) {
        const timestamp = new Date().toISOString();
        const newSpot = {
            id: `spot-${Date.now()}`,
            lat: latlng.lat,
            lng: latlng.lng,
            name: `Spot ${parkingSpots.length + 1}`,
            notes: '',
            type: 'regular',
            isAvailable: true,
            created: timestamp,
            updated: timestamp
        };
        
        parkingSpots.push(newSpot);
        const marker = ParkingMap.addMarker(newSpot);
        marker.openPopup();
        renderSpotList();
        toggleMarkingMode();
    }
    
    function createPopupContent(spot) {
        const container = document.createElement('div');
        container.className = 'popup-content';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = spot.name;
        nameInput.placeholder = 'Spot name';
        
        const typeSelect = document.createElement('select');
        const types = ['regular', 'handicapped', 'compact', 'electric', 'reserved'];
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            if (type === spot.type) {
                option.selected = true;
            }
            typeSelect.appendChild(option);
        });
        
        const notesInput = document.createElement('input');
        notesInput.type = 'text';
        notesInput.value = spot.notes || '';
        notesInput.placeholder = 'Notes';
        
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'toggle-container';
        
        const toggleLabel = document.createElement('span');
        toggleLabel.textContent = 'Available:';
        
        const toggleSwitch = document.createElement('label');
        toggleSwitch.className = 'toggle-switch';
        
        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.checked = spot.isAvailable;
        
        const slider = document.createElement('span');
        slider.className = 'slider';
        
        toggleSwitch.appendChild(toggleInput);
        toggleSwitch.appendChild(slider);
        
        toggleContainer.appendChild(toggleLabel);
        toggleContainer.appendChild(toggleSwitch);
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
            updateSpotDetails(
                spot.id, 
                nameInput.value, 
                typeSelect.value, 
                notesInput.value,
                toggleInput.checked
            );
            
            const markerObj = ParkingMap.findMarker(spot.id);
            if (markerObj) {
                markerObj.marker.closePopup();
            }
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.backgroundColor = '#e74c3c';
        deleteBtn.addEventListener('click', () => {
            deleteSpot(spot.id);
        });
        
        container.appendChild(document.createTextNode('Name:'));
        container.appendChild(nameInput);
        container.appendChild(document.createTextNode('Type:'));
        container.appendChild(typeSelect);
        container.appendChild(document.createTextNode('Notes:'));
        container.appendChild(notesInput);
        container.appendChild(toggleContainer);
        container.appendChild(saveBtn);
        container.appendChild(deleteBtn);
        
        return container;
    }
    
    function updateSpotDetails(id, name, type, notes, isAvailable) {
        const spotIndex = parkingSpots.findIndex(spot => spot.id === id);
        if (spotIndex === -1) return;
        
        const updatedSpot = {
            ...parkingSpots[spotIndex],
            name,
            type,
            notes,
            isAvailable,
            updated: new Date().toISOString()
        };
        
        parkingSpots[spotIndex] = updatedSpot;
        ParkingMap.updateMarkerAppearance(id, isAvailable);
        renderSpotList();
    }
    
    function deleteSpot(id) {
        const markerObj = ParkingMap.findMarker(id);
        if (markerObj && markerObj.marker) {
            markerObj.marker.remove();
        }
        
        parkingSpots = parkingSpots.filter(spot => spot.id !== id);
        renderSpotList();
    }
    
    function renderSpotList() {
        spotItemsContainer.innerHTML = '';
        
        if (parkingSpots.length === 0) {
            spotItemsContainer.innerHTML = '<p>No parking spots saved yet.</p>';
            return;
        }
        
        parkingSpots.forEach(spot => {
            const item = document.createElement('div');
            item.className = 'spot-item';
            
            const spotInfo = document.createElement('span');
            spotInfo.textContent = `${spot.name} (${spot.type})`;
            
            const spotStatus = document.createElement('span');
            spotStatus.className = `spot-status status-${spot.isAvailable ? 'available' : 'occupied'}`;
            spotStatus.textContent = spot.isAvailable ? 'Available' : 'Occupied';
            
            item.appendChild(spotInfo);
            item.appendChild(spotStatus);
            
            item.addEventListener('click', () => {
                ParkingMap.centerOn(spot.lat, spot.lng);
                
                const markerObj = ParkingMap.findMarker(spot.id);
                if (markerObj) {
                    markerObj.marker.openPopup();
                }
            });
            
            spotItemsContainer.appendChild(item);
        });
    }
    
    function exportParkingSpots() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(parkingSpots, null, 2));
        const downloadLink = document.createElement("a");
        downloadLink.setAttribute("href", dataStr);
        downloadLink.setAttribute("download", "parking-spots.json");
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    
    function showAllSpots() {
        if (parkingSpots.length === 0) {
            alert("No parking spots saved yet.");
            return;
        }
        
        ParkingMap.fitAllMarkers(parkingSpots);
    }
    
    function refreshAvailability() {
        parkingSpots.forEach(spot => {
            spot.isAvailable = Math.random() < 0.5;
        });
        
        parkingSpots.forEach(spot => {
            ParkingMap.updateMarkerAppearance(spot.id, spot.isAvailable);
        });
        
        renderSpotList();
    }
    
    function getSpotById(id) {
        return parkingSpots.find(spot => spot.id === id);
    }
    
    document.addEventListener('DOMContentLoaded', init);
    
    return {
        handleMapClick,
        createPopupContent,
        getSpotById
    };
})();