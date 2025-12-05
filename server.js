// server.js - FULLY FIXED VERSION
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const DatabaseManager = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database Manager
const dbManager = new DatabaseManager();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============= AUTHENTICATION API =============

// Simple session storage (in production, use proper session management)
const sessions = new Map();

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check admin credentials (hardcoded for now)
        if (email === 'admin@denimgym.com' && password === 'admin123') {
            // Create session
            const sessionId = Date.now().toString();
            sessions.set(sessionId, { email, role: 'admin' });
            
            res.json({ 
                success: true, 
                sessionId,
                message: 'Login successful' 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    const { sessionId } = req.body;
    if (sessionId) {
        sessions.delete(sessionId);
    }
    res.json({ success: true });
});

// Middleware to check authentication
function requireAuth(req, res, next) {
    const sessionId = req.headers['x-session-id'];
    
    if (sessionId && sessions.has(sessionId)) {
        req.user = sessions.get(sessionId);
        next();
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Unauthorized' 
        });
    }
}

// Protect dashboard route
app.get('/dashboard.html', (req, res) => {
    const sessionId = req.query.session || req.headers['x-session-id'];
    
    if (sessionId && sessions.has(sessionId)) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/');
    }
});

// Generate next member ID (M01, M02, etc.)
async function generateNextMemberId() {
    try {
        // Get all members and find the highest number
        const allMembers = await dbManager.getAllRows('SELECT id FROM members');
        
        if (!allMembers || allMembers.length === 0) {
            return 'M01';
        }
        
        // Extract all numbers from existing IDs
        const numbers = allMembers
            .map(m => {
                const idStr = String(m.id);
                // Extract number part (handles M01, M1, 1, etc.)
                const match = idStr.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            })
            .filter(n => !isNaN(n) && n > 0);
        
        // Get the highest number
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        const nextNumber = maxNumber + 1;
        
        // Return formatted ID
        return 'M' + String(nextNumber).padStart(2, '0');
    } catch (error) {
        console.error('Error generating member ID:', error);
        return 'M01';
    }
}

// Generate next trainer ID (T01, T02, etc.)
async function generateNextTrainerId() {
    try {
        // Get all trainers and find the highest number
        const allTrainers = await dbManager.getAllRows('SELECT id FROM trainers');
        
        if (!allTrainers || allTrainers.length === 0) {
            return 'T01';
        }
        
        // Extract all numbers from existing IDs
        const numbers = allTrainers
            .map(t => {
                const idStr = String(t.id);
                // Extract number part (handles T01, T1, 1, etc.)
                const match = idStr.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            })
            .filter(n => !isNaN(n) && n > 0);
        
        // Get the highest number
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        const nextNumber = maxNumber + 1;
        
        // Return formatted ID
        return 'T' + String(nextNumber).padStart(2, '0');
    } catch (error) {
        console.error('Error generating trainer ID:', error);
        return 'T01';
    }
}

// ============= MEMBERS API =============

app.get('/api/members', async (req, res) => {
    try {
        const members = await dbManager.getAllRows('SELECT * FROM members');
        res.json({ success: true, data: members || [] });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/members/:id', async (req, res) => {
    try {
        const member = await dbManager.getRow('SELECT * FROM members WHERE id = ?', [req.params.id]);
        if (member) {
            res.json({ success: true, data: member });
        } else {
            res.status(404).json({ success: false, message: 'Member not found' });
        }
    } catch (error) {
        console.error('Error fetching member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/members', async (req, res) => {
    try {
        const memberData = req.body;
        
        console.log('Received member data:', memberData);
        
        // Validate required fields
        if (!memberData.name || !memberData.phone) {
            return res.status(400).json({ 
                success: false, 
                error: 'Name and phone are required' 
            });
        }
        
        // Generate new member ID
        const newId = await generateNextMemberId();
        console.log('Generated new member ID:', newId);
        
        // Get current date
        const currentDate = new Date().toISOString().split('T')[0];
        
        // ===== ADD THIS DEBUG CODE =====
        // Check what type the database expects
        const tableInfo = await dbManager.getAllRows('PRAGMA table_info(members)');
        console.log('Members table schema:', JSON.stringify(tableInfo, null, 2));
        
        // Check existing IDs
        const existingMembers = await dbManager.getAllRows('SELECT id, typeof(id) as id_type FROM members LIMIT 5');
        console.log('Existing member IDs and types:', JSON.stringify(existingMembers, null, 2));
        // ===== END DEBUG CODE =====
        
        const result = await dbManager.runQuery(`
            INSERT INTO members (
                id, name, type, phone, email, address, status, 
                joinDate, amount, payment, plan, trainerId, trainerName
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            String(newId),                                 // MUST be string
            String(memberData.name || ''),                 // TEXT
            String(memberData.type || 'Regular'),          // TEXT
            String(memberData.phone || ''),                // TEXT
            memberData.email ? String(memberData.email) : null,  // TEXT or NULL
            memberData.address ? String(memberData.address) : null, // TEXT or NULL
            String(memberData.status || 'Active'),         // TEXT
            String(memberData.joinDate || currentDate),    // TEXT
            memberData.amount ? Number(memberData.amount) : null,  // REAL or NULL
            memberData.payment ? String(memberData.payment) : null, // TEXT or NULL
            memberData.plan ? String(memberData.plan) : null,       // TEXT or NULL
            memberData.trainerId ? String(memberData.trainerId) : null, // TEXT or NULL
            memberData.trainerName ? String(memberData.trainerName) : null // TEXT or NULL
        ]);
        
        console.log('Insert result:', result);
        
        // Fetch the newly created member
        const newMember = await dbManager.getRow('SELECT * FROM members WHERE id = ?', [newId]);
        
        if (!newMember) {
            throw new Error('Member created but could not be retrieved');
        }
        
        console.log('Member created successfully:', newMember);
        res.status(201).json({ success: true, data: newMember });
        
    } catch (error) {
        console.error('Error creating member:', error);
        console.error('Error details:', {
            message: error.message,
            errno: error.errno,
            code: error.code
        });
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.put('/api/members/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const memberData = req.body;
        
        await dbManager.runQuery(`
            UPDATE members 
            SET name = ?, type = ?, phone = ?, email = ?, address = ?, 
                status = ?, amount = ?, payment = ?, plan = ?, 
                trainerId = ?, trainerName = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            String(memberData.name),
            String(memberData.type),
            String(memberData.phone),
            memberData.email ? String(memberData.email) : null,
            memberData.address ? String(memberData.address) : null,
            String(memberData.status),
            Number(memberData.amount),
            String(memberData.payment),
            String(memberData.plan),
            memberData.trainerId ? String(memberData.trainerId) : null,
            memberData.trainerName ? String(memberData.trainerName) : null,
            id
        ]);
        
        const updatedMember = await dbManager.getRow('SELECT * FROM members WHERE id = ?', [id]);
        res.json({ success: true, data: updatedMember });
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/members/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await dbManager.runQuery('DELETE FROM members WHERE id = ?', [id]);
        res.json({ success: true, message: 'Member deleted successfully' });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= TRAINERS API =============

app.get('/api/trainers', async (req, res) => {
    try {
        const trainers = await dbManager.getAllRows('SELECT * FROM trainers');
        res.json({ success: true, data: trainers || [] });
    } catch (error) {
        console.error('Error fetching trainers:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/trainers', async (req, res) => {
    try {
        const trainerData = req.body;
        
        // Generate new trainer ID
        const newId = await generateNextTrainerId();
        
        const result = await dbManager.runQuery(`
            INSERT INTO trainers (id, name, specialty, phone, salary, status, joinDate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            newId,
            String(trainerData.name),
            String(trainerData.specialty || ''),
            String(trainerData.phone),
            Number(trainerData.salary || 0),
            String(trainerData.status || 'Active'),
            String(trainerData.joinDate || new Date().toISOString().split('T')[0])
        ]);
        
        const newTrainer = await dbManager.getRow('SELECT * FROM trainers WHERE id = ?', [newId]);
        res.status(201).json({ success: true, data: newTrainer });
    } catch (error) {
        console.error('Error creating trainer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/trainers/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const trainerData = req.body;
        
        await dbManager.runQuery(`
            UPDATE trainers 
            SET name = ?, specialty = ?, phone = ?, salary = ?, 
                status = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            String(trainerData.name),
            String(trainerData.specialty),
            String(trainerData.phone),
            Number(trainerData.salary),
            String(trainerData.status),
            id
        ]);
        
        const updatedTrainer = await dbManager.getRow('SELECT * FROM trainers WHERE id = ?', [id]);
        res.json({ success: true, data: updatedTrainer });
    } catch (error) {
        console.error('Error updating trainer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/trainers/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await dbManager.runQuery('DELETE FROM trainers WHERE id = ?', [id]);
        res.json({ success: true, message: 'Trainer deleted successfully' });
    } catch (error) {
        console.error('Error deleting trainer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= PAYMENTS API =============

app.get('/api/payments', async (req, res) => {
    try {
        const payments = await dbManager.getAllRows('SELECT * FROM payments');
        res.json({ success: true, data: payments || [] });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/payments', async (req, res) => {
    try {
        const paymentData = req.body;
        
        // Validate required fields
        if (!paymentData.memberId || !paymentData.memberName || !paymentData.amount || !paymentData.status) {
            return res.status(400).json({ 
                success: false, 
                error: 'Required fields missing' 
            });
        }
        
        await dbManager.runQuery('BEGIN TRANSACTION');
        
        try {
            const result = await dbManager.runQuery(`
                INSERT INTO payments (memberId, memberName, amount, status, date, time)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                String(paymentData.memberId),
                String(paymentData.memberName),
                Number(paymentData.amount),
                String(paymentData.status),
                String(paymentData.date || new Date().toISOString().split('T')[0]),
                String(paymentData.time || new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true
                }))
            ]);
            
            if (paymentData.status === 'Paid') {
                await dbManager.runQuery(`
                    UPDATE members 
                    SET payment = 'Paid', updatedAt = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [paymentData.memberId]);
            }
            
            await dbManager.runQuery('COMMIT');
            
            const newPayment = await dbManager.getRow('SELECT * FROM payments WHERE id = ?', [result.lastID]);
            res.status(201).json({ success: true, data: newPayment });
            
        } catch (innerError) {
            await dbManager.runQuery('ROLLBACK');
            throw innerError;
        }
        
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/payments/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const paymentData = req.body;
        
        await dbManager.runQuery(`
            UPDATE payments 
            SET memberId = ?, memberName = ?, amount = ?, status = ?, date = ?
            WHERE id = ?
        `, [
            String(paymentData.memberId),
            String(paymentData.memberName),
            Number(paymentData.amount),
            String(paymentData.status),
            String(paymentData.date),
            id
        ]);
        
        const updatedPayment = await dbManager.getRow('SELECT * FROM payments WHERE id = ?', [id]);
        res.json({ success: true, data: updatedPayment });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/payments/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await dbManager.runQuery('DELETE FROM payments WHERE id = ?', [id]);
        res.json({ success: true, message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= TRAINER SALARIES API =============

app.get('/api/trainer-salaries', async (req, res) => {
    try {
        const salaries = await dbManager.getAllRows('SELECT * FROM trainerSalaries');
        res.json({ success: true, data: salaries || [] });
    } catch (error) {
        console.error('Error fetching trainer salaries:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/trainer-salaries', async (req, res) => {
    try {
        const salaryData = req.body;
        
        const result = await dbManager.runQuery(`
            INSERT INTO trainerSalaries (trainerId, trainerName, amount, status, paymentDate, time)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            String(salaryData.trainerId),
            String(salaryData.trainerName),
            Number(salaryData.amount),
            String(salaryData.status),
            String(salaryData.paymentDate || new Date().toISOString().split('T')[0]),
            salaryData.time ? String(salaryData.time) : null
        ]);
        
        const newSalary = await dbManager.getRow('SELECT * FROM trainerSalaries WHERE id = ?', [result.lastID]);
        res.status(201).json({ success: true, data: newSalary });
    } catch (error) {
        console.error('Error creating trainer salary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/trainer-salaries/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const salaryData = req.body;
        
        await dbManager.runQuery(`
            UPDATE trainerSalaries 
            SET trainerId = ?, trainerName = ?, amount = ?, status = ?, paymentDate = ?
            WHERE id = ?
        `, [
            String(salaryData.trainerId),
            String(salaryData.trainerName),
            Number(salaryData.amount),
            String(salaryData.status),
            String(salaryData.paymentDate),
            id
        ]);
        
        const updatedSalary = await dbManager.getRow('SELECT * FROM trainerSalaries WHERE id = ?', [id]);
        res.json({ success: true, data: updatedSalary });
    } catch (error) {
        console.error('Error updating trainer salary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/trainer-salaries/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await dbManager.runQuery('DELETE FROM trainerSalaries WHERE id = ?', [id]);
        res.json({ success: true, message: 'Salary payment deleted successfully' });
    } catch (error) {
        console.error('Error deleting trainer salary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= EQUIPMENT API =============

app.get('/api/equipment', async (req, res) => {
    try {
        const equipment = await dbManager.getAllRows('SELECT * FROM equipment');
        res.json({ success: true, data: equipment || [] });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/equipment', async (req, res) => {
    try {
        const equipmentData = req.body;
        
        const result = await dbManager.runQuery(`
            INSERT INTO equipment (name, category, quantity, cost, status, purchaseDate)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            String(equipmentData.name),
            String(equipmentData.category),
            Number(equipmentData.quantity),
            Number(equipmentData.cost),
            String(equipmentData.status),
            String(equipmentData.purchaseDate)
        ]);
        
        const newEquipment = await dbManager.getRow('SELECT * FROM equipment WHERE id = ?', [result.lastID]);
        res.status(201).json({ success: true, data: newEquipment });
    } catch (error) {
        console.error('Error creating equipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/equipment/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const equipmentData = req.body;
        
        await dbManager.runQuery(`
            UPDATE equipment 
            SET name = ?, category = ?, quantity = ?, cost = ?, status = ?, purchaseDate = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            String(equipmentData.name),
            String(equipmentData.category),
            Number(equipmentData.quantity),
            Number(equipmentData.cost),
            String(equipmentData.status),
            String(equipmentData.purchaseDate),
            id
        ]);
        
        const updatedEquipment = await dbManager.getRow('SELECT * FROM equipment WHERE id = ?', [id]);
        res.json({ success: true, data: updatedEquipment });
    } catch (error) {
        console.error('Error updating equipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/equipment/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await dbManager.runQuery('DELETE FROM equipment WHERE id = ?', [id]);
        res.json({ success: true, message: 'Equipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= RECEIPTS API =============

app.get('/api/receipts', async (req, res) => {
    try {
        const receipts = await dbManager.getAllRows('SELECT * FROM receipts');
        res.json({ success: true, data: receipts || [] });
    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/receipts', async (req, res) => {
    try {
        const receiptData = req.body;
        
        const result = await dbManager.runQuery(`
            INSERT INTO receipts (receiptNumber, memberId, memberName, memberType, amount, paymentMethod, description, date, time, htmlContent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            String(receiptData.receiptNumber),
            String(receiptData.memberId),
            String(receiptData.memberName),
            String(receiptData.memberType),
            Number(receiptData.amount),
            String(receiptData.paymentMethod),
            receiptData.description ? String(receiptData.description) : null,
            String(receiptData.date),
            String(receiptData.time),
            String(receiptData.htmlContent)
        ]);
        
        const newReceipt = await dbManager.getRow('SELECT * FROM receipts WHERE id = ?', [result.lastID]);
        res.status(201).json({ success: true, data: newReceipt });
    } catch (error) {
        console.error('Error creating receipt:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/receipts/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await dbManager.runQuery('DELETE FROM receipts WHERE id = ?', [id]);
        res.json({ success: true, message: 'Receipt deleted successfully' });
    } catch (error) {
        console.error('Error deleting receipt:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= REPORTS API =============

app.get('/api/reports', async (req, res) => {
    try {
        const reports = await dbManager.getAllRows('SELECT * FROM reports');
        res.json({ success: true, data: reports || [] });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/reports', async (req, res) => {
    try {
        const reportData = req.body;
        
        const result = await dbManager.runQuery(`
            INSERT INTO reports (reportType, reportTitle, htmlContent, generatedDate)
            VALUES (?, ?, ?, ?)
        `, [
            String(reportData.reportType),
            String(reportData.reportTitle),
            String(reportData.htmlContent),
            String(reportData.generatedDate || new Date().toISOString().split('T')[0])
        ]);
        
        const newReport = await dbManager.getRow('SELECT * FROM reports WHERE id = ?', [result.lastID]);
        res.status(201).json({ success: true, data: newReport });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/reports/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await dbManager.runQuery('DELETE FROM reports WHERE id = ?', [id]);
        res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= ATTENDANCE API =============

app.get('/api/attendance', async (req, res) => {
    try {
        const attendanceRecords = await dbManager.getAllRows('SELECT * FROM attendance ORDER BY date DESC, time DESC');
        res.json({ success: true, data: attendanceRecords || [] });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/attendance', async (req, res) => {
    try {
        const attendanceData = req.body;
        
        const result = await dbManager.runQuery(`
            INSERT INTO attendance (memberId, memberName, shift, time, date)
            VALUES (?, ?, ?, ?, ?)
        `, [
            String(attendanceData.memberId),
            String(attendanceData.memberName),
            String(attendanceData.shift),
            String(attendanceData.time),
            String(attendanceData.date)
        ]);
        
        const newAttendance = await dbManager.getRow('SELECT * FROM attendance WHERE id = ?', [result.lastID]);
        res.status(201).json({ success: true, data: newAttendance });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/attendance/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await dbManager.runQuery('DELETE FROM attendance WHERE id = ?', [id]);
        res.json({ success: true, message: 'Attendance record deleted successfully' });
    } catch (error) {
        console.error('Error deleting attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= TRAINER ATTENDANCE API =============

app.get('/api/trainer-attendance', async (req, res) => {
    try {
        const attendanceRecords = await dbManager.getAllRows('SELECT * FROM trainerAttendance ORDER BY date DESC, time DESC');
        res.json({ success: true, data: attendanceRecords || [] });
    } catch (error) {
        console.error('Error fetching trainer attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/trainer-attendance', async (req, res) => {
    try {
        const attendanceData = req.body;
        
        const result = await dbManager.runQuery(`
            INSERT INTO trainerAttendance (trainerId, trainerName, shift, time, date)
            VALUES (?, ?, ?, ?, ?)
        `, [
            String(attendanceData.trainerId),
            String(attendanceData.trainerName),
            String(attendanceData.shift),
            String(attendanceData.time),
            String(attendanceData.date)
        ]);
        
        const newAttendance = await dbManager.getRow('SELECT * FROM trainerAttendance WHERE id = ?', [result.lastID]);
        res.status(201).json({ success: true, data: newAttendance });
    } catch (error) {
        console.error('Error marking trainer attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/trainer-attendance/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await dbManager.runQuery('DELETE FROM trainerAttendance WHERE id = ?', [id]);
        res.json({ success: true, message: 'Trainer attendance record deleted successfully' });
    } catch (error) {
        console.error('Error deleting trainer attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= DASHBOARD STATS API =============

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const members = await dbManager.getAllRows('SELECT * FROM members');
        const payments = await dbManager.getAllRows('SELECT * FROM payments');
        const trainers = await dbManager.getAllRows('SELECT * FROM trainers');
        const attendance = await dbManager.getAllRows('SELECT * FROM attendance');
        
        const stats = {
            totalRevenue: payments
                .filter(p => p.status === 'Paid')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0),
            totalMembers: members.filter(m => m.status === 'Active').length,
            premiumMembers: members.filter(m => m.type === 'Premium' && m.status === 'Active').length,
            duePayments: payments.filter(p => p.status === 'Due').length,
            activeTrainers: trainers.filter(t => t.status === 'Active').length,
            todayAttendance: attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length
        };
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= DATABASE & BACKUP API =============

app.get('/api/database/drives', async (req, res) => {
    try {
        const drives = await dbManager.detectDrives();
        res.json({ success: true, data: drives });
    } catch (error) {
        console.error('Drive detection error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            data: []
        });
    }
});

app.get('/api/database/info', async (req, res) => {
    try {
        const info = await dbManager.getDatabaseInfo();
        res.json({ success: true, data: info });
    } catch (error) {
        console.error('Error getting database info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/database/backup', async (req, res) => {
    try {
        const { customPath } = req.body;
        const result = await dbManager.createBackup(customPath);
        res.json(result);
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/database/backups', (req, res) => {
    try {
        const backups = dbManager.listBackups();
        res.json({ success: true, data: backups });
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/database/backup/delete', (req, res) => {
    try {
        const { backupPath } = req.body;
        
        if (!backupPath) {
            return res.status(400).json({ 
                success: false, 
                error: 'Backup ID is required' 
            });
        }
        
        const result = dbManager.deleteBackup(backupPath);
        res.json(result);
    } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/database/backup-locations', (req, res) => {
    try {
        const locations = dbManager.getBackupLocations();
        res.json({ success: true, data: locations });
    } catch (error) {
        console.error('Error getting backup locations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/database/restore', async (req, res) => {
    try {
        const { backupPath } = req.body;
        
        if (!backupPath) {
            return res.status(400).json({ 
                success: false, 
                error: 'Backup ID is required' 
            });
        }
        
        const result = await dbManager.restoreBackup(backupPath);
        res.json(result);
    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/database/backup-location', (req, res) => {
    try {
        const { drivePath } = req.body;
        
        if (!drivePath) {
            return res.status(400).json({ 
                success: false, 
                error: 'Drive path is required' 
            });
        }
        
        const result = dbManager.setBackupLocation(drivePath);
        
        if (result.success) {
            const dbResult = dbManager.setDatabaseLocation(drivePath);
            
            res.json({ 
                success: true, 
                path: result.path,
                message: 'Database and backup location updated successfully'
            });
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Error setting location:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/database/export', async (req, res) => {
    try {
        const { exportPath } = req.body;
        const result = await dbManager.exportDatabase(exportPath);
        res.json(result);
    } catch (error) {
        console.error('Error exporting database:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/database/import', async (req, res) => {
    try {
        const { importPath } = req.body;
        
        if (!importPath) {
            return res.status(400).json({ 
                success: false, 
                error: 'Import path is required' 
            });
        }
        
        const result = await dbManager.importDatabase(importPath);
        res.json(result);
    } catch (error) {
        console.error('Error importing database:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= SETTINGS API =============

app.get('/api/settings', async (req, res) => {
    try {
        const settings = await dbManager.getRow('SELECT * FROM settings WHERE id = 1');
        const settingsData = settings ? {
            darkMode: settings.darkMode === 1,
            autoBackup: settings.autoBackup === 1,
            backupFrequency: settings.backupFrequency,
            lastBackup: settings.lastBackup,
            backupLocation: settings.backupLocation
        } : {
            darkMode: false,
            autoBackup: true,
            backupFrequency: 'daily',
            backupLocation: 'Default location'
        };
        res.json({ success: true, data: settingsData });
    } catch (error) {
        console.error('Settings error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            data: {
                darkMode: false,
                autoBackup: true,
                backupFrequency: 'daily'
            }
        });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const settingsData = req.body;
        
        await dbManager.runQuery(`
            UPDATE settings 
            SET darkMode = ?, autoBackup = ?, backupFrequency = ?, 
                backupLocation = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = 1
        `, [
            settingsData.darkMode ? 1 : 0,
            settingsData.autoBackup ? 1 : 0,
            settingsData.backupFrequency || 'daily',
            settingsData.backupLocation || dbManager.dbPath
        ]);
        
        if (settingsData.autoBackup !== undefined) {
            if (settingsData.autoBackup) {
                dbManager.enableAutoBackup(settingsData.backupFrequency || 'daily');
            } else {
                dbManager.disableAutoBackup();
            }
        }
        
        const updatedSettings = await dbManager.getRow('SELECT * FROM settings WHERE id = 1');
        
        res.json({ 
            success: true, 
            data: {
                darkMode: updatedSettings.darkMode === 1,
                autoBackup: updatedSettings.autoBackup === 1,
                backupFrequency: updatedSettings.backupFrequency,
                backupLocation: updatedSettings.backupLocation,
                lastBackup: updatedSettings.lastBackup
            }
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= SERVE FRONTEND =============

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint not found',
        endpoint: req.originalUrl
    });
});

// ============= ERROR HANDLING =============

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    if (req.path.startsWith('/api/')) {
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
        });
    } else {
        res.status(500).send('Something went wrong!');
    }
});

// ============= START SERVER =============

app.listen(PORT, async () => {
    console.log(`╔════════════════════════════════════════╗`);
    console.log(`║   Denim Gym Management System          ║`);
    console.log(`╠════════════════════════════════════════╣`);
    console.log(`║   Server running on port ${PORT}        ║`);
    console.log(`║   http://localhost:${PORT}              ║`);
    console.log(`╚════════════════════════════════════════╝`);
    console.log('');
    
    // Enable auto backup if configured
    const settings = await dbManager.getRow('SELECT * FROM settings WHERE id = 1');
    if (settings && settings.autoBackup) {
        dbManager.enableAutoBackup(settings.backupFrequency || 'daily');
        console.log(`✓ Auto-backup enabled (${settings.backupFrequency})`);
    }
    
    console.log('✓ Database initialized');
    console.log('✓ Single backup file system active');
    console.log('✓ API endpoints ready');
    console.log('');
});