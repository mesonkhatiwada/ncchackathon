let currentUser = null;
let currentShelter = null;
let pickupLocation = null;

// Dummy shelter data
const shelters = [
    {
        id: 1,
        name: "Happy Paws Shelter",
        description: "We rescue and rehabilitate stray dogs and cats, providing them with medical care, food, and shelter until they find their forever homes. Your donation helps us save more lives.",
        image: "donations/1.png",
        qrCode: "donations/qr1.png",
        animals: 45,
        rescued: 120
    },
    {
        id: 2,
        name: "Wildlife Care Nepal",
        description: "Dedicated to protecting wildlife and providing emergency care for injured animals. We work with local communities to create safe habitats and rescue animals in distress.",
        image: "donations/2.png",
        qrCode: "donations/qr2.png",
        animals: 32,
        rescued: 89
    },
    {
        id: 3,
        name: "Street Angels Animal Rescue",
        description: "Our mission is to rescue street animals, provide medical treatment, and find loving homes. We also run awareness programs about responsible pet ownership.",
        image: "donations/3.png",
        qrCode: "donations/qr3.png",
        animals: 67,
        rescued: 203
    }
];

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

function loadDonationPosts() {
    const container = document.getElementById('donationPosts');
    
    container.innerHTML = shelters.map(shelter => `
        <div class="donation-post">
            <div class="post-image">
                <img src="${shelter.image}" alt="${shelter.name}">
            </div>
            <div class="post-content">
                <span class="shelter-badge">
                    <i class="ri-shield-star-line"></i>
                    Verified Shelter
                </span>
                <h2>${shelter.name}</h2>
                <p>${shelter.description}</p>
                
                <div class="post-stats">
                    <div class="stat-item">
                        <i class="ri-bear-smile-line"></i>
                        <span>${shelter.animals} Animals</span>
                    </div>
                    <div class="stat-item">
                        <i class="ri-heart-pulse-line"></i>
                        <span>${shelter.rescued} Rescued</span>
                    </div>
                </div>
                
                <div class="post-actions">
                    <button class="btn-donate" onclick="openDonationModal(${shelter.id})">
                        <i class="ri-hand-heart-line"></i>
                        Donate Now
                    </button>
                    <button class="btn-qr" onclick="showQRCode(${shelter.id})">
                        <i class="ri-qr-code-line"></i>
                        QR
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openDonationModal(shelterId) {
    currentShelter = shelters.find(s => s.id === shelterId);
    if (!currentShelter) return;
    
    document.getElementById('donationTypeModal').classList.add('show');
}

function closeDonationTypeModal() {
    document.getElementById('donationTypeModal').classList.remove('show');
}

function showMoneyDonation() {
    closeDonationTypeModal();
    
    const shelterInfo = document.getElementById('shelterInfoMoney');
    shelterInfo.innerHTML = `
        <i class="ri-building-line"></i>
        <div>
            <h3>${currentShelter.name}</h3>
            <p>Donating to this shelter</p>
        </div>
    `;
    
    document.getElementById('moneyDonationModal').classList.add('show');
}

function closeMoneyDonation() {
    document.getElementById('moneyDonationModal').classList.remove('show');
    document.getElementById('moneyDonationForm').reset();
}

function showGoodiesDonation() {
    closeDonationTypeModal();
    
    const shelterInfo = document.getElementById('shelterInfoGoodies');
    shelterInfo.innerHTML = `
        <i class="ri-building-line"></i>
        <div>
            <h3>${currentShelter.name}</h3>
            <p>Donating goodies to this shelter</p>
        </div>
    `;
    
    document.getElementById('goodiesDonationModal').classList.add('show');
}

function closeGoodiesDonation() {
    document.getElementById('goodiesDonationModal').classList.remove('show');
    document.getElementById('goodiesDonationForm').reset();
    pickupLocation = null;
    document.getElementById('pickupCoordinates').classList.remove('show');
}

function showQRCode(shelterId) {
    const shelter = shelters.find(s => s.id === shelterId);
    if (!shelter) return;
    
    // Create a modal to show QR code
    const qrModal = document.createElement('div');
    qrModal.className = 'modal show';
    qrModal.innerHTML = `
        <div class="modal-content" style="text-align: center;">
            <button class="close-modal" onclick="this.closest('.modal').remove()">
                <i class="ri-close-line"></i>
            </button>
            <h2>Scan to Donate</h2>
            <p style="margin-bottom: 1.5rem;">${shelter.name}</p>
            <img src="${shelter.qrCode}" alt="QR Code" style="max-width: 300px; width: 100%; border-radius: 12px;">
            <p style="margin-top: 1.5rem; color: #6b7280;">Scan this QR code with your Khalti or eSewa app</p>
        </div>
    `;
    document.body.appendChild(qrModal);
}

function handleMoneyDonation(event) {
    event.preventDefault();
    
    const paymentMethod = document.getElementById('paymentMethod').value;
    const username = document.getElementById('paymentUsername').value;
    const mpin = document.getElementById('paymentMPIN').value;
    const amount = parseFloat(document.getElementById('donationAmount').value);
    const remarks = document.getElementById('donationRemarks').value;
    
   
    closeMoneyDonation();
    
   
    document.getElementById('loadingText').textContent = 'Processing your donation...';
    document.getElementById('loadingModal').classList.add('show');
    
    
    setTimeout(() => {
        
        document.getElementById('loadingModal').classList.remove('show');
        
        
        if (dbInitialized) {
            try {
                db.run(
                    "UPDATE users SET donations_total = donations_total + ?, donation_count = donation_count + 1, items_donated = items_donated + 1 WHERE id = ?",
                    [amount, currentUser.id]
                );
                saveDatabase();
                
                
                addUserActivity(currentUser.id, {
                    type: 'donation',
                    icon: 'ri-money-dollar-circle-line',
                    title: 'Money Donation',
                    description: `Donated Rs. ${amount} to ${currentShelter.name} via ${paymentMethod}`,
                    time: 'Just now'
                });
            } catch (error) {
                console.error('Error updating donation:', error);
            }
        }
        
        
        document.getElementById('successTitle').textContent = 'Donation Successful!';
        document.getElementById('successMessage').textContent = `Thank you for donating Rs. ${amount} to ${currentShelter.name}. Your contribution will help save animal lives.`;
        document.getElementById('successModal').classList.add('show');
    }, 3000);
}

function handleGoodiesDonation(event) {
    event.preventDefault();
    
    const goodiesType = document.getElementById('goodiesType').value;
    const description = document.getElementById('goodiesDescription').value;
    const address = document.getElementById('pickupAddress').value;
    
    
    closeGoodiesDonation();
    
    
    document.getElementById('loadingText').textContent = 'Scheduling pickup...';
    document.getElementById('loadingModal').classList.add('show');
    

    setTimeout(() => {
      
        document.getElementById('loadingModal').classList.remove('show');
        
     
        if (dbInitialized) {
            try {
                db.run(
                    "UPDATE users SET items_donated = items_donated + 1 WHERE id = ?",
                    [currentUser.id]
                );
                saveDatabase();
                
                
                addUserActivity(currentUser.id, {
                    type: 'donation',
                    icon: 'ri-gift-line',
                    title: 'Goodies Donation',
                    description: `Donated ${goodiesType} to ${currentShelter.name} - Pickup scheduled`,
                    time: 'Just now'
                });
            } catch (error) {
                console.error('Error updating donation:', error);
            }
        }
        
       
        document.getElementById('successTitle').textContent = 'Pickup Scheduled!';
        document.getElementById('successMessage').textContent = `Our delivery rider will reach you soon to collect your donation for ${currentShelter.name}. Thank you for your generosity!`;
        document.getElementById('successModal').classList.add('show');
    }, 2500);
}

function getPickupLocation() {
    if (!navigator.geolocation) {
        showNotification('Error', 'Geolocation is not supported by your browser');
        return;
    }
    
    const btn = event.target;
    btn.innerHTML = '<i class="ri-loader-4-line"></i> Getting location...';
    btn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            pickupLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            const display = document.getElementById('pickupCoordinates');
            display.innerHTML = `
                <i class="ri-map-pin-line"></i> 
                Location captured: ${pickupLocation.latitude.toFixed(6)}, ${pickupLocation.longitude.toFixed(6)}
            `;
            display.classList.add('show');
            
            btn.innerHTML = '<i class="ri-check-line"></i> Location Captured';
            btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            
            showNotification('Success', 'Location captured successfully');
        },
        (error) => {
            btn.innerHTML = '<i class="ri-focus-line"></i> Use Current Location';
            btn.disabled = false;
            
            let message = 'Unable to get your location';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Location permission denied. Please enable location access.';
            }
            showNotification('Error', message);
        }
    );
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('show');
    
    
    if (currentUser && dbInitialized) {
        const updatedProfile = getUserProfile(currentUser.id);
        if (updatedProfile) {
            const session = JSON.parse(sessionStorage.getItem('hamrocare_session'));
            session.user = { ...session.user, ...updatedProfile };
            sessionStorage.setItem('hamrocare_session', JSON.stringify(session));
        }
    }
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
            loadDonationPosts();
        }
    }, 100);
});