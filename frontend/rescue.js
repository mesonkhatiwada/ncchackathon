let currentUser = null;
let uploadedImages = [];
let userLocation = null;

function checkSession() {
    const session = sessionStorage.getItem('hamrocare_session');
    if (!session) {
        window.location.href = 'index.html';
        return false;
    }
    
    try {
        const data = JSON.parse(session);
        const hourInMs = 3600000;
        if (Date.now() - data.timestamp < hourInMs * 24) {
            currentUser = data.user;
            prefillUserInfo();
            return true;
        } else {
            sessionStorage.removeItem('hamrocare_session');
            window.location.href = 'index.html';
            return false;
        }
    } catch (e) {
        window.location.href = 'index.html';
        return false;
    }
}

function prefillUserInfo() {
    if (currentUser) {
        document.getElementById('reporterName').value = currentUser.name || '';
        document.getElementById('reporterEmail').value = currentUser.email || '';
        document.getElementById('reporterPhone').value = currentUser.phoneNumber || '';
    }
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Error', 'Geolocation is not supported by your browser');
        return;
    }
    
    const btn = event.target;
    btn.innerHTML = '<i class="ri-loader-4-line"></i> Getting location...';
    btn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            const display = document.getElementById('coordinatesDisplay');
            display.innerHTML = `
                <i class="ri-map-pin-line"></i> 
                Location captured: ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}
            `;
            display.classList.add('show');
            
            btn.innerHTML = '<i class="ri-check-line"></i> Location Captured';
            btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            
            showNotification('Success', 'Location captured successfully');
        },
        (error) => {
            btn.innerHTML = '<i class="ri-focus-line"></i> Use My Current Location';
            btn.disabled = false;
            
            let message = 'Unable to get your location';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Location permission denied. Please enable location access.';
            }
            showNotification('Error', message);
        }
    );
}

function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    
    if (uploadedImages.length + files.length > 5) {
        showNotification('Error', 'Maximum 5 images allowed');
        return;
    }
    
    files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
            showNotification('Error', `File ${file.name} is too large. Maximum 10MB allowed.`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImages.push({
                data: e.target.result,
                name: file.name
            });
            renderImagePreviews();
        };
        reader.readAsDataURL(file);
    });
}

function renderImagePreviews() {
    const grid = document.getElementById('imagePreviewGrid');
    grid.innerHTML = uploadedImages.map((img, index) => `
        <div class="image-preview-item">
            <img src="${img.data}" alt="${img.name}">
            <button class="remove-image" onclick="removeImage(${index})">
                <i class="ri-close-line"></i>
            </button>
        </div>
    `).join('');
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreviews();
}

function handleRescueSubmit(event) {
    event.preventDefault();
    
   
    if (typeof dbInitialized === 'undefined' || !dbInitialized) {
        showNotification('Error', 'Database is not ready. Please wait a moment and try again.');
        return;
    }
    
    if (uploadedImages.length === 0) {
        showNotification('Warning', 'Please upload at least one image of the animal');
        return;
    }
    
    const rescueData = {
        id: 'RSC' + Date.now(),
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        animalType: document.getElementById('animalType').value,
        emergencyLevel: document.getElementById('emergencyLevel').value,
        condition: document.getElementById('conditionDesc').value,
        location: {
            address: document.getElementById('locationAddress').value,
            city: document.getElementById('locationCity').value,
            district: document.getElementById('locationDistrict').value,
            landmark: document.getElementById('locationLandmark').value,
            coordinates: userLocation
        },
        reporter: {
            name: document.getElementById('reporterName').value,
            phone: document.getElementById('reporterPhone').value,
            email: document.getElementById('reporterEmail').value
        },
        images: uploadedImages,
        status: 'pending',
        timestamp: new Date().toISOString(),
        dateSubmitted: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    try {
        const result = saveRescueReport(rescueData);
        
        if (result.success) {
           
            db.run("UPDATE users SET rescue_pending = rescue_pending + 1 WHERE id = ?", [currentUser.id]);
            saveDatabase();
            
            // Add activity
            addUserActivity(currentUser.id, {
                type: 'rescue',
                icon: 'ri-heart-pulse-line',
                title: 'Rescue Report Submitted',
                description: `Reported ${rescueData.animalType} rescue - ${rescueData.emergencyLevel} priority`,
                time: 'Just now'
            });
            
            
            document.getElementById('reportIdDisplay').textContent = rescueData.id;
            document.getElementById('successModal').classList.add('show');
            
            
            document.getElementById('rescueForm').reset();
            uploadedImages = [];
            renderImagePreviews();
            document.getElementById('coordinatesDisplay').classList.remove('show');
            userLocation = null;
            
            
            const locationBtn = document.querySelector('.location-btn');
            locationBtn.innerHTML = '<i class="ri-focus-line"></i> Use My Current Location';
            locationBtn.style.background = '';
            
        } else {
            showNotification('Error', result.message || 'Failed to submit rescue report. Please try again.');
        }
    } catch (error) {
        console.error('Rescue submission error:', error);
        showNotification('Error', 'An error occurred: ' + error.message);
    }
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('show');
    window.location.href = 'dashboard.html';
}

function showNotification(title, message) {
    const toast = document.getElementById('notificationToast');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    
    if (toast && titleEl && messageEl) {
        titleEl.textContent = title;
        messageEl.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    if (!checkSession()) return;
    
    
    const checkDbReady = setInterval(() => {
        if (typeof dbInitialized !== 'undefined' && dbInitialized) {
            clearInterval(checkDbReady);
            console.log('Database ready for rescue reports');
        }
    }, 100);
    
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#22c55e';
        uploadArea.style.background = '#f0fdf4';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#e5e5e5';
        uploadArea.style.background = '#fafafa';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e5e5e5';
        uploadArea.style.background = '#fafafa';
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            const input = document.getElementById('rescueImages');
            const dt = new DataTransfer();
            files.forEach(file => dt.items.add(file));
            input.files = dt.files;
            handleImageUpload({ target: input });
        }
    });
});