let currentUser = null;

// Check session and load user data
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

// Load user profile data
function loadUserProfile() {
    if (!currentUser || !dbInitialized) return;
    
    const profile = getUserProfile(currentUser.id);
    if (profile) {
        currentUser = { ...currentUser, ...profile };
        
        // Update header
        document.getElementById('headerAvatar').src = currentUser.avatar;
        document.getElementById('headerName').textContent = currentUser.name;
        document.getElementById('headerEmail').textContent = currentUser.email;
        
        // Update overview stats
        document.getElementById('totalDonations').textContent = `Rs. ${currentUser.donationsTotal || 0}`;
        document.getElementById('itemsDonated').textContent = currentUser.itemsDonated || 0;
        document.getElementById('animalsRescued').textContent = currentUser.animalsRescued || 0;
        
        // Update profile section
        document.getElementById('profileAvatar').src = currentUser.avatar;
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileBadge').textContent = currentUser.userType.toUpperCase();
        
        document.getElementById('editName').value = currentUser.name;
        document.getElementById('editEmail').value = currentUser.email;
        document.getElementById('editPhone').value = currentUser.phoneNumber || '';
        
        // Update donation summary
        document.getElementById('donationTotal').textContent = `Rs. ${currentUser.donationsTotal || 0}`;
        document.getElementById('donationItems').textContent = currentUser.itemsDonated || 0;
        document.getElementById('donationCount').textContent = '0'; // Will be updated with real data
        
        // Update rescue summary
        document.getElementById('rescueTotal').textContent = currentUser.animalsRescued || 0;
        document.getElementById('rescuePending').textContent = '0'; // Will be updated with real data
        document.getElementById('rescueCompleted').textContent = currentUser.animalsRescued || 0;
        
        // Update dropdown avatar
        document.getElementById('dropdownAvatar').src = currentUser.avatar;
        document.getElementById('dropdownName').textContent = currentUser.name;
        document.getElementById('dropdownEmail').textContent = currentUser.email;
        
        // Update badges
        updateBadges();
    }
}

// Update badges based on achievements
function updateBadges() {
    const donations = currentUser.donationsTotal || 0;
    const rescued = currentUser.animalsRescued || 0;
    
    let badgesEarned = 0;
    
    // First Donation Badge
    if (donations > 0) {
        unlockBadge('badge-first-donation');
        badgesEarned++;
    }
    updateBadgeProgress('badge-first-donation', donations > 0 ? 100 : 0);
    
    // Generous Giver Badge
    if (donations >= 5000) {
        unlockBadge('badge-generous-giver');
        badgesEarned++;
    }
    updateBadgeProgress('badge-generous-giver', Math.min((donations / 5000) * 100, 100));
    
    // Life Saver Badge
    if (rescued >= 5) {
        unlockBadge('badge-life-saver');
        badgesEarned++;
    }
    updateBadgeProgress('badge-life-saver', Math.min((rescued / 5) * 100, 100));
    
    // Hero Badge
    if (rescued >= 10) {
        unlockBadge('badge-hero');
        badgesEarned++;
    }
    updateBadgeProgress('badge-hero', Math.min((rescued / 10) * 100, 100));
    
    // Champion Badge
    if (donations >= 10000) {
        unlockBadge('badge-champion');
        badgesEarned++;
    }
    updateBadgeProgress('badge-champion', Math.min((donations / 10000) * 100, 100));
    
    document.getElementById('badgesEarned').textContent = badgesEarned;
}

function unlockBadge(badgeId) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        badge.classList.remove('locked');
        badge.classList.add('unlocked');
    }
}

function updateBadgeProgress(badgeId, percentage) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        const progressBar = badge.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    }
}

// Show section
function showSection(sectionId) {
    event.preventDefault();
    
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Update title
    const titles = {
        'overview': 'Dashboard Overview',
        'profile': 'My Profile',
        'badges': 'Badges & Achievements',
        'donations': 'My Donations',
        'rescues': 'Rescue Activity'
    };
    document.getElementById('sectionTitle').textContent = titles[sectionId] || 'Dashboard';
}

// Handle avatar change
function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const newAvatar = e.target.result;
        
        const result = updateUserProfile(currentUser.id, { avatar: newAvatar });
        
        if (result.success) {
            currentUser.avatar = newAvatar;
            document.getElementById('profileAvatar').src = newAvatar;
            document.getElementById('headerAvatar').src = newAvatar;
            document.getElementById('dropdownAvatar').src = newAvatar;
            
            // Update session
            const session = JSON.parse(sessionStorage.getItem('hamrocare_session'));
            session.user.avatar = newAvatar;
            sessionStorage.setItem('hamrocare_session', JSON.stringify(session));
            
            showNotification('Success', 'Profile picture updated successfully');
        } else {
            showNotification('Error', 'Failed to update profile picture');
        }
    };
    reader.readAsDataURL(file);
}

// Handle profile update
function handleProfileUpdate(event) {
    event.preventDefault();
    
    const name = document.getElementById('editName').value;
    const phone = document.getElementById('editPhone').value;
    const password = document.getElementById('editPassword').value;
    const confirmPassword = document.getElementById('editConfirmPassword').value;
    
    if (password && password !== confirmPassword) {
        showNotification('Error', 'Passwords do not match');
        return;
    }
    
    if (password && password.length < 6) {
        showNotification('Error', 'Password must be at least 6 characters');
        return;
    }
    
    const updateData = {
        name: name,
        phoneNumber: phone
    };
    
    if (password) {
        updateData.password = password;
    }
    
    const result = updateUserProfile(currentUser.id, updateData);
    
    if (result.success) {
        currentUser.name = name;
        currentUser.phoneNumber = phone;
        
        // Update session
        const session = JSON.parse(sessionStorage.getItem('hamrocare_session'));
        session.user.name = name;
        session.user.phoneNumber = phone;
        sessionStorage.setItem('hamrocare_session', JSON.stringify(session));
        
        // Update UI
        document.getElementById('headerName').textContent = name;
        document.getElementById('profileName').textContent = name;
        document.getElementById('dropdownName').textContent = name;
        
        // Clear password fields
        document.getElementById('editPassword').value = '';
        document.getElementById('editConfirmPassword').value = '';
        
        showNotification('Success', 'Profile updated successfully');
        
        // Send SMS if phone number is provided
        if (phone && phone !== currentUser.phoneNumber) {
            sendSMSNotification(phone);
        }
    } else {
        showNotification('Error', result.message);
    }
}

// Send SMS notification (this would call your Go backend)
async function sendSMSNotification(phoneNumber) {
    // This is a placeholder - you'll need to implement the actual API call to your Go backend
    console.log('Sending SMS to:', phoneNumber);
    
    try {
        const response = await fetch('http://localhost:8080/send-sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phoneNumber,
                message: `Hello ${currentUser.name}! Your HamroCare profile has been updated. Thank you for being part of our animal welfare community!`
            })
        });
        
        if (response.ok) {
            showNotification('SMS Sent', 'Profile update notification sent to your phone');
        }
    } catch (error) {
        console.error('SMS sending failed:', error);
        // Don't show error to user - SMS is optional
    }
}

// Handle logout
function handleLogout() {
    sessionStorage.removeItem('hamrocare_session');
    window.location.href = 'index.html';
}

// Toggle sidebar on mobile
function toggleSidebar() {
    document.querySelector('.dashboard-sidebar').classList.toggle('active');
}

// Show notification
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

// Initialize dashboard
window.addEventListener('load', function() {
    if (!checkSession()) return;
    
    // Wait for database to be ready
    const checkDbReady = setInterval(() => {
        if (typeof dbInitialized !== 'undefined' && dbInitialized) {
            clearInterval(checkDbReady);
            loadUserProfile();
        }
    }, 100);
});