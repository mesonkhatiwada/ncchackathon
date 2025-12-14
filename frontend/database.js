let db;
let SQL;
let dbInitialized = false;

async function initDatabase() {
    try {
        SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        loadDatabase();
        dbInitialized = true;
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        dbInitialized = false;
    }
}

function loadDatabase() {
    const saved = localStorage.getItem('hamrocare_db');
    if (saved) {
        try {
            const buffer = new Uint8Array(JSON.parse(saved));
            db = new SQL.Database(buffer);
            console.log('Database loaded from localStorage');
        } catch (error) {
            console.error('Failed to load database:', error);
            createDatabase();
        }
    } else {
        createDatabase();
    }
}

function createDatabase() {
    db = new SQL.Database();
    
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        name TEXT NOT NULL,
        user_type TEXT NOT NULL,
        login_method TEXT NOT NULL,
        google_id TEXT,
        avatar TEXT,
        verification_status TEXT DEFAULT 'pending',
        verification_documents TEXT,
        phone_number TEXT,
        donations_total REAL DEFAULT 0,
        items_donated INTEGER DEFAULT 0,
        animals_rescued INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    const adminExists = db.exec("SELECT 1 FROM admins WHERE email = 'admin@hamrocare.com'");
    if (!adminExists.length) {
        db.run("INSERT INTO admins (email, password, name) VALUES (?, ?, ?)", 
            ['admin@hamrocare.com', 'admin123', 'Admin']);
    }
    
    saveDatabase();
    console.log('New database created');
}

function saveDatabase() {
    if (db) {
        try {
            const data = db.export();
            const buffer = new Uint8Array(data);
            localStorage.setItem('hamrocare_db', JSON.stringify(Array.from(buffer)));
        } catch (error) {
            console.error('Failed to save database:', error);
        }
    }
}

function registerUser(userData) {
    if (!dbInitialized || !db) {
        console.error('Database not initialized');
        return { success: false, message: 'Database not ready. Please try again.' };
    }

    try {
        const checkEmail = db.exec("SELECT email FROM users WHERE email = ?", [userData.email]);
        if (checkEmail.length && checkEmail[0].values.length) {
            return { success: false, message: 'Email already exists' };
        }

        // Auto-approve all users - no verification needed
        const verificationStatus = 'approved';

        const stmt = db.prepare(`INSERT INTO users 
            (email, password, name, user_type, login_method, google_id, avatar, verification_documents, verification_status, donations_total, items_donated, animals_rescued) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`);
        
        stmt.run([
            userData.email, 
            userData.password, 
            userData.name, 
            userData.userType, 
            userData.loginMethod, 
            userData.googleId || null, 
            userData.avatar, 
            userData.verificationDocs || null,
            verificationStatus
        ]);
        stmt.free();
        
        saveDatabase();
        console.log('User registered:', userData.email);
        
        return { success: true, message: 'Account created successfully! You can now login.' };
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return { success: false, message: 'Email already exists' };
        }
        return { success: false, message: 'Registration failed: ' + error.message };
    }
}

function loginUser(email, password) {
    if (!dbInitialized || !db) {
        console.error('Database not initialized');
        return { success: false, message: 'Database not ready. Please try again.' };
    }

    try {
        let result;
        
        if (password) {
            const userCheck = db.exec("SELECT * FROM users WHERE email = ?", [email]);
            console.log('User check for email:', email, 'Found:', userCheck.length > 0);
            
            if (userCheck.length && userCheck[0].values.length) {
                const userData = userCheck[0].values[0];
                console.log('User found - Status:', userData[8], 'Password match:', userData[2] === password);
                
                if (userData[8] !== 'approved') {
                    return { success: false, message: 'Your account is pending approval. Please wait for admin verification.' };
                }
                
                if (userData[2] === password) {
                    const user = {
                        id: userData[0],
                        email: userData[1],
                        name: userData[3],
                        userType: userData[4],
                        avatar: userData[7],
                        phoneNumber: userData[10],
                        donationsTotal: userData[11],
                        itemsDonated: userData[12],
                        animalsRescued: userData[13]
                    };
                    console.log('Login successful for:', email);
                    return { success: true, user };
                } else {
                    return { success: false, message: 'Invalid password' };
                }
            } else {
                return { success: false, message: 'Email not found' };
            }
        } else {
            result = db.exec(
                "SELECT * FROM users WHERE email = ? AND login_method = 'google' AND verification_status = 'approved'", 
                [email]
            );
            
            if (result.length && result[0].values.length) {
                const userData = result[0].values[0];
                const user = {
                    id: userData[0],
                    email: userData[1],
                    name: userData[3],
                    userType: userData[4],
                    avatar: userData[7],
                    phoneNumber: userData[10],
                    donationsTotal: userData[11],
                    itemsDonated: userData[12],
                    animalsRescued: userData[13]
                };
                return { success: true, user };
            }
            
            return { success: false, message: 'Google account not found or not approved' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed: ' + error.message };
    }
}

function updateUserProfile(userId, updateData) {
    if (!dbInitialized || !db) {
        return { success: false, message: 'Database not ready' };
    }

    try {
        const updates = [];
        const values = [];

        if (updateData.name) {
            updates.push('name = ?');
            values.push(updateData.name);
        }
        if (updateData.password) {
            updates.push('password = ?');
            values.push(updateData.password);
        }
        if (updateData.avatar) {
            updates.push('avatar = ?');
            values.push(updateData.avatar);
        }
        if (updateData.phoneNumber !== undefined) {
            updates.push('phone_number = ?');
            values.push(updateData.phoneNumber);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        db.run(query, values);
        saveDatabase();

        return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
        console.error('Update error:', error);
        return { success: false, message: 'Failed to update profile' };
    }
}

function getUserProfile(userId) {
    if (!dbInitialized || !db) {
        return null;
    }

    try {
        const result = db.exec("SELECT * FROM users WHERE id = ?", [userId]);
        if (result.length && result[0].values.length) {
            const userData = result[0].values[0];
            return {
                id: userData[0],
                email: userData[1],
                name: userData[3],
                userType: userData[4],
                avatar: userData[7],
                phoneNumber: userData[10],
                donationsTotal: userData[11],
                itemsDonated: userData[12],
                animalsRescued: userData[13],
                createdAt: userData[14]
            };
        }
        return null;
    } catch (error) {
        console.error('Get profile error:', error);
        return null;
    }
}

function getAllUsersFromDB() {
    if (!dbInitialized || !db) {
        console.error('Database not initialized');
        return [];
    }

    try {
        const result = db.exec("SELECT * FROM users ORDER BY created_at DESC");
        const users = [];
        
        if (result.length) {
            result[0].values.forEach(row => {
                users.push({
                    id: row[0],
                    email: row[1],
                    name: row[3],
                    userType: row[4],
                    loginMethod: row[5],
                    verificationStatus: row[8],
                    avatar: row[7],
                    verificationDocuments: row[9],
                    createdAt: row[14]
                });
            });
        }
        return users;
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
}

function getPendingVerifications() {
    if (!dbInitialized || !db) {
        return [];
    }

    try {
        const result = db.exec("SELECT * FROM users WHERE verification_status = 'pending' ORDER BY created_at DESC");
        
        if (result.length) {
            const users = [];
            result[0].values.forEach(row => {
                users.push({
                    id: row[0],
                    email: row[1],
                    name: row[3],
                    userType: row[4],
                    loginMethod: row[5],
                    googleId: row[6],
                    avatar: row[7],
                    verificationStatus: row[8],
                    verificationDocuments: row[9],
                    createdAt: row[14]
                });
            });
            return users;
        }
        return [];
    } catch (error) {
        console.error('Error getting pending users:', error);
        return [];
    }
}

function getApprovedUsers() {
    if (!dbInitialized || !db) {
        return [];
    }

    try {
        const result = db.exec("SELECT * FROM users WHERE verification_status = 'approved' ORDER BY created_at DESC");
        
        if (result.length) {
            const users = [];
            result[0].values.forEach(row => {
                users.push({
                    id: row[0],
                    email: row[1],
                    name: row[3],
                    userType: row[4],
                    loginMethod: row[5],
                    avatar: row[7],
                    verificationStatus: row[8],
                    createdAt: row[14]
                });
            });
            return users;
        }
        return [];
    } catch (error) {
        console.error('Error getting approved users:', error);
        return [];
    }
}

function approveUser(userId) {
    if (!dbInitialized || !db) {
        return;
    }

    try {
        db.run("UPDATE users SET verification_status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
        saveDatabase();
        console.log('User approved:', userId);
    } catch (error) {
        console.error('Error approving user:', error);
    }
}

function rejectUser(userId) {
    if (!dbInitialized || !db) {
        return;
    }

    try {
        db.run("UPDATE users SET verification_status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
        saveDatabase();
        console.log('User rejected:', userId);
    } catch (error) {
        console.error('Error rejecting user:', error);
    }
}

function adminLogin(email, password) {
    if (!dbInitialized || !db) {
        return { success: false, message: 'Database not ready. Please try again.' };
    }

    try {
        const result = db.exec("SELECT * FROM admins WHERE email = ? AND password = ?", [email, password]);
        
        if (result.length && result[0].values.length) {
            return { 
                success: true, 
                admin: { 
                    id: result[0].values[0][0], 
                    email: result[0].values[0][1], 
                    name: result[0].values[0][3] 
                } 
            };
        }
        
        return { success: false, message: 'Invalid admin credentials' };
    } catch (error) {
        console.error('Admin login error:', error);
        return { success: false, message: 'Login failed: ' + error.message };
    }
}

if (typeof window !== 'undefined') {
    initDatabase();
}