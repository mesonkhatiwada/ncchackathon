let currentUser = null;

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

function loadUserProfile() {
    if (!currentUser || !dbInitialized) return;
    
    const profile = getUserProfile(currentUser.id);
    if (profile) {
        currentUser = { ...currentUser, ...profile };
        
        document.getElementById('headerAvatar').src = currentUser.avatar;
        document.getElementById('headerName').textContent = currentUser.name;
        document.getElementById('headerEmail').textContent = currentUser.email;
        
        const donationAmount = currentUser.donationsTotal || 0;
        document.getElementById('totalDonations').textContent = `Rs. ${donationAmount.toLocaleString()}`;
        document.getElementById('itemsDonated').textContent = currentUser.itemsDonated || 0;
        document.getElementById('animalsRescued').textContent = currentUser.animalsRescued || 0;
        
        document.getElementById('profileAvatar').src = currentUser.avatar;
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileBadge').textContent = currentUser.userType.toUpperCase();
        
        document.getElementById('editName').value = currentUser.name;
        document.getElementById('editEmail').value = currentUser.email;
        document.getElementById('editPhone').value = currentUser.phoneNumber || '';
        
        document.getElementById('donationTotal').textContent = `Rs. ${donationAmount.toLocaleString()}`;
        document.getElementById('donationItems').textContent = currentUser.itemsDonated || 0;
        document.getElementById('donationCount').textContent = currentUser.donationCount || 0;
        
        document.getElementById('rescueTotal').textContent = currentUser.animalsRescued || 0;
        document.getElementById('rescuePending').textContent = currentUser.rescuePending || 0;
        document.getElementById('rescueCompleted').textContent = currentUser.rescueCompleted || 0;
        
        updateBadges();
        loadRecentActivity();
    }
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    const activities = getUserActivities(currentUser.id);
    
    if (!activities || activities.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="ri-information-line"></i>
                </div>
                <div class="activity-info">
                    <p>No recent activity</p>
                    <span>Start by making a donation or rescue report</span>
                </div>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-info">
                <p>${activity.title}</p>
                <span>${activity.description} • ${activity.time}</span>
            </div>
        </div>
    `).join('');
}

function updateBadges() {
    const donations = currentUser.donationsTotal || 0;
    const rescued = currentUser.animalsRescued || 0;
    
    let badgesEarned = 0;
    
    if (donations > 0) {
        unlockBadge('badge-first-donation');
        badgesEarned++;
    }
    updateBadgeProgress('badge-first-donation', donations > 0 ? 100 : 0);
    
    if (donations >= 5000) {
        unlockBadge('badge-generous-giver');
        badgesEarned++;
    }
    updateBadgeProgress('badge-generous-giver', Math.min((donations / 5000) * 100, 100));
    
    if (rescued >= 5) {
        unlockBadge('badge-life-saver');
        badgesEarned++;
    }
    updateBadgeProgress('badge-life-saver', Math.min((rescued / 5) * 100, 100));
    
    if (rescued >= 10) {
        unlockBadge('badge-hero');
        badgesEarned++;
    }
    updateBadgeProgress('badge-hero', Math.min((rescued / 10) * 100, 100));
    
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

function showSection(sectionId) {
    event.preventDefault();
    
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    const titles = {
        'overview': 'Dashboard Overview',
        'profile': 'My Profile',
        'badges': 'Badges & Achievements',
        'donations': 'My Donations',
        'rescues': 'Rescue Activity'
    };
    document.getElementById('sectionTitle').textContent = titles[sectionId] || 'Dashboard';
}

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
        
        const session = JSON.parse(sessionStorage.getItem('hamrocare_session'));
        session.user.name = name;
        session.user.phoneNumber = phone;
        sessionStorage.setItem('hamrocare_session', JSON.stringify(session));
        
        document.getElementById('headerName').textContent = name;
        document.getElementById('profileName').textContent = name;
        
        document.getElementById('editPassword').value = '';
        document.getElementById('editConfirmPassword').value = '';
        
        showNotification('Success', 'Profile updated successfully');
        
        if (phone && phone !== currentUser.phoneNumber) {
            sendSMSNotification(phone);
        }
    } else {
        showNotification('Error', result.message);
    }
}

async function sendSMSNotification(phoneNumber) {
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
    }
}

function handleLogout() {
    sessionStorage.removeItem('hamrocare_session');
    window.location.href = 'index.html';
}

function toggleSidebar() {
    document.querySelector('.dashboard-sidebar').classList.toggle('active');
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

window.addEventListener('load', function() {
    if (!checkSession()) return;
    
    const checkDbReady = setInterval(() => {
        if (typeof dbInitialized !== 'undefined' && dbInitialized) {
            clearInterval(checkDbReady);
            loadUserProfile();
        }
    }, 100);
});