// database.js - UPDATED WITH TEXT IDs FOR MEMBERS AND TRAINERS
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util'); 

class DatabaseManager {
    constructor() {
        this.dbPath = this.getDefaultDbPath();
        this.backupPath = null;
        this.backupFilePath = null;
        this.db = null;
        this.autoBackupInterval = null;
        this.initializeDatabaseSync();
        this.initializeBackupFile();
    }

    getDefaultDbPath() {
        const appDataPath = process.env.APPDATA || 
            (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
        const dbDir = path.join(appDataPath, 'DenimGym', 'database');
        
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        return path.join(dbDir, 'denimgym.db');
    }

    initializeBackupFile() {
        const appDataPath = process.env.APPDATA || 
            (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
        const backupDir = path.join(appDataPath, 'DenimGym', 'backups');
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        this.backupFilePath = path.join(backupDir, 'denimgym_backups.json');
        this.backupPath = backupDir;
        
        if (!fs.existsSync(this.backupFilePath)) {
            const initialBackupData = {
                backups: [],
                metadata: {
                    version: '2.0.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            };
            fs.writeFileSync(this.backupFilePath, JSON.stringify(initialBackupData, null, 2), 'utf8');
        }
    }

    initializeDatabaseSync() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                return;
            }
            console.log('Connected to SQLite database');
        });
        
        this.createTablesSync();
    }

    createTablesSync() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS members (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                address TEXT,
                status TEXT NOT NULL DEFAULT 'Active',
                joinDate TEXT NOT NULL,
                amount REAL,
                payment TEXT,
                plan TEXT,
                trainerId TEXT,
                trainerName TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS trainers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                specialty TEXT NOT NULL,
                phone TEXT NOT NULL,
                salary REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'Active',
                joinDate TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )`,
            
          `CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memberId TEXT NOT NULL,
    memberName TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)`,
            
           `CREATE TABLE IF NOT EXISTS trainerSalaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trainerId TEXT NOT NULL,
            trainerName TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            paymentDate TEXT NOT NULL,
            time TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )`,
            
            `CREATE TABLE IF NOT EXISTS receipts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receiptNumber TEXT NOT NULL UNIQUE,
                memberId TEXT NOT NULL,
                memberName TEXT NOT NULL,
                memberType TEXT NOT NULL,
                amount REAL NOT NULL,
                paymentMethod TEXT NOT NULL,
                description TEXT,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                htmlContent TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reportType TEXT NOT NULL,
                reportTitle TEXT NOT NULL,
                htmlContent TEXT NOT NULL,
                generatedDate TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            `CREATE TABLE IF NOT EXISTS equipment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                cost REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'Working',
                purchaseDate TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            `CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                memberId TEXT NOT NULL,
                memberName TEXT NOT NULL,
                shift TEXT NOT NULL,
                time TEXT NOT NULL,
                date TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            `CREATE TABLE IF NOT EXISTS trainerAttendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trainerId TEXT NOT NULL,
                trainerName TEXT NOT NULL,
                shift TEXT NOT NULL,
                time TEXT NOT NULL,
                date TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                darkMode INTEGER DEFAULT 0,
                autoBackup INTEGER DEFAULT 1,
                backupFrequency TEXT DEFAULT 'daily',
                lastBackup TEXT,
                backupLocation TEXT,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )`,
        ];

        

        this.db.serialize(() => {
            tables.forEach(sql => {
                this.db.run(sql, (err) => {
                    if (err) {
                        console.error('Error creating table:', err.message);
                    }
                });
            });

            this.db.run(`INSERT OR IGNORE INTO settings (id, darkMode, autoBackup, backupFrequency, backupLocation)
                VALUES (1, 0, 1, 'daily', ?)`, [this.dbPath], (err) => {
                if (err) {
                    console.error('Error inserting default settings:', err.message);
                }
            });
        });

        console.log('All database tables created');
    }

    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    getRow(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getAllRows(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async readData() {
        try {
            const [members, trainers, payments, trainerSalaries, receipts, reports, equipment, attendance, trainerAttendance, settings] = await Promise.all([
                this.getAllRows('SELECT * FROM members'),
                this.getAllRows('SELECT * FROM trainers'),
                this.getAllRows('SELECT * FROM payments'),
                this.getAllRows('SELECT * FROM trainerSalaries'),
                this.getAllRows('SELECT * FROM receipts'),
                this.getAllRows('SELECT * FROM reports'),
                this.getAllRows('SELECT * FROM equipment'),
                this.getAllRows('SELECT * FROM attendance'),
                this.getAllRows('SELECT * FROM trainerAttendance'),
                this.getRow('SELECT * FROM settings WHERE id = 1')
            ]);

            return {
                members: members || [],
                trainers: trainers || [],
                payments: payments || [],
                trainerSalaries: trainerSalaries || [],
                receipts: receipts || [],
                reports: reports || [],
                equipment: equipment || [],
                attendance: attendance || [],
                trainerAttendance: trainerAttendance || [],
                settings: settings ? {
                    darkMode: settings.darkMode === 1,
                    autoBackup: settings.autoBackup === 1,
                    backupFrequency: settings.backupFrequency,
                    lastBackup: settings.lastBackup,
                    backupLocation: settings.backupLocation || this.dbPath
                } : {
                    darkMode: false,
                    autoBackup: true,
                    backupFrequency: 'daily',
                    backupLocation: this.dbPath
                },
                metadata: {
                    version: '2.0.0',
                    database: 'SQLite',
                    lastModified: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error reading data:', error);
            return null;
        }
    }

    async saveData(data) {
    try {
        await this.runQuery('BEGIN TRANSACTION');

        try {
            // ✅ ADD THESE TWO LINES - Clear members and trainers tables
            await this.runQuery('DELETE FROM members');
            await this.runQuery('DELETE FROM trainers');
            
            // Clear all other tables (existing code)
            await this.runQuery('DELETE FROM payments');
            await this.runQuery("DELETE FROM sqlite_sequence WHERE name='payments'");

            await this.runQuery('DELETE FROM trainerSalaries');
            await this.runQuery("DELETE FROM sqlite_sequence WHERE name='trainerSalaries'");

            await this.runQuery('DELETE FROM receipts');
            await this.runQuery("DELETE FROM sqlite_sequence WHERE name='receipts'");

            await this.runQuery('DELETE FROM reports');
            await this.runQuery("DELETE FROM sqlite_sequence WHERE name='reports'");

            await this.runQuery('DELETE FROM equipment');
            await this.runQuery("DELETE FROM sqlite_sequence WHERE name='equipment'");

            await this.runQuery('DELETE FROM attendance');
            await this.runQuery("DELETE FROM sqlite_sequence WHERE name='attendance'");

            await this.runQuery('DELETE FROM trainerAttendance');
            await this.runQuery("DELETE FROM sqlite_sequence WHERE name='trainerAttendance'");

            // Rest of the function remains the same...
            for (const member of data.members || []) {
                await this.runQuery(`
                    INSERT INTO members (id, name, type, phone, email, address, status, joinDate, amount, payment, plan, trainerId, trainerName)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [member.id, member.name, member.type, member.phone, member.email, member.address, 
                    member.status, member.joinDate, member.amount, member.payment, member.plan, 
                    member.trainerId, member.trainerName]);
            }

            for (const trainer of data.trainers || []) {
                await this.runQuery(`
                    INSERT INTO trainers (id, name, specialty, phone, salary, status, joinDate)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [trainer.id, trainer.name, trainer.specialty, trainer.phone, 
                    trainer.salary, trainer.status, trainer.joinDate]);
            }

                for (const payment of data.payments || []) {
    await this.runQuery(`
        INSERT INTO payments (id, memberId, memberName, amount, status, date, time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [payment.id, payment.memberId, payment.memberName, 
        payment.amount, payment.status, payment.date, payment.time]);
}

                for (const salary of data.trainerSalaries || []) {
                    await this.runQuery(`
                        INSERT INTO trainerSalaries (id, trainerId, trainerName, amount, status, paymentDate)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [salary.id, salary.trainerId, salary.trainerName, 
                        salary.amount, salary.status, salary.paymentDate]);
                }

                for (const receipt of data.receipts || []) {
                    await this.runQuery(`
                        INSERT INTO receipts (id, receiptNumber, memberId, memberName, memberType, amount, paymentMethod, description, date, time, htmlContent)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [receipt.id, receipt.receiptNumber, receipt.memberId, receipt.memberName, 
                        receipt.memberType, receipt.amount, receipt.paymentMethod, receipt.description,
                        receipt.date, receipt.time, receipt.htmlContent]);
                }

                for (const report of data.reports || []) {
                    await this.runQuery(`
                        INSERT INTO reports (id, reportType, reportTitle, htmlContent, generatedDate)
                        VALUES (?, ?, ?, ?, ?)
                    `, [report.id, report.reportType, report.reportTitle, 
                        report.htmlContent, report.generatedDate]);
                }

                for (const item of data.equipment || []) {
                    await this.runQuery(`
                        INSERT INTO equipment (id, name, category, quantity, cost, status, purchaseDate)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [item.id, item.name, item.category, item.quantity, 
                        item.cost, item.status, item.purchaseDate]);
                }

                for (const record of data.attendance || []) {
                    await this.runQuery(`
                        INSERT INTO attendance (id, memberId, memberName, shift, time, date)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [record.id, record.memberId, record.memberName, 
                        record.shift, record.time, record.date]);
                }

                for (const record of data.trainerAttendance || []) {
                    await this.runQuery(`
                        INSERT INTO trainerAttendance (id, trainerId, trainerName, shift, time, date)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [record.id, record.trainerId, record.trainerName, 
                        record.shift, record.time, record.date]);
                }

                if (data.settings) {
                    await this.runQuery(`
                        UPDATE settings 
                        SET darkMode = ?, autoBackup = ?, backupFrequency = ?, lastBackup = ?, backupLocation = ?
                        WHERE id = 1
                    `, [data.settings.darkMode ? 1 : 0, data.settings.autoBackup ? 1 : 0,
                        data.settings.backupFrequency, data.settings.lastBackup, data.settings.backupLocation]);
                }

                await this.runQuery('COMMIT');
                return true;
            } catch (error) {
                await this.runQuery('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    readBackupFile() {
        try {
            if (!fs.existsSync(this.backupFilePath)) {
                return { backups: [], metadata: {} };
            }
            const data = fs.readFileSync(this.backupFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading backup file:', error);
            return { backups: [], metadata: {} };
        }
    }

    saveBackupFile(backupData) {
        try {
            backupData.metadata = backupData.metadata || {};
            backupData.metadata.lastModified = new Date().toISOString();
            fs.writeFileSync(this.backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Error saving backup file:', error);
            return false;
        }
    }

    async createBackup(customPath = null) {
        try {
            const currentData = await this.readData();
            if (!currentData) {
                throw new Error('Failed to read database');
            }

            const timestamp = new Date().toISOString();
            const backupId = 'accumulated-backup';
            
            console.log('\n=== CREATING BACKUP ===');
            
            const backupFileData = this.readBackupFile();
            let existingBackup = backupFileData.backups.find(b => b.id === backupId);
            
            const membersMap = new Map();
            const trainersMap = new Map();
            const paymentsMap = new Map();
            const trainerSalariesMap = new Map();
            const receiptsMap = new Map();
            const reportsMap = new Map();
            const equipmentMap = new Map();
            const attendanceMap = new Map();
            const trainerAttendanceMap = new Map();
            
            if (existingBackup && existingBackup.data) {
                (existingBackup.data.members || []).forEach(m => membersMap.set(m.id, m));
                (existingBackup.data.trainers || []).forEach(t => trainersMap.set(t.id, t));
                (existingBackup.data.payments || []).forEach(p => paymentsMap.set(p.id, p));
                (existingBackup.data.trainerSalaries || []).forEach(s => trainerSalariesMap.set(s.id, s));
                (existingBackup.data.receipts || []).forEach(r => receiptsMap.set(r.id, r));
                (existingBackup.data.reports || []).forEach(r => reportsMap.set(r.id, r));
                (existingBackup.data.equipment || []).forEach(e => equipmentMap.set(e.id, e));
                (existingBackup.data.attendance || []).forEach(a => attendanceMap.set(a.id, a));
                (existingBackup.data.trainerAttendance || []).forEach(ta => trainerAttendanceMap.set(ta.id, ta));
            }
            
            (currentData.members || []).forEach(m => membersMap.set(m.id, m));
            (currentData.trainers || []).forEach(t => trainersMap.set(t.id, t));
            (currentData.payments || []).forEach(p => paymentsMap.set(p.id, p));
            (currentData.trainerSalaries || []).forEach(s => trainerSalariesMap.set(s.id, s));
            (currentData.receipts || []).forEach(r => receiptsMap.set(r.id, r));
            (currentData.reports || []).forEach(r => reportsMap.set(r.id, r));
            (currentData.equipment || []).forEach(e => equipmentMap.set(e.id, e));
            (currentData.attendance || []).forEach(a => attendanceMap.set(a.id, a));
            (currentData.trainerAttendance || []).forEach(ta => trainerAttendanceMap.set(ta.id, ta));
            
            const accumulatedBackup = {
                id: backupId,
                timestamp: timestamp,
                data: {
                    members: Array.from(membersMap.values()),
                    trainers: Array.from(trainersMap.values()),
                    payments: Array.from(paymentsMap.values()),
                    trainerSalaries: Array.from(trainerSalariesMap.values()),
                    receipts: Array.from(receiptsMap.values()),
                    reports: Array.from(reportsMap.values()),
                    equipment: Array.from(equipmentMap.values()),
                    attendance: Array.from(attendanceMap.values()),
                    trainerAttendance: Array.from(trainerAttendanceMap.values()),
                    settings: currentData.settings || {},
                    metadata: currentData.metadata || {}
                },
                size: JSON.stringify(currentData).length,
                location: customPath || this.backupPath,
                recordCount: {
                    members: membersMap.size,
                    trainers: trainersMap.size,
                    payments: paymentsMap.size,
                    trainerSalaries: trainerSalariesMap.size,
                    receipts: receiptsMap.size,
                    reports: reportsMap.size,
                    equipment: equipmentMap.size,
                    attendance: attendanceMap.size,
                    trainerAttendance: trainerAttendanceMap.size
                }
            };
            
            backupFileData.backups = [accumulatedBackup];
            const success = this.saveBackupFile(backupFileData);
            
            if (!success) {
                throw new Error('Failed to save backup');
            }

            await this.runQuery('UPDATE settings SET lastBackup = ? WHERE id = 1', [timestamp]);

            console.log('=== BACKUP COMPLETE ===\n');

            return {
                success: true,
                backupPath: this.backupFilePath,
                backupId: backupId,
                timestamp: timestamp,
                size: accumulatedBackup.size,
                recordCount: accumulatedBackup.recordCount
            };
        } catch (error) {
            console.error('Backup creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async restoreBackup(backupId) {
        try {
            console.log('\n=== RESTORING BACKUP ===');
            
            const backupFileData = this.readBackupFile();
            const backup = backupFileData.backups.find(b => b.id === backupId);
            
            if (!backup) {
                throw new Error('Backup not found');
            }

            const success = await this.saveData(backup.data);
            
            console.log('=== RESTORE COMPLETE ===\n');

            return {
                success: success,
                message: success ? 'Database restored successfully' : 'Failed to restore database',
                recordCount: backup.recordCount
            };
        } catch (error) {
            console.error('Restore failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    listBackups() {
        try {
            const backupFileData = this.readBackupFile();
            
            const backups = backupFileData.backups.map(backup => {
                const sizeKB = (backup.size / 1024).toFixed(2);
                const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);
                
                return {
                    id: backup.id,
                    name: `Backup ${new Date(backup.timestamp).toLocaleString()}`,
                    path: backup.id,
                    location: backup.location,
                    size: backup.size,
                    sizeKB: sizeKB,
                    sizeMB: sizeMB,
                    created: new Date(backup.timestamp),
                    modified: new Date(backup.timestamp),
                    timestamp: backup.timestamp
                };
            });
            
            backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return backups;
        } catch (error) {
            console.error('Error listing backups:', error);
            return [];
        }
    }

    deleteBackup(backupId) {
        try {
            const backupFileData = this.readBackupFile();
            const index = backupFileData.backups.findIndex(b => b.id === backupId);
            
            if (index === -1) {
                return { success: false, error: 'Backup not found' };
            }
            
            backupFileData.backups.splice(index, 1);
            this.saveBackupFile(backupFileData);
            
            return { success: true, message: 'Backup deleted successfully' };
        } catch (error) {
            console.error('Error deleting backup:', error);
            return { success: false, error: error.message };
        }
    }

    async detectDrives() {
        const drives = [];
        
        try {
            if (process.platform === 'win32') {
                const driveLetters = 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                
                for (const letter of driveLetters) {
                    const drivePath = `${letter}:\\`;
                    try {
                        if (fs.existsSync(drivePath)) {
                            const stats = await this.getDriveInfo(drivePath);
                            drives.push({ 
                                letter: letter, 
                                path: drivePath, 
                                ...stats 
                            });
                        }
                    } catch (error) {
                        // Skip inaccessible drives
                    }
                }
            } else {
                drives.push({
                    name: 'Home',
                    path: os.homedir(),
                    type: 'local',
                    recommended: true
                });
            }
            
            return drives;
        } catch (error) {
            console.error('Drive detection error:', error);
            return [{
                name: 'Home Directory',
                path: os.homedir(),
                type: 'local',
                recommended: true
            }];
        }
    }

    async getDriveInfo(drivePath) {
        try {
            const execPromise = promisify(exec);
            
            const driveLetter = drivePath.charAt(0);
            const command = `powershell "Get-PSDrive -Name ${driveLetter} | Select-Object Used,Free | ConvertTo-Json"`;
            
            try {
                const { stdout } = await execPromise(command);
                
                const driveInfo = JSON.parse(stdout.trim());
                
                const usedSpace = driveInfo.Used || 0;
                const freeSpace = driveInfo.Free || 0;
                const totalSpace = usedSpace + freeSpace;
                
                const freeSpaceGB = (freeSpace / (1024 * 1024 * 1024)).toFixed(2);
                const totalSpaceGB = (totalSpace / (1024 * 1024 * 1024)).toFixed(2);
                const usedSpaceGB = (usedSpace / (1024 * 1024 * 1024)).toFixed(2);
                
                return {
                    name: drivePath,
                    type: this.getDriveType(drivePath),
                    totalSpaceGB: totalSpaceGB,
                    freeSpaceGB: freeSpaceGB,
                    usedSpaceGB: usedSpaceGB,
                    recommended: drivePath.startsWith('D')
                };
            } catch (cmdError) {
                return {
                    name: drivePath,
                    type: this.getDriveType(drivePath),
                    totalSpaceGB: 'Available',
                    freeSpaceGB: 'Available',
                    usedSpaceGB: 'Unknown',
                    recommended: drivePath.startsWith('D')
                };
            }
        } catch (error) {
            return {
                name: drivePath,
                type: 'unknown',
                totalSpaceGB: '0',
                freeSpaceGB: '0',
                usedSpaceGB: '0',
                recommended: false
            };
        }
    }

    getDriveType(drivePath) {
        const letter = drivePath.charAt(0).toUpperCase();
        if (letter === 'C') return 'System Drive (C:)';
        if (letter === 'D') return 'Local Disk (D:)';
        return `Local Disk (${letter}:)`;
    }

    getBackupLocations() {
        return [{
            name: 'Single Backup File',
            path: this.backupFilePath,
            isDefault: true,
            exists: fs.existsSync(this.backupFilePath)
        }];
    }

    setBackupLocation(drivePath) {
        try {
            const backupDir = path.join(drivePath, 'DenimGym', 'backups');
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const newBackupFilePath = path.join(backupDir, 'denimgym_backups.json');
            
            if (fs.existsSync(this.backupFilePath)) {
                fs.copyFileSync(this.backupFilePath, newBackupFilePath);
            }
            
            this.backupPath = backupDir;
            this.backupFilePath = newBackupFilePath;

            return { success: true, path: backupDir };
        } catch (error) {
            console.error('Error setting backup location:', error);
            return { success: false, error: error.message };
        }
    }

    setDatabaseLocation(drivePath) {
        try {
            const newDbDir = path.join(drivePath, 'DenimGym', 'database');
            const newDbPath = path.join(newDbDir, 'denimgym.db');
            
            if (!fs.existsSync(newDbDir)) {
                fs.mkdirSync(newDbDir, { recursive: true });
            }

            if (fs.existsSync(this.dbPath) && this.dbPath !== newDbPath) {
                fs.copyFileSync(this.dbPath, newDbPath);
            }

            this.close().then(() => {
                this.dbPath = newDbPath;
                this.initializeDatabaseSync();
            });

            return { success: true, path: newDbPath };
        } catch (error) {
            console.error('Error setting database location:', error);
            return { success: false, error: error.message };
        }
    }

    async getDatabaseInfo() {
        try {
            const dbStats = fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath) : null;
            const databaseSize = dbStats ? dbStats.size : 0;
            
            const backupStats = fs.existsSync(this.backupFilePath) ? fs.statSync(this.backupFilePath) : null;
            const backupSize = backupStats ? backupStats.size : 0;
            
            return {
                databasePath: this.dbPath,
                databaseSize: databaseSize,
                backupFilePath: this.backupFilePath,
                backupFileSize: backupSize,
                driveInfo: {
                    path: this.dbPath.substring(0, 3),
                    name: 'Database Drive'
                }
            };
        } catch (error) {
            console.error('Error getting database info:', error);
            return {
                databasePath: this.dbPath,
                databaseSize: 0,
                backupFilePath: this.backupFilePath,
                backupFileSize: 0,
                driveInfo: null
            };
        }
    }

    enableAutoBackup(frequency = 'daily') {
        const intervals = {
            hourly: 60 * 60 * 1000,
            daily: 24 * 60 * 60 * 1000,
            weekly: 7 * 24 * 60 * 60 * 1000
        };

        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
        }

        this.autoBackupInterval = setInterval(() => {
            this.createBackup();
            console.log('Auto backup completed at', new Date().toISOString());
        }, intervals[frequency] || intervals.daily);
    }

    disableAutoBackup() {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
            this.autoBackupInterval = null;
        }
    }

    async exportDatabase(exportPath) {
        try {
            const data = await this.readData();
            if (!data) {
                throw new Error('Failed to read database');
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const exportFileName = `denimgym_export_${timestamp}.json`;
            const exportFilePath = path.join(exportPath, exportFileName);

            fs.writeFileSync(exportFilePath, JSON.stringify(data, null, 2), 'utf8');

            return {
                success: true,
                path: exportFilePath,
                size: fs.statSync(exportFilePath).size
            };
        } catch (error) {
            console.error('Export failed:', error);
            return { success: false, error: error.message };
        }
    }

    async importDatabase(importPath) {
        try {
            if (!fs.existsSync(importPath)) {
                throw new Error('Import file not found');
            }

            const importData = JSON.parse(fs.readFileSync(importPath, 'utf8'));
            
            if (!importData.members || !importData.trainers) {
                throw new Error('Invalid database file');
            }

            await this.createBackup();
            const success = await this.saveData(importData);

            return {
                success: success,
                message: success ? 'Database imported successfully' : 'Failed to import database'
            };
        } catch (error) {
            console.error('Import failed:', error);
            return { success: false, error: error.message };
        }
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = DatabaseManager;