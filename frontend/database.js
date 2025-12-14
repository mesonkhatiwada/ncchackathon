let db;
let SQL;
let dbInitialized = false;

async function initDatabase() {
    try {
        // Load SQL.js
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
        const stmt = db.prepare(`INSERT INTO users 
            (email, password, name, user_type, login_method, google_id, avatar, verification_documents) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        stmt.run([
            userData.email, 
            userData.password, 
            userData.name, 
            userData.userType, 
            userData.loginMethod, 
            userData.googleId || null, 
            userData.avatar, 
            userData.verificationDocs || null
        ]);
        stmt.free();
        
        saveDatabase();
        return { success: true, message: 'Registration submitted for verification' };
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
            result = db.exec(
                "SELECT * FROM users WHERE email = ? AND password = ? AND verification_status = 'approved'", 
                [email, password]
            );
        } else {
            result = db.exec(
                "SELECT * FROM users WHERE email = ? AND login_method = 'google' AND verification_status = 'approved'", 
                [email]
            );
        }
        
        if (result.length && result[0].values.length) {
            const user = {
                id: result[0].values[0][0],
                email: result[0].values[0][1],
                name: result[0].values[0][3],
                userType: result[0].values[0][4],
                avatar: result[0].values[0][7]
            };
            return { success: true, user };
        }
        
        return { success: false, message: 'Invalid credentials or account not approved' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed: ' + error.message };
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
                    createdAt: row[10]
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
        console.error('Database not initialized');
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
                    createdAt: row[10]
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
        console.error('Database not initialized');
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
                    createdAt: row[10]
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
        console.error('Database not initialized');
        return;
    }

    try {
        db.run("UPDATE users SET verification_status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
        saveDatabase();
    } catch (error) {
        console.error('Error approving user:', error);
    }
}

function rejectUser(userId) {
    if (!dbInitialized || !db) {
        console.error('Database not initialized');
        return;
    }

    try {
        db.run("UPDATE users SET verification_status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
        saveDatabase();
    } catch (error) {
        console.error('Error rejecting user:', error);
    }
}

function adminLogin(email, password) {
    if (!dbInitialized || !db) {
        console.error('Database not initialized');
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

// Initialize database when script loads
if (typeof window !== 'undefined') {
    initDatabase();
}