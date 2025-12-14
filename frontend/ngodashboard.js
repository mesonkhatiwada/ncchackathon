let currentNGO = null;
let allReports = [];

function handleNGOLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('ngoEmail').value;
    const password = document.getElementById('ngoPassword').value;
    
    const ngoUser = verifyNGOCredentials(email, password);
    
    if (ngoUser) {
        currentNGO = ngoUser;
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'flex';
        document.getElementById('ngoName').textContent = ngoUser.organizationName || ngoUser.name || 'NGO Admin';
        
        loadDashboard();
    } else {
        showNotification('Error', 'Invalid credentials. Please contact admin for approval.');
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
    allReports = getAllRescueReports() || [];
    renderRecentReports();
    filterReports();
}

function updateStats() {
    const critical = allReports.filter(r => r.emergencyLevel === 'critical' && r.status === 'pending').length;
    const pending = allReports.filter(r => r.status === 'pending').length;
    const completed = allReports.filter(r => r.status === 'completed').length;
    const total = allReports.length;
    
    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingBadge').textContent = pending;
}

function renderRecentReports() {
    const container = document.getElementById('recentReportsList');
    const recent = allReports.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">No rescue reports yet</p>';
        return;
    }
    
    container.innerHTML = recent.map(report => `
        <div class="report-card" onclick="viewReportDetails('${report.id}')">
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
                </div>
            </div>
            <div class="report-footer">
                <span class="report-time">${report.dateSubmitted}</span>
                <span class="status-badge ${report.status}">${report.status.replace('-', ' ').toUpperCase()}</span>
            </div>
        </div>
    `).join('');
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
    
    const activeView = document.querySelector('.view.active').id;
    
    if (activeView === 'rescues') {
        renderReportsGrid(filtered.filter(r => r.status !== 'completed'), 'rescueReportsGrid');
    } else if (activeView === 'completed') {
        renderReportsGrid(filtered.filter(r => r.status === 'completed'), 'completedReportsGrid');
    }
}

function renderReportsGrid(reports, containerId) {
    const container = document.getElementById(containerId);
    
    if (reports.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem; grid-column: 1/-1;">No reports found</p>';
        return;
    }
    
    container.innerHTML = reports.map(report => `
        <div class="report-card" onclick="viewReportDetails('${report.id}')">
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
                <span class="report-time">${report.dateSubmitted}</span>
                <span class="status-badge ${report.status}">${report.status.replace('-', ' ').toUpperCase()}</span>
            </div>
        </div>
    `).join('');
}

function viewReportDetails(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-header">
            <div class="modal-title">
                <h2>Rescue Report: ${report.id}</h2>
                <p style="color: #666;">Submitted: ${report.dateSubmitted}</p>
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
                            <i class="ri-external-link-line"></i>
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
                    <p><a href="tel:${report.reporter.phone}" style="color: #22c55e; text-decoration: none;">${report.reporter.phone}</a></p>
                </div>
                ${report.reporter.email ? `
                    <div class="detail-item">
                        <label>Email</label>
                        <p><a href="mailto:${report.reporter.email}" style="color: #22c55e; text-decoration: none;">${report.reporter.email}</a></p>
                    </div>
                ` : ''}
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
    const result = updateRescueReportStatus(reportId, newStatus);
    
    if (result.success) {
        const report = allReports.find(r => r.id === reportId);
        if (report) {
            report.status = newStatus;
        }
        
        updateStats();
        filterReports();
        renderRecentReports();
        closeReportModal();
        
        showNotification('Success', `Report status updated to ${newStatus.replace('-', ' ')}`);
    } else {
        showNotification('Error', 'Failed to update report status');
    }
}

function showView(viewId) {
    event.preventDefault();
    
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.getElementById(viewId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    const titles = {
        'overview': 'Dashboard Overview',
        'rescues': 'Rescue Reports',
        'completed': 'Completed Rescues'
    };
    document.getElementById('viewTitle').textContent = titles[viewId] || 'Dashboard';
    
    if (viewId === 'rescues' || viewId === 'completed') {
        filterReports();
    }
}

function handleNGOLogout() {
    currentNGO = null;
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
    document.getElementById('ngoEmail').value = '';
    document.getElementById('ngoPassword').value = '';
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