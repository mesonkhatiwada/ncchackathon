let db;
let dbInitialized = false;

function createDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            name TEXT NOT NULL,
            user_type TEXT NOT NULL,
            login_method TEXT NOT NULL,
            google_id TEXT,
            avatar TEXT,
            phone_number TEXT,
            verification_status TEXT DEFAULT 'pending',
            verification_documents TEXT,
            donations_total REAL DEFAULT 0,
            items_donated INTEGER DEFAULT 0,
            animals_rescued INTEGER DEFAULT 0,
            donation_count INTEGER DEFAULT 0,
            rescue_pending INTEGER DEFAULT 0,
            rescue_completed INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS rescue_reports (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            user_name TEXT NOT NULL,
            user_email TEXT NOT NULL,
            animal_type TEXT NOT NULL,
            emergency_level TEXT NOT NULL,
            condition_desc TEXT NOT NULL,
            location_address TEXT NOT NULL,
            location_city TEXT NOT NULL,
            location_district TEXT NOT NULL,
            location_landmark TEXT,
            location_coordinates TEXT,
            reporter_name TEXT NOT NULL,
            reporter_phone TEXT NOT NULL,
            reporter_email TEXT,
            images TEXT,
            status TEXT DEFAULT 'pending',
            timestamp TEXT NOT NULL,
            date_submitted TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS user_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            icon TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            time TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    const adminCheck = db.exec("SELECT COUNT(*) as count FROM admins");
    if (adminCheck[0].values[0][0] === 0) {
        db.run("INSERT INTO admins (email, password, name) VALUES (?, ?, ?)", 
            ['admin@hamrocare.com', 'admin123', 'Admin']);
    }

    saveDatabase();
}

function initDatabase() {
    initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` })
        .then(SQL => {
            const savedDb = localStorage.getItem('hamrocare_db');
            
            if (savedDb) {
                try {
                    const uint8Array = new Uint8Array(JSON.parse(savedDb));
                    db = new SQL.Database(uint8Array);
                    console.log('Database loaded from localStorage');
                } catch (e) {
                    console.log('Creating new database');
                    db = new SQL.Database();
                    createDatabase();
                }
            } else {
                db = new SQL.Database();
                createDatabase();
            }
            
            dbInitialized = true;
            console.log('Database initialized successfully');
        })
        .catch(err => {
            console.error('Database initialization failed:', err);
        });
}

function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Array.from(data);
        localStorage.setItem('hamrocare_db', JSON.stringify(buffer));
    }
}

function registerUser(userData) {
    try {
        let verificationStatus = 'pending';

        db.run(
            `INSERT INTO users (email, password, name, user_type, login_method, google_id, avatar, verification_documents, verification_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userData.email,
                userData.password,
                userData.name,
                userData.userType,
                userData.loginMethod,
                userData.googleId || null,
                userData.avatar,
                userData.verificationDocs,
                verificationStatus
            ]
        );
        
        saveDatabase();
        
        return { 
            success: true, 
            message: 'Account created! Waiting for admin approval. You will be able to login once approved.' 
        };
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return { success: false, message: 'Email already registered!' };
        }
        return { success: false, message: 'Registration failed: ' + error.message };
    }
}

function loginUser(email, password) {
    try {
        let query;
        let params;
        
        if (password === null) {
            query = "SELECT * FROM users WHERE email = ? AND login_method = 'google'";
            params = [email];
        } else {
            query = "SELECT * FROM users WHERE email = ? AND password = ?";
            params = [email, password];
        }
        
        const result = db.exec(query, params);
        
        if (result.length > 0 && result[0].values.length > 0) {
            const user = result[0].values[0];
            const columns = result[0].columns;
            
            const userObj = {};
            columns.forEach((col, index) => {
                userObj[col] = user[index];
            });
            
            return { 
                success: true, 
                user: {
                    id: userObj.id,
                    email: userObj.email,
                    name: userObj.name,
                    userType: userObj.user_type,
                    avatar: userObj.avatar,
                    phoneNumber: userObj.phone_number,
                    verificationStatus: userObj.verification_status,
                    donationsTotal: userObj.donations_total,
                    itemsDonated: userObj.items_donated,
                    animalsRescued: userObj.animals_rescued,
                    donationCount: userObj.donation_count,
                    rescuePending: userObj.rescue_pending,
                    rescueCompleted: userObj.rescue_completed
                }
            };
        }
        
        return { success: false, message: 'Invalid email or password' };
    } catch (error) {
        return { success: false, message: 'Login failed: ' + error.message };
    }
}

function getUserProfile(userId) {
    try {
        const result = db.exec("SELECT * FROM users WHERE id = ?", [userId]);
        
        if (result.length > 0 && result[0].values.length > 0) {
            const user = result[0].values[0];
            const columns = result[0].columns;
            
            const userObj = {};
            columns.forEach((col, index) => {
                userObj[col] = user[index];
            });
            
            return {
                id: userObj.id,
                email: userObj.email,
                name: userObj.name,
                userType: userObj.user_type,
                avatar: userObj.avatar,
                phoneNumber: userObj.phone_number,
                verificationStatus: userObj.verification_status,
                donationsTotal: userObj.donations_total,
                itemsDonated: userObj.items_donated,
                animalsRescued: userObj.animals_rescued,
                donationCount: userObj.donation_count,
                rescuePending: userObj.rescue_pending,
                rescueCompleted: userObj.rescue_completed
            };
        }
        
        return null;
    } catch (error) {
        console.error('Get user profile error:', error);
        return null;
    }
}

function updateUserProfile(userId, updateData) {
    try {
        const updates = [];
        const values = [];
        
        if (updateData.name) {
            updates.push('name = ?');
            values.push(updateData.name);
        }
        if (updateData.phoneNumber !== undefined) {
            updates.push('phone_number = ?');
            values.push(updateData.phoneNumber);
        }
        if (updateData.avatar) {
            updates.push('avatar = ?');
            values.push(updateData.avatar);
        }
        if (updateData.password) {
            updates.push('password = ?');
            values.push(updateData.password);
        }
        
        values.push(userId);
        
        db.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        saveDatabase();
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Update failed: ' + error.message };
    }
}

function adminLogin(email, password) {
    try {
        const result = db.exec(
            "SELECT * FROM admins WHERE email = ? AND password = ?",
            [email, password]
        );
        
        if (result.length > 0 && result[0].values.length > 0) {
            const admin = result[0].values[0];
            return { 
                success: true, 
                admin: {
                    id: admin[0],
                    email: admin[1],
                    name: admin[3]
                }
            };
        }
        
        return { success: false, message: 'Invalid credentials' };
    } catch (error) {
        return { success: false, message: 'Login failed: ' + error.message };
    }
}

function getAllUsersFromDB() {
    try {
        const result = db.exec("SELECT * FROM users ORDER BY created_at DESC");
        
        if (result.length > 0) {
            const columns = result[0].columns;
            return result[0].values.map(row => {
                const user = {};
                columns.forEach((col, index) => {
                    user[col] = row[index];
                });
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    userType: user.user_type,
                    avatar: user.avatar,
                    verificationStatus: user.verification_status,
                    verificationDocuments: user.verification_documents,
                    createdAt: user.created_at
                };
            });
        }
        
        return [];
    } catch (error) {
        console.error('Get all users error:', error);
        return [];
    }
}

function getPendingVerifications() {
    try {
        const result = db.exec("SELECT * FROM users WHERE verification_status = 'pending' ORDER BY created_at DESC");
        
        if (result.length > 0) {
            const columns = result[0].columns;
            return result[0].values.map(row => {
                const user = {};
                columns.forEach((col, index) => {
                    user[col] = row[index];
                });
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    userType: user.user_type,
                    avatar: user.avatar,
                    verificationStatus: user.verification_status,
                    verificationDocuments: user.verification_documents,
                    createdAt: user.created_at
                };
            });
        }
        
        return [];
    } catch (error) {
        console.error('Get pending verifications error:', error);
        return [];
    }
}

function getApprovedUsers() {
    try {
        const result = db.exec("SELECT * FROM users WHERE verification_status = 'approved' ORDER BY created_at DESC");
        
        if (result.length > 0) {
            const columns = result[0].columns;
            return result[0].values.map(row => {
                const user = {};
                columns.forEach((col, index) => {
                    user[col] = row[index];
                });
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    userType: user.user_type,
                    avatar: user.avatar,
                    verificationStatus: user.verification_status,
                    verificationDocuments: user.verification_documents,
                    createdAt: user.created_at
                };
            });
        }
        
        return [];
    } catch (error) {
        console.error('Get approved users error:', error);
        return [];
    }
}

function approveUser(userId) {
    try {
        db.run("UPDATE users SET verification_status = 'approved' WHERE id = ?", [userId]);
        saveDatabase();
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Approval failed: ' + error.message };
    }
}

function rejectUser(userId) {
    try {
        db.run("UPDATE users SET verification_status = 'rejected' WHERE id = ?", [userId]);
        saveDatabase();
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Rejection failed: ' + error.message };
    }
}

function verifyNGOCredentials(email, password) {
    try {
        const result = db.exec(
            "SELECT * FROM users WHERE email = ? AND password = ? AND user_type IN ('ngo', 'shelter', 'veterinary') AND verification_status = 'approved'",
            [email, password]
        );
        
        if (result.length > 0 && result[0].values.length > 0) {
            const user = result[0].values[0];
            const columns = result[0].columns;
            
            const userObj = {};
            columns.forEach((col, index) => {
                userObj[col] = user[index];
            });
            
            return {
                id: userObj.id,
                email: userObj.email,
                name: userObj.name,
                userType: userObj.user_type,
                organizationName: userObj.name,
                verificationStatus: userObj.verification_status
            };
        }
        
        return null;
    } catch (error) {
        console.error('NGO verification error:', error);
        return null;
    }
}

function saveRescueReport(reportData) {
    try {
        db.run(
            `INSERT INTO rescue_reports (
                id, user_id, user_name, user_email, animal_type, emergency_level, 
                condition_desc, location_address, location_city, location_district, 
                location_landmark, location_coordinates, reporter_name, reporter_phone, 
                reporter_email, images, status, timestamp, date_submitted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reportData.id,
                reportData.userId,
                reportData.userName,
                reportData.userEmail,
                reportData.animalType,
                reportData.emergencyLevel,
                reportData.condition,
                reportData.location.address,
                reportData.location.city,
                reportData.location.district,
                reportData.location.landmark || null,
                reportData.location.coordinates ? JSON.stringify(reportData.location.coordinates) : null,
                reportData.reporter.name,
                reportData.reporter.phone,
                reportData.reporter.email || null,
                JSON.stringify(reportData.images),
                reportData.status,
                reportData.timestamp,
                reportData.dateSubmitted
            ]
        );
        
        saveDatabase();
        return { success: true };
    } catch (error) {
        console.error('Save rescue report error:', error);
        return { success: false, message: 'Failed to save report: ' + error.message };
    }
}

function getAllRescueReports() {
    try {
        const result = db.exec("SELECT * FROM rescue_reports ORDER BY timestamp DESC");
        
        if (result.length > 0) {
            const columns = result[0].columns;
            return result[0].values.map(row => {
                const report = {};
                columns.forEach((col, index) => {
                    report[col] = row[index];
                });
                
                return {
                    id: report.id,
                    userId: report.user_id,
                    userName: report.user_name,
                    userEmail: report.user_email,
                    animalType: report.animal_type,
                    emergencyLevel: report.emergency_level,
                    condition: report.condition_desc,
                    location: {
                        address: report.location_address,
                        city: report.location_city,
                        district: report.location_district,
                        landmark: report.location_landmark,
                        coordinates: report.location_coordinates ? JSON.parse(report.location_coordinates) : null
                    },
                    reporter: {
                        name: report.reporter_name,
                        phone: report.reporter_phone,
                        email: report.reporter_email
                    },
                    images: report.images ? JSON.parse(report.images) : [],
                    status: report.status,
                    timestamp: report.timestamp,
                    dateSubmitted: report.date_submitted
                };
            });
        }
        
        return [];
    } catch (error) {
        console.error('Get rescue reports error:', error);
        return [];
    }
}

function updateRescueReportStatus(reportId, newStatus) {
    try {
        db.run("UPDATE rescue_reports SET status = ? WHERE id = ?", [newStatus, reportId]);
        saveDatabase();
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Update failed: ' + error.message };
    }
}

function updateUserRescueStats(userId) {
    try {
        db.run("UPDATE users SET animals_rescued = animals_rescued + 1, rescue_completed = rescue_completed + 1 WHERE id = ?", [userId]);
        saveDatabase();
    } catch (error) {
        console.error('Update rescue stats error:', error);
    }
}

function addUserActivity(userId, activityData) {
    try {
        db.run(
            `INSERT INTO user_activities (user_id, activity_type, icon, title, description, time) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, activityData.type, activityData.icon, activityData.title, activityData.description, activityData.time]
        );
        saveDatabase();
    } catch (error) {
        console.error('Add activity error:', error);
    }
}

function getUserActivities(userId) {
    try {
        const result = db.exec(
            "SELECT * FROM user_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
            [userId]
        );
        
        if (result.length > 0) {
            const columns = result[0].columns;
            return result[0].values.map(row => {
                const activity = {};
                columns.forEach((col, index) => {
                    activity[col] = row[index];
                });
                return {
                    type: activity.activity_type,
                    icon: activity.icon,
                    title: activity.title,
                    description: activity.description,
                    time: activity.time
                };
            });
        }
        
        return [];
    } catch (error) {
        console.error('Get activities error:', error);
        return [];
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('load', initDatabase);
}