// Map functionality for SmartWaste 
let map;
let marker;
let mapInitialized = false;

function initMap() {
    if (mapInitialized) return;
    
    console.log('Initializing map...');
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    // Initialize map centered on Kenya
    map = L.map('map').setView([-0.0236, 37.9062], 7);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Add click event to get coordinates
    map.on('click', function(e) {
        handleMapClick(e.latlng.lat, e.latlng.lng);
    });

    // Try to get user's current location
    locateUser();
    
    mapInitialized = true;
    console.log('Map initialized successfully');
}

// Handle map clicks
function handleMapClick(lat, lng) {
    document.getElementById('latitude').value = lat.toFixed(6);
    document.getElementById('longitude').value = lng.toFixed(6);
    
    if (marker) map.removeLayer(marker);
    
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup('Selected Location<br>Lat: ' + lat.toFixed(6) + '<br>Lng: ' + lng.toFixed(6))
        .openPopup();

    getAddressFromCoordinates(lat, lng);
    map.panTo([lat, lng]);
}

// Locate user with GPS
function locateUser() {
    if (navigator.geolocation) {
        showAlert('Detecting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 15);
                handleMapClick(lat, lng);
                showAlert('Location detected successfully!', 'success');
            },
            (error) => {
                console.log('Geolocation error:', error);
                showAlert('Please click on the map to select your location', 'info');
                map.setView([-1.2921, 36.8219], 10);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    } else {
        showAlert('Geolocation not supported. Please click on the map.', 'warning');
    }
}

// Reverse geocode from coordinates → Address
function getAddressFromCoordinates(lat, lng) {
    showAlert('Getting address information...', 'info');
    
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            if (data.display_name) {
                document.getElementById('address').value = data.display_name;
                showAlert('Address found successfully!', 'success');
            } else {
                document.getElementById('address').value = `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                showAlert('Approximate location set. You can edit manually.', 'info');
            }
        })
        .catch(error => {
            console.error('Geocoding error:', error);
            document.getElementById('address').value = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            showAlert('Using coordinates. You can add a custom address.', 'info');
        });
}

// NEW: Search by text address
function searchLocation() {
    const query = document.getElementById('addressSearch').value.trim();
    if (!query) {
        showAlert('Please enter a location to search.', 'warning');
        return;
    }

    showAlert('Searching location...', 'info');
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(response => response.json())
        .then(results => {
            if (results && results.length > 0) {
                const lat = parseFloat(results[0].lat);
                const lng = parseFloat(results[0].lon);
                map.setView([lat, lng], 15);
                handleMapClick(lat, lng);
                showAlert('Location found!', 'success');
            } else {
                showAlert('No results found. Try a different location.', 'danger');
            }
        })
        .catch(error => {
            console.error('Search error:', error);
            showAlert('Error searching for location.', 'danger');
        });
}

// Show form/map section
function showMapSection() {
    document.getElementById('createPickupSection').style.display = 'block';
    setTimeout(() => {
        if (!mapInitialized) initMap();
    }, 100);
}
