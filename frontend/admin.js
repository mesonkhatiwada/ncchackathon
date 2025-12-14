let currentAdmin = null;
let allUsers = [];

function handleAdminLogin(event) {
    event.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    // Check if database is initialized
    if (!dbInitialized) {
        alert('Database is still loading. Please wait a moment and try again.');
        return;
    }
    
    const result = adminLogin(email, password);
    
    if (result.success) {
        currentAdmin = result.admin;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('adminName').textContent = currentAdmin.name;
        loadDashboard();
    } else {
        alert(result.message || 'Invalid admin credentials');
    }
}

function logoutAdmin() {
    currentAdmin = null;
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'pending':
            loadPendingUsers();
            break;
        case 'approved':
            loadApprovedUsers();
            break;
        case 'users':
            loadAllUsers();
            break;
        case 'database':
            loadDatabaseInfo();
            break;
    }
}

function loadDashboard() {
    const users = getAllUsersFromDB();
    const pending = users.filter(u => u.verificationStatus === 'pending');
    const approved = users.filter(u => u.verificationStatus === 'approved');
    const ngos = users.filter(u => u.userType === 'ngo');
    const shelters = users.filter(u => u.userType === 'shelter');
    const vets = users.filter(u => u.userType === 'veterinary');
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('pendingUsers').textContent = pending.length;
    document.getElementById('approvedUsers').textContent = approved.length;
    document.getElementById('ngoCount').textContent = ngos.length;
    document.getElementById('shelterCount').textContent = shelters.length;
    document.getElementById('vetCount').textContent = vets.length;
    document.getElementById('pendingCount').textContent = pending.length;
}

function loadPendingUsers() {
    const users = getPendingVerifications();
    const container = document.getElementById('pendingTable');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-time-line"></i>
                <p>No pending verifications</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-row">
            <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}" 
                 alt="${user.name}" class="user-avatar">
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>${user.email}</p>
            </div>
            <div class="user-type ${user.userType}">${user.userType.toUpperCase()}</div>
            <div class="status ${user.verificationStatus}">${user.verificationStatus}</div>
            <div>${new Date(user.createdAt).toLocaleDateString()}</div>
            <div class="action-buttons">
                ${user.verificationDocuments ? 
                    `<button class="action-btn view-docs" onclick="viewDocuments(${user.id}, '${user.name.replace(/'/g, "\\'")}')">
                        <i class="ri-file-line"></i> Docs
                    </button>` : ''}
                <button class="action-btn approve-btn" onclick="approveUserAccount(${user.id})">
                    <i class="ri-check-line"></i> Approve
                </button>
                <button class="action-btn reject-btn" onclick="rejectUserAccount(${user.id})">
                    <i class="ri-close-line"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

function loadApprovedUsers() {
    const users = getApprovedUsers();
    const container = document.getElementById('approvedTable');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-check-line"></i>
                <p>No approved users</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-row">
            <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}" 
                 alt="${user.name}" class="user-avatar">
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>${user.email}</p>
            </div>
            <div class="user-type ${user.userType}">${user.userType.toUpperCase()}</div>
            <div class="status approved">approved</div>
            <div>${new Date(user.createdAt).toLocaleDateString()}</div>
            <div class="action-buttons">
                <button class="action-btn reject-btn" onclick="rejectUserAccount(${user.id})">
                    <i class="ri-close-line"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

function loadAllUsers() {
    allUsers = getAllUsersFromDB();
    renderUserTable(allUsers);
}

function filterUsers() {
    const typeFilter = document.getElementById('userTypeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filtered = allUsers;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(u => u.userType === typeFilter);
    }
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(u => u.verificationStatus === statusFilter);
    }
    
    renderUserTable(filtered);
}

function renderUserTable(users) {
    const container = document.getElementById('allUsersTable');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-user-line"></i>
                <p>No users found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-row">
            <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}" 
                 alt="${user.name}" class="user-avatar">
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>${user.email}</p>
            </div>
            <div class="user-type ${user.userType}">${user.userType.toUpperCase()}</div>
            <div class="status ${user.verificationStatus}">${user.verificationStatus}</div>
            <div>${new Date(user.createdAt).toLocaleDateString()}</div>
            <div class="action-buttons">
                ${user.verificationDocuments ? 
                    `<button class="action-btn view-docs" onclick="viewDocuments(${user.id}, '${user.name.replace(/'/g, "\\'")}')">
                        <i class="ri-file-line"></i> Docs
                    </button>` : ''}
                ${user.verificationStatus === 'pending' ? `
                    <button class="action-btn approve-btn" onclick="approveUserAccount(${user.id})">
                        <i class="ri-check-line"></i> Approve
                    </button>
                ` : ''}
                ${user.verificationStatus === 'approved' ? `
                    <button class="action-btn reject-btn" onclick="rejectUserAccount(${user.id})">
                        <i class="ri-close-line"></i> Reject
                    </button>
                ` : ''}
                ${user.verificationStatus === 'rejected' ? `
                    <button class="action-btn approve-btn" onclick="approveUserAccount(${user.id})">
                        <i class="ri-check-line"></i> Approve
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function approveUserAccount(userId) {
    approveUser(userId);
    showNotification('Success', 'User approved successfully');
    loadPendingUsers();
    loadApprovedUsers();
    loadAllUsers();
    loadDashboard();
}

function rejectUserAccount(userId) {
    rejectUser(userId);
    showNotification('Success', 'User rejected successfully');
    loadPendingUsers();
    loadApprovedUsers();
    loadAllUsers();
    loadDashboard();
}

function viewDocuments(userId, userName) {
    const result = db.exec("SELECT verification_documents FROM users WHERE id = ?", [userId]);
    const modal = document.getElementById('docViewerModal');
    const docViewerBody = document.getElementById('docViewerBody');
    const docUserName = document.getElementById('docUserName');
    
    docUserName.textContent = `User: ${userName}`;
    
    if (result.length && result[0].values[0][0]) {
        try {
            const docsData = result[0].values[0][0];
            let docs;
            
            // Try to parse as JSON first (for file upload data with base64)
            try {
                docs = JSON.parse(docsData);
            } catch {
                // If not JSON, treat as simple array
                docs = [docsData];
            }
            
            if (Array.isArray(docs) && docs.length > 0) {
                docViewerBody.innerHTML = docs.map((doc, index) => {
                    // Check if doc is an object with base64 data
                    if (typeof doc === 'object' && doc.data) {
                        return `
                            <div class="doc-item" onclick="openImageLightbox('${doc.data}')">
                                <img src="${doc.data}" 
                                     alt="${doc.name}" 
                                     style="cursor: pointer;">
                                <div class="doc-item-name">${doc.name}</div>
                            </div>
                        `;
                    } 
                    // Check if it's a base64 string
                    else if (typeof doc === 'string' && doc.startsWith('data:image')) {
                        return `
                            <div class="doc-item" onclick="openImageLightbox('${doc}')">
                                <img src="${doc}" 
                                     alt="Document ${index + 1}" 
                                     style="cursor: pointer;">
                                <div class="doc-item-name">Document ${index + 1}</div>
                            </div>
                        `;
                    }
                    // Check if it's just a filename
                    else {
                        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(doc);
                        
                        if (isImage) {
                            return `
                                <div class="doc-item">
                                    <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">
                                        <i class="ri-image-line"></i>
                                    </div>
                                    <div class="doc-item-name">${doc}</div>
                                    <div style="padding: 0.5rem; text-align: center; font-size: 0.75rem; color: #999;">
                                        Image filename only (not uploaded)
                                    </div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="doc-item">
                                    <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">
                                        <i class="ri-file-pdf-line"></i>
                                    </div>
                                    <div class="doc-item-name">${doc}</div>
                                </div>
                            `;
                        }
                    }
                }).join('');
            } else {
                docViewerBody.innerHTML = `
                    <div class="no-docs">
                        <i class="ri-file-line"></i>
                        <p>No documents uploaded</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            docViewerBody.innerHTML = `
                <div class="no-docs">
                    <i class="ri-error-warning-line"></i>
                    <p>Error loading documents</p>
                </div>
            `;
        }
    } else {
        docViewerBody.innerHTML = `
            <div class="no-docs">
                <i class="ri-file-line"></i>
                <p>No documents uploaded</p>
            </div>
        `;
    }
    
    modal.classList.add('active');
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeDocViewer();
        }
    };
}

function openImageLightbox(imageSrc) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    
    lightboxImage.src = imageSrc;
    lightbox.classList.add('active');
}

function closeImageLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    lightbox.classList.remove('active');
}

function closeDocViewer() {
    const modal = document.getElementById('docViewerModal');
    modal.classList.remove('active');
}

// Database Management Functions
function loadDatabaseInfo() {
    const users = getAllUsersFromDB();
    const dbData = localStorage.getItem('hamrocare_db');
    const dbSize = dbData ? (dbData.length / 1024).toFixed(2) : 0;
    const lastBackup = localStorage.getItem('hamrocare_last_backup') || 'Never';
    
    document.getElementById('dbTotalRecords').textContent = users.length;
    document.getElementById('dbSize').textContent = dbSize + ' KB';
    document.getElementById('lastBackup').textContent = lastBackup;
}

function exportDatabase() {
    try {
        if (!db) {
            showNotification('Error', 'Database not initialized');
            return;
        }
        
        // Export database
        const data = db.export();
        const blob = new Blob([data], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        
        link.href = url;
        link.download = `hamrocare_backup_${timestamp}.db`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        // Save last backup time
        localStorage.setItem('hamrocare_last_backup', new Date().toLocaleString());
        loadDatabaseInfo();
        
        showNotification('Success', 'Database exported successfully');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error', 'Failed to export database');
    }
}

function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.db')) {
        showNotification('Error', 'Please select a valid .db file');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Create new database from imported file
            db = new SQL.Database(uint8Array);
            
            // Verify the database structure
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
            const hasUsersTable = tables.some(result => 
                result.values.some(row => row[0] === 'users')
            );
            const hasAdminsTable = tables.some(result => 
                result.values.some(row => row[0] === 'admins')
            );
            
            if (!hasUsersTable || !hasAdminsTable) {
                showNotification('Error', 'Invalid database file. Missing required tables.');
                createDatabase(); // Restore to empty database
                return;
            }
            
            // Save to localStorage
            saveDatabase();
            
            // Reload dashboard
            loadDashboard();
            loadDatabaseInfo();
            
            showNotification('Success', 'Database imported successfully');
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Error', 'Failed to import database. File may be corrupted.');
        }
    };
    
    reader.onerror = function() {
        showNotification('Error', 'Failed to read file');
    };
    
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    event.target.value = '';
}

function clearDatabase() {
    const confirmed = confirm('⚠️ WARNING: This will delete ALL user data!\n\nAdmin accounts will be preserved, but all users, pending verifications, and approved accounts will be permanently deleted.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?');
    
    if (!confirmed) return;
    
    const doubleConfirm = confirm('This is your FINAL WARNING!\n\nType YES in the next prompt to proceed with deleting all user data.');
    
    if (!doubleConfirm) return;
    
    const finalConfirm = prompt('Type "DELETE ALL DATA" to confirm (case-sensitive):');
    
    if (finalConfirm !== 'DELETE ALL DATA') {
        showNotification('Cancelled', 'Database clear operation cancelled');
        return;
    }
    
    try {
        // Delete all users but keep admins
        db.run("DELETE FROM users");
        saveDatabase();
        
        // Reload all sections
        loadDashboard();
        loadDatabaseInfo();
        
        showNotification('Success', 'All user data has been cleared');
    } catch (error) {
        console.error('Clear error:', error);
        showNotification('Error', 'Failed to clear database');
    }
}

function showNotification(title, message) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast show';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 3000;
        border-left: 4px solid #4ade80;
        max-width: 400px;
    `;
    
    const icon = title === 'Error' ? 'ri-error-warning-fill' : 'ri-checkbox-circle-fill';
    const color = title === 'Error' ? '#ef4444' : '#4ade80';
    
    toast.innerHTML = `
        <i class="${icon}" style="font-size: 1.5rem; color: ${color};"></i>
        <div>
            <div style="font-weight: 600; color: #333; margin-bottom: 0.2rem;">${title}</div>
            <div style="font-size: 0.9rem; color: #666;">${message}</div>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Wait for database to initialize before loading anything
window.addEventListener('load', function() {
    // Check if database is initialized every 100ms
    const checkDb = setInterval(() => {
        if (dbInitialized) {
            clearInterval(checkDb);
            console.log('Admin panel ready');
        }
    }, 100);
});