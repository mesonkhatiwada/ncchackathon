let currentNGO = null;
let allReports = [];
let autoRefreshInterval = null;
let lastReportCount = 0;

function handleNGOLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('ngoEmail').value;
    const password = document.getElementById('ngoPassword').value;
    
    // Wait for database to be ready
    if (typeof dbInitialized === 'undefined' || !dbInitialized) {
        showNotification('Please Wait', 'Loading database...');
        return;
    }
    
    const ngoUser = verifyNGOCredentials(email, password);
    
    if (ngoUser) {
        currentNGO = ngoUser;
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'flex';
        document.getElementById('ngoName').textContent = ngoUser.organizationName || ngoUser.name || 'NGO Admin';
        
        loadDashboard();
        startAutoRefresh();
        showNotification('Welcome', `Logged in as ${ngoUser.name}`);
    } else {
        showNotification('Error', 'Invalid credentials or pending approval. Contact admin.');
    }
}

function loadDashboard() {
    const checkDbReady = setInterval(() => {
        if (typeof dbInitialized !== 'undefined' && dbInitialized) {
            clearInterval(checkDbReady);
            loadAllReports();
            updateStats();
        }
    }, 100);
}

function loadAllReports() {
    try {
        allReports = getAllRescueReports() || [];
        
        // Sort reports by priority and timestamp
        allReports.sort((a, b) => {
            // Priority order: critical > high > medium > low
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = (priorityOrder[b.emergencyLevel] || 0) - (priorityOrder[a.emergencyLevel] || 0);
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // If same priority, sort by timestamp (newest first)
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        // Check for new reports
        if (allReports.length > lastReportCount) {
            const newReportsCount = allReports.length - lastReportCount;
            if (lastReportCount > 0) { // Don't notify on first load
                showNotification('New Report!', `${newReportsCount} new rescue report${newReportsCount > 1 ? 's' : ''} received`);
                playNotificationSound();
            }
            lastReportCount = allReports.length;
        }
        
        renderRecentReports();
        filterReports();
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error', 'Failed to load reports');
    }
}

function updateStats() {
    const critical = allReports.filter(r => r.emergencyLevel === 'critical' && r.status === 'pending').length;
    const pending = allReports.filter(r => r.status === 'pending').length;
    const inProgress = allReports.filter(r => r.status === 'in-progress').length;
    const completed = allReports.filter(r => r.status === 'completed').length;
    const total = allReports.length;
    
    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('pendingCount').textContent = pending + inProgress;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingBadge').textContent = pending;
    
    // Update page title with pending count for browser tab notification
    if (pending > 0) {
        document.title = `(${pending}) NGO Dashboard - HamroCare`;
    } else {
        document.title = 'NGO Dashboard - HamroCare';
    }
}

function renderRecentReports() {
    const container = document.getElementById('recentReportsList');
    
    // Show top 8 reports (prioritized by emergency level and timestamp)
    const recent = allReports.slice(0, 8);
    
    if (recent.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">No rescue reports yet</p>';
        return;
    }
    
    container.innerHTML = recent.map(report => {
        const timeAgo = getTimeAgo(report.timestamp);
        const isUrgent = report.emergencyLevel === 'critical' || report.emergencyLevel === 'high';
        
        return `
            <div class="report-card ${isUrgent && report.status === 'pending' ? 'urgent' : ''}" onclick="viewReportDetails('${report.id}')">
                <div class="report-header">
                    <span class="report-id">${report.id}</span>
                    <span class="emergency-badge ${report.emergencyLevel}">${report.emergencyLevel.toUpperCase()}</span>
                </div>
                <div class="report-body">
                    <div class="report-info">
                        <div class="info-row">
                            <i class="ri-bear-smile-line"></i>
                            <span><strong>Animal:</strong> ${report.animalType}</span>
                        </div>
                        <div class="info-row">
                            <i class="ri-map-pin-line"></i>
                            <span><strong>Location:</strong> ${report.location.city}, ${report.location.district}</span>
                        </div>
                        <div class="info-row">
                            <i class="ri-user-line"></i>
                            <span><strong>Reporter:</strong> ${report.reporter.name}</span>
                        </div>
                        <div class="info-row">
                            <i class="ri-phone-line"></i>
                            <span><strong>Contact:</strong> ${report.reporter.phone}</span>
                        </div>
                    </div>
                    ${report.images && report.images.length > 0 ? `
                        <div class="report-preview-images">
                            ${report.images.slice(0, 2).map(img => `<img src="${img.data}" alt="Animal">`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="report-footer">
                    <span class="report-time"><i class="ri-time-line"></i> ${timeAgo}</span>
                    <span class="status-badge ${report.status}">${report.status.replace('-', ' ').toUpperCase()}</span>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const reportTime = new Date(timestamp);
    const diffMs = now - reportTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function filterReports() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const emergencyFilter = document.getElementById('emergencyFilter')?.value || 'all';
    const animalFilter = document.getElementById('animalFilter')?.value || 'all';
    
    let filtered = [...allReports];
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (emergencyFilter !== 'all') {
        filtered = filtered.filter(r => r.emergencyLevel === emergencyFilter);
    }
    
    if (animalFilter !== 'all') {
        filtered = filtered.filter(r => r.animalType === animalFilter);
    }
    
    const activeView = document.querySelector('.view.active')?.id;
    
    if (activeView === 'rescues') {
        renderReportsGrid(filtered.filter(r => r.status !== 'completed'), 'rescueReportsGrid');
    } else if (activeView === 'completed') {
        renderReportsGrid(filtered.filter(r => r.status === 'completed'), 'completedReportsGrid');
    }
}

function renderReportsGrid(reports, containerId) {
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    if (reports.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem; grid-column: 1/-1;">No reports found</p>';
        return;
    }
    
    container.innerHTML = reports.map(report => {
        const timeAgo = getTimeAgo(report.timestamp);
        const isUrgent = report.emergencyLevel === 'critical' || report.emergencyLevel === 'high';
        
        return `
            <div class="report-card ${isUrgent && report.status === 'pending' ? 'urgent' : ''}" onclick="viewReportDetails('${report.id}')">
                <div class="report-header">
                    <span class="report-id">${report.id}</span>
                    <span class="emergency-badge ${report.emergencyLevel}">${report.emergencyLevel.toUpperCase()}</span>
                </div>
                <div class="report-body">
                    <div class="report-info">
                        <div class="info-row">
                            <i class="ri-bear-smile-line"></i>
                            <span><strong>Animal:</strong> ${report.animalType}</span>
                        </div>
                        <div class="info-row">
                            <i class="ri-map-pin-line"></i>
                            <span><strong>Location:</strong> ${report.location.city}</span>
                        </div>
                        <div class="info-row">
                            <i class="ri-user-line"></i>
                            <span><strong>Reporter:</strong> ${report.reporter.name}</span>
                        </div>
                        <div class="info-row">
                            <i class="ri-phone-line"></i>
                            <span><strong>Contact:</strong> ${report.reporter.phone}</span>
                        </div>
                    </div>
                    ${report.images && report.images.length > 0 ? `
                        <div class="report-images">
                            ${report.images.slice(0, 3).map(img => `<img src="${img.data}" alt="Animal">`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="report-footer">
                    <span class="report-time"><i class="ri-time-line"></i> ${timeAgo}</span>
                    <span class="status-badge ${report.status}">${report.status.replace('-', ' ').toUpperCase()}</span>
                </div>
            </div>
        `;
    }).join('');
}

function viewReportDetails(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;
    
    const timeAgo = getTimeAgo(report.timestamp);
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <div class="modal-title">
                <h2>Rescue Report: ${report.id}</h2>
                <p style="color: #666;">Submitted: ${report.dateSubmitted} (${timeAgo})</p>
            </div>
            <div class="modal-badges">
                <span class="emergency-badge ${report.emergencyLevel}">${report.emergencyLevel.toUpperCase()}</span>
                <span class="status-badge ${report.status}">${report.status.replace('-', ' ').toUpperCase()}</span>
            </div>
        </div>
        
        ${report.images && report.images.length > 0 ? `
            <div class="image-gallery">
                ${report.images.map(img => `<img src="${img.data}" alt="Animal" onclick="window.open('${img.data}', '_blank')">`).join('')}
            </div>
        ` : ''}
        
        <div class="detail-section">
            <h3><i class="ri-information-line"></i> Animal Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Animal Type</label>
                    <p>${report.animalType}</p>
                </div>
                <div class="detail-item">
                    <label>Emergency Level</label>
                    <p>${report.emergencyLevel}</p>
                </div>
                <div class="detail-item" style="grid-column: 1/-1;">
                    <label>Condition Description</label>
                    <p>${report.condition}</p>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3><i class="ri-map-pin-line"></i> Location Details</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Address</label>
                    <p>${report.location.address}</p>
                </div>
                <div class="detail-item">
                    <label>City</label>
                    <p>${report.location.city}</p>
                </div>
                <div class="detail-item">
                    <label>District</label>
                    <p>${report.location.district}</p>
                </div>
                ${report.location.landmark ? `
                    <div class="detail-item">
                        <label>Landmark</label>
                        <p>${report.location.landmark}</p>
                    </div>
                ` : ''}
                ${report.location.coordinates ? `
                    <div class="detail-item">
                        <label>GPS Coordinates</label>
                        <p><a href="https://www.google.com/maps?q=${report.location.coordinates.latitude},${report.location.coordinates.longitude}" target="_blank" style="color: #22c55e; text-decoration: none;">
                            ${report.location.coordinates.latitude.toFixed(6)}, ${report.location.coordinates.longitude.toFixed(6)}
                            <i class="ri-external-link-line"></i> Open in Google Maps
                        </a></p>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="detail-section">
            <h3><i class="ri-user-line"></i> Reporter Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Name</label>
                    <p>${report.reporter.name}</p>
                </div>
                <div class="detail-item">
                    <label>Phone</label>
                    <p><a href="tel:${report.reporter.phone}" style="color: #22c55e; text-decoration: none;">
                        <i class="ri-phone-line"></i> ${report.reporter.phone}
                    </a></p>
                </div>
                ${report.reporter.email ? `
                    <div class="detail-item">
                        <label>Email</label>
                        <p><a href="mailto:${report.reporter.email}" style="color: #22c55e; text-decoration: none;">
                            <i class="ri-mail-line"></i> ${report.reporter.email}
                        </a></p>
                    </div>
                ` : ''}
                <div class="detail-item">
                    <label>User Account</label>
                    <p>${report.userName} (${report.userEmail})</p>
                </div>
            </div>
        </div>
        
        ${report.status !== 'completed' ? `
            <div class="action-buttons">
                ${report.status === 'pending' ? `
                    <button class="btn btn-progress" onclick="updateReportStatus('${report.id}', 'in-progress')">
                        <i class="ri-time-line"></i> Mark In Progress
                    </button>
                ` : ''}
                <button class="btn btn-complete" onclick="updateReportStatus('${report.id}', 'completed')">
                    <i class="ri-check-line"></i> Mark Completed
                </button>
            </div>
        ` : ''}
    `;
    
    document.getElementById('reportModal').classList.add('show');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('show');
}

function updateReportStatus(reportId, newStatus) {
    try {
        const report = allReports.find(r => r.id === reportId);
        if (!report) {
            showNotification('Error', 'Report not found');
            return;
        }
        
        const result = updateRescueReportStatus(reportId, newStatus);
        
        if (result.success) {
            report.status = newStatus;
            
            // Update user statistics
            if (newStatus === 'completed') {
                // Update the user's rescue stats
                try {
                    db.run("UPDATE users SET animals_rescued = animals_rescued + 1, rescue_completed = rescue_completed + 1, rescue_pending = rescue_pending - 1 WHERE id = ?", [report.userId]);
                    saveDatabase();
                } catch (error) {
                    console.error('Error updating user stats:', error);
                }
            } else if (newStatus === 'in-progress' && report.status === 'pending') {
                // Just mark as in progress, don't change counters
            }
            
            updateStats();
            filterReports();
            renderRecentReports();
            closeReportModal();
            
            showNotification('Success', `Report ${reportId} marked as ${newStatus.replace('-', ' ')}`);
        } else {
            showNotification('Error', 'Failed to update report status');
        }
    } catch (error) {
        console.error('Error updating report status:', error);
        showNotification('Error', 'An error occurred while updating status');
    }
}

function showView(viewId) {
    event.preventDefault();
    
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    const titles = {
        'overview': 'Dashboard Overview',
        'rescues': 'Active Rescue Reports',
        'completed': 'Completed Rescues'
    };
    const titleEl = document.getElementById('viewTitle');
    if (titleEl) {
        titleEl.textContent = titles[viewId] || 'Dashboard';
    }
    
    if (viewId === 'rescues' || viewId === 'completed') {
        filterReports();
    }
}

function startAutoRefresh() {
    // Refresh every 30 seconds
    autoRefreshInterval = setInterval(() => {
        if (dbInitialized) {
            loadAllReports();
            updateStats();
        }
    }, 30000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio notification not supported');
    }
}

function handleNGOLogout() {
    stopAutoRefresh();
    currentNGO = null;
    allReports = [];
    lastReportCount = 0;
    
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
    document.getElementById('ngoEmail').value = '';
    document.getElementById('ngoPassword').value = '';
    document.title = 'NGO Dashboard - HamroCare';
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

// Add manual refresh button handler
function manualRefresh() {
    if (dbInitialized) {
        loadAllReports();
        updateStats();
        showNotification('Refreshed', 'Dashboard data updated');
    }
}

// Handle page visibility - pause/resume auto-refresh
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could reduce refresh rate or pause
        console.log('Dashboard hidden');
    } else {
        // Page is visible again, refresh immediately
        if (currentNGO && dbInitialized) {
            loadAllReports();
            updateStats();
        }
    }
});