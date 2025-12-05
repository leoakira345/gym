// Data Storage - will be loaded from server
let members = [];
let trainers = [];
let payments = [];
let receipts = [];
let reports = [];
let trainerSalaryPayments = [];
let equipment = [];
let attendance = [];
let currentMemberForAttendance = null;
let profitChart;
let revenueChart, memberChart;



async function loadDataFromServer() {
    try {
        console.log('Loading data from server...');
        
        // Don't clear arrays until we confirm we have new data
        let newMembers = [];
        let newTrainers = [];
        let newPayments = [];
        let newReceipts = [];
        let newReports = [];
        let newTrainerSalaryPayments = [];
        let newEquipment = []; 
        let newAttendance = [];
        
        // Load members
        const membersResponse = await fetch('/api/members');
        const membersResult = await membersResponse.json();
        if (membersResult.success) {
            newMembers = membersResult.data || [];
            console.log('Loaded members:', newMembers.length);
        }
        
        // Load trainers
        const trainersResponse = await fetch('/api/trainers');
        const trainersResult = await trainersResponse.json();
        if (trainersResult.success) {
            newTrainers = trainersResult.data || [];
            console.log('Loaded trainers:', newTrainers.length);
        }
        
        // Load payments
        const paymentsResponse = await fetch('/api/payments');
        const paymentsResult = await paymentsResponse.json();
        if (paymentsResult.success) {
            newPayments = paymentsResult.data || [];
            console.log('Loaded payments:', newPayments.length);
        }
        
        // Load receipts
        const receiptsResponse = await fetch('/api/receipts');
        const receiptsResult = await receiptsResponse.json();
        if (receiptsResult.success) {
            newReceipts = receiptsResult.data || [];
            console.log('Loaded receipts:', newReceipts.length);
        }

        // Load trainer salaries
        const salariesResponse = await fetch('/api/trainer-salaries');
        const salariesResult = await salariesResponse.json();
        if (salariesResult.success) {
            newTrainerSalaryPayments = salariesResult.data || [];
            console.log('Loaded trainer salaries:', newTrainerSalaryPayments.length);
}

        // Load equipment
const equipmentResponse = await fetch('/api/equipment');
const equipmentResult = await equipmentResponse.json();
if (equipmentResult.success) {
    newEquipment = equipmentResult.data || [];
    console.log('Loaded equipment:', newEquipment.length);
}


const attendanceResponse = await fetch('/api/attendance');
        const attendanceResult = await attendanceResponse.json();
        if (attendanceResult.success) {
            newAttendance = attendanceResult.data || [];
            console.log('Loaded attendance:', newAttendance.length);
        }
        
        // Load reports
        const reportsResponse = await fetch('/api/reports');
        const reportsResult = await reportsResponse.json();
        if (reportsResult.success) {
            newReports = reportsResult.data || [];
            console.log('Loaded reports:', newReports.length);
        }

        // Load trainer attendance
const trainerAttendanceResponse = await fetch('/api/trainer-attendance');
const trainerAttendanceResult = await trainerAttendanceResponse.json();
if (trainerAttendanceResult.success) {
    trainerAttendance = trainerAttendanceResult.data || [];
    console.log('Loaded trainer attendance:', trainerAttendance.length);
}
        
        // Only update global arrays after ALL data is loaded successfully
        members = newMembers;
        trainers = newTrainers;
        payments = newPayments;
        receipts = newReceipts;
        reports = newReports;
        trainerSalaryPayments = newTrainerSalaryPayments;
        equipment = newEquipment;
        attendance = newAttendance;
        
        console.log('✓ All data loaded successfully');
console.log('Final counts:', { 
    members: members.length, 
    trainers: trainers.length, 
    payments: payments.length,
    equipment: equipment.length,  // ADD THIS LINE
    attendance: attendance.length 
});
        
    } catch (error) {
        console.error('Error loading data from server:', error);
        showToast('Error loading data from server', 'error');
    }
}
// Initialize
// Replace lines 89-103 with this COMBINED version:
// ✅ KEEP THIS ONE:
document.addEventListener('DOMContentLoaded', async () => {
    initializeNavigation();
    initializeDateFilters();
    initializeCurrency();  // Add if not present
    
    await loadDataFromServer();
    await loadReportsFromServer();
    
    updateDashboard();
    renderMembers();
    renderTrainers();
    renderPayments();
    renderPremiumSection();
    renderReceipts();
    renderReports();
    renderTrainerSalarySection();
    renderEquipment();
    renderAttendance();
    renderTrainerAttendance();
    initializeCharts();
    loadSettings();
    updateSystemInfo();
    
    // ADD THESE LINES:
    loadLicenseData();
    enforceActiveLicense();
});

// DELETE lines 1182-1185 completely
// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function switchSection(section) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(section).classList.add('active');
}

// Dashboard Updates
function updateDashboard() {
    checkOverduePayments();

    const totalRevenue = payments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const trainerSalaries = trainerSalaryPayments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0);

    const equipmentExpenses = equipment.reduce((sum, e) => sum + (e.cost * e.quantity), 0);
    const totalExpenses = trainerSalaries + equipmentExpenses;
    const netProfit = totalRevenue - totalExpenses;
    
    const totalMembers = members.filter(m => m.status === 'Active').length;
    const premiumMembers = members.filter(m => m.type === 'Premium' && m.status === 'Active').length;
    const dueMembers = payments.filter(p => p.status === 'Due').length;
    const totalTrainers = trainers.filter(t => t.status === 'Active').length;
    const todayAttendance = Math.floor(totalMembers * 0.7);

    // ✅ USE formatCurrency() instead of manual formatting
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('trainerSalaries').textContent = formatCurrency(trainerSalaries);
    document.getElementById('netProfit').textContent = formatCurrency(netProfit);
    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('premiumMembers').textContent = premiumMembers;
    document.getElementById('dueMembers').textContent = dueMembers;
    document.getElementById('totalTrainers').textContent = totalTrainers;
    document.getElementById('todayAttendance').textContent = todayAttendance;

    const totalEquipmentCount = equipment.length;
    const brokenEquipmentCount = equipment.filter(e => e.status === 'Broken' || e.status === 'Missing').length;
    document.getElementById('dashboardTotalEquipment').textContent = totalEquipmentCount;
    document.getElementById('dashboardBrokenEquipment').textContent = brokenEquipmentCount;

    // ✅ Financial overview with currency formatting
    document.getElementById('financialIncome').textContent = formatCurrency(totalRevenue);
    document.getElementById('financialExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('financialTrainerSalaries').textContent = formatCurrency(trainerSalaries);
    document.getElementById('financialProfit').textContent = formatCurrency(netProfit);

    const equipmentExpensesEl = document.getElementById('financialEquipmentExpenses');
    if (equipmentExpensesEl) {
        equipmentExpensesEl.textContent = formatCurrency(equipmentExpenses);
    }
    
    // Color coding for profit
    const profitElement = document.getElementById('netProfit');
    const financialProfitElement = document.getElementById('financialProfit');
    
    if (netProfit > 0) {
        profitElement.style.color = '#28a745';
        financialProfitElement.style.color = '#28a745';
    } else if (netProfit < 0) {
        profitElement.style.color = '#dc3545';
        financialProfitElement.style.color = '#dc3545';
    } else {
        profitElement.style.color = '';
        financialProfitElement.style.color = '';
    }

    updateRecentActivities();
    updateCharts();
    updateChartCurrency(); // ✅ Update chart currency labels
}

function updateRecentActivities() {
    // Recent admissions (last 5 members)
    const recentAdmissions = [...members]
        .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
        .slice(0, 5);
    
    const admissionsHtml = recentAdmissions.map(m => `
        <div class="activity-item">
            <div>
                <div class="activity-name">${m.name}</div>
                <div class="activity-date">${formatDate(m.joinDate)}</div>
            </div>
            <span class="status-badge status-${m.type.toLowerCase()}">${m.type}</span>
        </div>
    `).join('');
    document.getElementById('recentAdmissions').innerHTML = admissionsHtml;

    // Recent trainers
    const recentTrainers = [...trainers]
        .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
        .slice(0, 5);
    
    const trainersHtml = recentTrainers.map(t => `
        <div class="activity-item">
            <div>
                <div class="activity-name">${t.name}</div>
                <div class="activity-date">${formatDate(t.joinDate)} - ${t.specialty}</div>
            </div>
        </div>
    `).join('');
    document.getElementById('recentTrainers').innerHTML = trainersHtml;

    // Suspended/Quit members
    const suspendedMembers = members.filter(m => m.status === 'Suspended' || m.status === 'Quit');
    const suspendedHtml = suspendedMembers.map(m => `
        <div class="activity-item">
            <div>
                <div class="activity-name">${m.name}</div>
                <div class="activity-date">${formatDate(m.joinDate)}</div>
            </div>
            <span class="status-badge status-${m.status.toLowerCase()}">${m.status}</span>
        </div>
    `).join('');
    document.getElementById('suspendedMembers').innerHTML = suspendedHtml || '<p style="padding: 1rem; color: #7F8C8D;">No suspended or quit members</p>';
}

function initializeCharts() {
    // Check if chart elements exist
    const revenueCanvas = document.getElementById('revenueChart');
    const profitCanvas = document.getElementById('profitChart');
    const memberCanvas = document.getElementById('memberChart');
    
    if (!revenueCanvas || !profitCanvas || !memberCanvas) {
        console.warn('Chart canvases not found');
        return;
    }
    
    // Destroy existing charts first
    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (memberChart) memberChart.destroy();
    
    const revenueCtx = revenueCanvas.getContext('2d');
    const profitCtx = profitCanvas.getContext('2d');
    const memberCtx = memberCanvas.getContext('2d');

    // Get actual revenue data by month
    const revenueData = calculateMonthlyRevenue();
    const expenseData = calculateMonthlyExpenses();
    const profitData = revenueData.map((rev, index) => rev - expenseData[index]);
    const memberData = calculateMonthlyMembers();

    revenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Revenue',
                data: revenueData,
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });

    profitChart = new Chart(profitCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Revenue',
                data: revenueData,
                borderColor: 'rgba(40, 167, 69, 1)',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: false
            }, {
                label: 'Expenses',
                data: expenseData,
                borderColor: 'rgba(220, 53, 69, 1)',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: false
            }, {
                label: 'Net Profit',
                data: profitData,
                borderColor: 'rgba(23, 162, 184, 1)',
                backgroundColor: 'rgba(23, 162, 184, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });

    memberChart = new Chart(memberCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Total Members',
                data: memberData.total,
                borderColor: 'rgba(231, 76, 60, 1)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }, {
                label: 'Premium Members',
                data: memberData.premium,
                borderColor: 'rgba(243, 156, 18, 1)',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Calculate monthly expenses (trainer salaries)
function calculateMonthlyExpenses() {
    const monthlyExpenses = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    trainerSalaryPayments.forEach(payment => {
        if (payment.status === 'Paid' && payment.paymentDate) {
            const paymentDate = new Date(payment.paymentDate);
            if (paymentDate.getFullYear() === currentYear) {
                const month = paymentDate.getMonth();
                monthlyExpenses[month] += payment.amount || 0;
            }
        }
    });
    
    return monthlyExpenses;
}
// Calculate monthly revenue from actual payment data
function calculateMonthlyRevenue() {
    const monthlyRevenue = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    payments.forEach(payment => {
        if (payment.status === 'Paid' && payment.date) {
            const paymentDate = new Date(payment.date);
            if (paymentDate.getFullYear() === currentYear) {
                const month = paymentDate.getMonth();
                monthlyRevenue[month] += payment.amount || 0;
            }
        }
    });
    
    return monthlyRevenue;
}

// Calculate monthly member counts from actual member data
function calculateMonthlyMembers() {
    const currentYear = new Date().getFullYear();
    const monthlyTotal = new Array(12).fill(0);
    const monthlyPremium = new Array(12).fill(0);
    
    // Count cumulative members by month
    for (let month = 0; month < 12; month++) {
        members.forEach(member => {
            if (member.joinDate) {
                const joinDate = new Date(member.joinDate);
                const joinYear = joinDate.getFullYear();
                const joinMonth = joinDate.getMonth();
                
                // If joined this year and in or before this month, or joined in previous years
                if ((joinYear === currentYear && joinMonth <= month) || joinYear < currentYear) {
                    // Check if member is still active or status change was after this month
                    if (member.status === 'Active' || 
                        (member.statusChangeDate && new Date(member.statusChangeDate).getMonth() > month)) {
                        monthlyTotal[month]++;
                        if (member.type === 'Premium') {
                            monthlyPremium[month]++;
                        }
                    }
                }
            }
        });
    }
    
    return {
        total: monthlyTotal,
        premium: monthlyPremium
    };
}

function updateCharts() {
    if (revenueChart && profitChart && memberChart) {
        // Update with actual data
        const revenueData = calculateMonthlyRevenue();
        const expenseData = calculateMonthlyExpenses();
        const profitData = revenueData.map((rev, index) => rev - expenseData[index]);
        const memberData = calculateMonthlyMembers();
        
        revenueChart.data.datasets[0].data = revenueData;
        revenueChart.update();
        
        profitChart.data.datasets[0].data = revenueData;
        profitChart.data.datasets[1].data = expenseData;
        profitChart.data.datasets[2].data = profitData;
        profitChart.update();
        
        memberChart.data.datasets[0].data = memberData.total;
        memberChart.data.datasets[1].data = memberData.premium;
        memberChart.update();
    }
}

// Erase all data from database
async function eraseAllData() {
    // First confirmation
    if (!confirm('⚠️ WARNING: This will delete ALL data including members, trainers, payments, equipment, attendance, and receipts. This action CANNOT be undone. Are you absolutely sure?')) {
        return;
    }
    
    // Second confirmation for safety
    if (!confirm('⚠️ FINAL WARNING: All your gym data will be permanently deleted. Type YES in the next prompt to confirm.')) {
        return;
    }
    
    // Ask user to type YES
    const confirmation = prompt('Type "YES" (in capital letters) to confirm data deletion:');
    
    if (confirmation !== 'YES') {
        showToast('Data deletion cancelled', 'info');
        return;
    }
    
    try {
        showToast('Erasing all data... Please wait', 'info');
        
        // Delete all data types one by one
        const dataTypes = [
            { name: 'members', data: members },
            { name: 'trainers', data: trainers },
            { name: 'payments', data: payments },
            { name: 'trainer-salaries', data: trainerSalaryPayments },
            { name: 'equipment', data: equipment },
            { name: 'attendance', data: attendance },
            { name: 'trainer-attendance', data: trainerAttendance },
            { name: 'receipts', data: receipts },
            { name: 'reports', data: reports }
        ];
        
        // Delete all records
        for (const type of dataTypes) {
            for (const item of type.data) {
                await fetch(`/api/${type.name}/${item.id}`, {
                    method: 'DELETE'
                });
            }
        }
        
        // Reload empty data
        await loadDataFromServer();
        await loadReportsFromServer();
        
        // Update all displays
        renderMembers();
        renderTrainers();
        renderPayments();
        renderPremiumSection();
        renderReceipts();
        renderReports();
        renderTrainerSalarySection();
        renderEquipment();
        renderAttendance();
        renderTrainerAttendance();
        updateDashboard();
        
        showToast('✓ All data has been erased successfully', 'success');
        
        // Create automatic backup of empty database
        await createManualBackup();
        
    } catch (error) {
        console.error('Error erasing data:', error);
        showToast('Error erasing data. Some data may remain.', 'error');
    }
}

// Reset revenue data
async function resetRevenue() {
    if (!confirm('Are you sure you want to reset all revenue data? This will delete all payment records. This action cannot be undone.')) {
        return;
    }
    
    try {
        showToast('Resetting revenue data...', 'info');
        
        // Delete all payments
        const paymentIds = [...payments.map(p => p.id)];
        
        for (const id of paymentIds) {
            await fetch(`/api/payments/${id}`, {
                method: 'DELETE'
            });
        }
        
        // Reload data
        await loadDataFromServer();
        renderPayments();
        updateDashboard();
        
        showToast('Revenue data reset successfully', 'success');
    } catch (error) {
        console.error('Error resetting revenue:', error);
        showToast('Error resetting revenue data', 'error');
    }
}

// Members Management
function renderMembers() {
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = members.map(m => `
        <tr>
            <td data-label="ID">${m.id}</td>
            <td data-label="Name">${m.name}</td>
            <td data-label="Type"><span class="status-badge status-${m.type.toLowerCase()}">${m.type}</span></td>
            <td data-label="Phone">${m.phone}</td>
            <td data-label="Email">
                ${m.email ? `<a href="mailto:${m.email}" style="color: var(--secondary-color); text-decoration: none;">
                    <i class="fas fa-envelope"></i> ${m.email}
                </a>` : '<span style="color: var(--text-secondary);">—</span>'}
            </td>
            <td data-label="Address" style="max-width: 200px;">
                ${m.address ? `<span title="${m.address}" style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <i class="fas fa-map-marker-alt"></i> ${m.address}
                </span>` : '<span style="color: var(--text-secondary);">—</span>'}
            </td>
            <td data-label="Status"><span class="status-badge status-${m.status.toLowerCase()}">${m.status}</span></td>
            <td data-label="Join Date">${formatDate(m.joinDate)}</td>
            <td data-label="Actions">
                <button class="btn-edit" onclick="editMember('${m.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteMember('${m.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}
function showMemberModal(id = null) {
    const modal = document.getElementById('memberModal');
    const form = document.getElementById('memberForm');
    const title = document.getElementById('memberModalTitle');
    
    if (id) {
        const member = members.find(m => m.id === id);
        title.textContent = 'Edit Premium Member';
        document.getElementById('premiumId').value = member.id;
        document.getElementById('premiumName').value = member.name;
        document.getElementById('premiumPhone').value = member.phone;
        document.getElementById('premiumPlan').value = member.plan || 'Annual Premium';
        document.getElementById('premiumAmount').value = inrToInput(member.amount);
        document.getElementById('premiumPaymentStatus').value = member.payment || 'Due';
        document.getElementById('premiumTrainer').value = member.trainerId || '';
    } else {
        title.textContent = 'Add Member';
        form.reset();
        document.getElementById('memberId').value = '';
    }
    
    modal.classList.add('show');
}

function editMember(id) {
    showMemberModal(id);  // Don't parse
}

async function deleteMember(id) {
    if (confirm('Are you sure you want to delete this member?')) {
        try {
            const response = await fetch(`/api/members/${id}`, {  // Keep as string
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                await loadDataFromServer();
                renderMembers();
                renderPayments();
                updateDashboard();
                renderPremiumSection();
                showToast('Member deleted successfully', 'success');
            } else {
                showToast('Failed to delete member', 'error');
            }
        } catch (error) {
            console.error('Error deleting member:', error);
            showToast('Error deleting member', 'error');
        }
    }
}

document.getElementById('memberForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('memberId').value;  // Keep as string
    const memberData = {
        name: document.getElementById('memberName').value,
        type: document.getElementById('memberType').value,
        phone: document.getElementById('memberPhone').value,
        email: document.getElementById('memberEmail').value || null,
        address: document.getElementById('memberAddress').value || null,
        status: document.getElementById('memberStatus').value
    };
    
    try {
        let response;
        if (id) {
            // Edit existing member
            response = await fetch(`/api/members/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            });
        } else {
            // Add new member
            response = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            });
        }
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderMembers();
            updateDashboard();
            renderPremiumSection();
            closeModal('memberModal');
            showToast(id ? 'Member updated successfully' : 'Member added successfully', 'success');
        } else {
            showToast('Failed to save member', 'error');
        }
    } catch (error) {
        console.error('Error saving member:', error);
        showToast('Error saving member', 'error');
    }
});

function showPremiumModal(id = null) {
    const modal = document.getElementById('premiumModal');
    const form = document.getElementById('premiumForm');
    const title = document.getElementById('premiumModalTitle');
    const trainerSelect = document.getElementById('premiumTrainer');
    
    // Populate trainer dropdown
    trainerSelect.innerHTML = '<option value="">No Trainer Assigned</option>' +
        trainers.filter(t => t.status === 'Active').map(t => 
            `<option value="${t.id}">${t.name} - ${t.specialty}</option>`
        ).join('');
    
    if (id) {
        const member = members.find(m => m.id === id);
        title.textContent = 'Edit Premium Member';
        document.getElementById('premiumId').value = member.id;
        document.getElementById('premiumName').value = member.name;
        document.getElementById('premiumPhone').value = member.phone;
        document.getElementById('premiumPlan').value = member.plan || 'Annual Premium';
        document.getElementById('premiumAmount').value = member.amount;
        document.getElementById('premiumPaymentStatus').value = member.payment || 'Due';
        document.getElementById('premiumTrainer').value = member.trainerId || '';
    } else {
        title.textContent = 'Add Premium Member';
        form.reset();
        document.getElementById('premiumId').value = '';
    }
    
    modal.classList.add('show');
}

function updatePremiumAmount() {
    const plan = document.getElementById('premiumPlan').value;
    const amountInput = document.getElementById('premiumAmount');
    
    const planPrices = {
        'Monthly Premium': 150,
        'Quarterly Premium': 400,
        'Annual Premium': 1500
    };
    
    if (plan && planPrices[plan]) {
        amountInput.value = planPrices[plan];
    }
}

function editPremiumMember(id) {
    showPremiumModal(id);
}

document.getElementById('premiumForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('premiumId').value;
    const plan = document.getElementById('premiumPlan').value;
    const trainerId = document.getElementById('premiumTrainer').value;
    
    const memberData = {
        name: document.getElementById('premiumName').value,
        type: 'Premium',
        phone: document.getElementById('premiumPhone').value,
        amount: inputToINR(document.getElementById('premiumAmount').value),
        status: 'Active',
        payment: document.getElementById('premiumPaymentStatus').value,
        plan: plan,
        trainerId: trainerId ? String(trainerId) : null,
        trainerName: trainerId ? trainers.find(t => t.id === trainerId)?.name : null
    };
    
    try {
        let response;
        if (id) {
            // Edit existing member
            response = await fetch(`/api/members/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            });
        } else {
            // Add new premium member
            response = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            });
        }
        
        const result = await response.json();
        if (result.success) {
            // First, reload data to get the updated member
            await loadDataFromServer();
            
            // Also create a payment record if paid
            if (memberData.payment === 'Paid') {
                const paymentResponse = await fetch('/api/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberId: result.data.id,
                        memberName: result.data.name,
                        amount: result.data.amount,
                        status: 'Paid'
                    })
                });
                
                if (paymentResponse.ok) {
                    // Reload data again to get the new payment
                    await loadDataFromServer();
                }
            }
            
            // Now update all UI components with the fresh data
            renderMembers();
            renderPremiumSection();
            renderPayments();
            updateDashboard(); // This will update charts with new payment data
            
            closeModal('premiumModal');
            showToast(id ? 'Premium member updated successfully' : 'Premium member added successfully', 'success');
        } else {
            showToast('Failed to save premium member', 'error');
        }
    } catch (error) {
        console.error('Error saving premium member:', error);
        showToast('Error saving premium member', 'error');
    }
});

// Trainers Management
function renderTrainers() {
    const tbody = document.getElementById('trainersTableBody');
    tbody.innerHTML = trainers.map(t => `
        <tr>
            <td data-label="ID">${t.id}</td>
            <td data-label="Name">${t.name}</td>
            <td data-label="Specialty">${t.specialty}</td>
            <td data-label="Status"><span class="status-badge status-${t.status.toLowerCase()}">${t.status}</span></td>
            <td data-label="Salary">${formatCurrency(t.salary)}</td>
            <td data-label="Join Date">${formatDate(t.joinDate)}</td>
            <td data-label="Actions">
               <button class="btn-edit" onclick="editTrainer('${t.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteTrainer('${t.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function showTrainerModal(id = null) {
    const modal = document.getElementById('trainerModal');
    const form = document.getElementById('trainerForm');
    const title = document.getElementById('trainerModalTitle');
    
    if (id) {
        const trainer = trainers.find(t => t.id === id);
        title.textContent = 'Edit Trainer';
        document.getElementById('trainerId').value = trainer.id;
        document.getElementById('trainerName').value = trainer.name;
        document.getElementById('trainerSpecialty').value = trainer.specialty;
        document.getElementById('trainerPhone').value = trainer.phone;
        document.getElementById('trainerSalary').value = trainer.salary;
        document.getElementById('trainerStatus').value = trainer.status;
    } else {
        title.textContent = 'Add Trainer';
        form.reset();
        document.getElementById('trainerId').value = '';
    }
    
    modal.classList.add('show');
}

function editTrainer(id) {
    showTrainerModal(id);  // Don't parse
}

async function deleteTrainer(id) {
    if (confirm('Are you sure you want to delete this trainer?')) {
        try {
            const response = await fetch(`/api/trainers/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                await loadDataFromServer();
                renderTrainers();
                updateDashboard();
                showToast('Trainer deleted successfully', 'success');
            } else {
                showToast('Failed to delete trainer', 'error');
            }
        } catch (error) {
            console.error('Error deleting trainer:', error);
            showToast('Error deleting trainer', 'error');
        }
    }
}

document.getElementById('trainerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('trainerId').value;
    const trainerData = {
        name: document.getElementById('trainerName').value,
        specialty: document.getElementById('trainerSpecialty').value,
        phone: document.getElementById('trainerPhone').value,
        salary: parseFloat(document.getElementById('trainerSalary').value),
        status: document.getElementById('trainerStatus').value
    };
    
    try {
        let response;
        if (id) {
            response = await fetch(`/api/trainers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trainerData)
            });
        } else {
            response = await fetch('/api/trainers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trainerData)
            });
        }
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderTrainers();
            updateDashboard();
            closeModal('trainerModal');
            showToast(id ? 'Trainer updated successfully' : 'Trainer added successfully', 'success');
        } else {
            showToast('Failed to save trainer', 'error');
        }
    } catch (error) {
        console.error('Error saving trainer:', error);
        showToast('Error saving trainer', 'error');
    }
});

function renderPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    
    // Group payments by member and get only the most recent one for each
    const latestPayments = {};
    payments.forEach(p => {
        if (!latestPayments[p.memberId]) {
            latestPayments[p.memberId] = p;
        } else {
            const currentDate = new Date(latestPayments[p.memberId].date);
            const newDate = new Date(p.date);
            
            if (newDate > currentDate || (newDate.getTime() === currentDate.getTime() && p.id > latestPayments[p.memberId].id)) {
                latestPayments[p.memberId] = p;
            }
        }
    });
    
    const paymentsToShow = Object.values(latestPayments);
    
    if (paymentsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No payments found. Click "Add Payment" to create one.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = paymentsToShow.map(p => {
        const member = members.find(m => m.id === p.memberId);
        const isPremium = member && member.type === 'Premium';
        const trainerName = member && member.trainerName ? member.trainerName : 'Not Assigned';
        
        const paymentCount = payments.filter(payment => payment.memberId === p.memberId).length;
        
        return `
            <tr>
                <td data-label="Member ID">${p.memberId}</td>
                <td data-label="Member Name">
                    ${p.memberName}
                    ${paymentCount > 1 ? `<span style="color: var(--secondary-color); font-size: 0.85rem; margin-left: 0.5rem;">(${paymentCount} payments)</span>` : ''}
                </td>
                <td data-label="Member Type">
                    <span class="status-badge status-${isPremium ? 'premium' : 'regular'}">
                        ${isPremium ? '<i class="fas fa-crown"></i> Premium' : 'Regular'}
                    </span>
                </td>
                <td data-label="Trainer Assigned">
                    ${isPremium ? 
                        `<span style="color: var(--text-primary); font-weight: 500;">
                            ${trainerName === 'Not Assigned' 
                                ? '<span style="color: var(--text-secondary);">Not Assigned</span>' 
                                : '<i class="fas fa-user-tie"></i> ' + trainerName}
                        </span>` 
                        : '<span style="color: var(--text-secondary);">—</span>'}
                </td>
                <td data-label="Amount">${formatCurrency(p.amount)}</td>
                <td data-label="Status"><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
                <td data-label="Date">${formatDate(p.date)}</td>
                <td data-label="Actions">
                    <button class="btn-edit" onclick="editPayment('${p.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deletePayment('${p.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="btn-view-payments" onclick="viewMemberPayments('${p.memberId}')">
                        <i class="fas fa-file-invoice-dollar"></i> View History
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function checkOverduePayments() {
    const today = new Date();
    payments.forEach(payment => {
        if (payment.status !== 'Paid') {
            payment.status = 'Due';
        }
    });
}

function showPaymentModal(id = null) {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');
    const title = document.getElementById('paymentModalTitle');
    const memberSelect = document.getElementById('paymentMember');
    
    // ✅ FIXED: Populate member dropdown with TEXT IDs (M01, M02, etc.)
    memberSelect.innerHTML = members.map(m => 
        `<option value="${m.id}">${m.name} (ID: ${m.id})</option>`
    ).join('');
    
    if (id) {
        // EDIT MODE - Find the payment by ID
        const paymentId = String(id);
        const payment = payments.find(p => String(p.id) === paymentId);
        
        if (!payment) {
            console.error('Payment not found. ID:', paymentId);
            showToast('Payment not found', 'error');
            return;
        }
        
        console.log('Editing payment:', payment);
        
        title.textContent = 'Edit Payment';
        document.getElementById('paymentId').value = payment.id;
        document.getElementById('paymentMember').value = payment.memberId;  // ✅ Use member's TEXT ID
        document.getElementById('paymentAmount').value = inrToInput(payment.amount);
        document.getElementById('paymentStatus').value = payment.status;
    } else {
        // ADD MODE
        title.textContent = 'Add Payment';
        form.reset();
        document.getElementById('paymentId').value = '';
    }
    
    modal.classList.add('show');
}

// Edit payment function
function editPayment(id) {
    console.log('Edit payment called with ID:', id); // Debug log
    showPaymentModal(id);
}

// Delete payment function
async function deletePayment(id) {
    if (confirm('Are you sure you want to delete this payment?')) {
        try {
            const response = await fetch(`/api/payments/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                await loadDataFromServer();
                renderPayments();
                updateDashboard();
                showToast('Payment deleted successfully', 'success');
            } else {
                showToast('Failed to delete payment', 'error');
            }
        } catch (error) {
            console.error('Error deleting payment:', error);
            showToast('Error deleting payment', 'error');
        }
    }
}

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('paymentId').value;
    const memberId = document.getElementById('paymentMember').value;
    
    // Find member
    const member = members.find(m => m.id === memberId);
    
    if (!member) {
        showToast('Member not found', 'error');
        return;
    }
    
    const enteredAmount = parseFloat(document.getElementById('paymentAmount').value);
    
    // Check if amount is valid
    if (isNaN(enteredAmount) || enteredAmount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    const newPaymentData = {
        memberId: String(memberId),  // Make sure it's a string
        memberName: member.name,
        amount: enteredAmount,
        status: document.getElementById('paymentStatus').value,
        date: new Date().toISOString().split('T')[0]
    };
    
    try {
        let response;
        if (id) {
            // Edit existing payment
            response = await fetch(`/api/payments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPaymentData)
            });
        } else {
            // Create new payment
            response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPaymentData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            await loadDataFromServer();
            renderPayments();
            renderMembers();
            updateDashboard();
            closeModal('paymentModal');
            showToast(id ? 'Payment updated successfully' : 'Payment added successfully', 'success');
        } else {
            showToast('Failed to save payment: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving payment:', error);
        showToast('Error saving payment: ' + error.message, 'error');
    }
});
function renderPremiumSection() {
    const premiumMembers = members.filter(m => m.type === 'Premium' && m.status === 'Active');
    const premiumRevenue = premiumMembers.reduce((sum, m) => sum + m.amount, 0);
    
    document.getElementById('premiumCount').textContent = premiumMembers.length;
    document.getElementById('premiumRevenue').textContent = formatCurrency(premiumRevenue);
    
    const tbody = document.getElementById('premiumTableBody');
    
    if (premiumMembers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No premium members found. Click "Add Premium Member" to add one.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = premiumMembers.map(m => {
        // Calculate expiry date based on plan
        const joinDate = new Date(m.joinDate);
        const expiryDate = new Date(joinDate);
        
        // Determine months to add based on plan
        const planMonths = {
            'Monthly Premium': 1,
            'Quarterly Premium': 3,
            'Annual Premium': 12
        };
        
        const monthsToAdd = planMonths[m.plan] || 12;
        expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);
        
        // Get trainer name if assigned
        const trainerName = m.trainerName || 'Not Assigned';
        
        return `
            <tr>
                <td data-label="ID">${m.id}</td>
                <td data-label="Name">${m.name}</td>
                <td data-label="Plan">${m.plan || 'Annual Premium'}</td>
                <td data-label="Amount">${formatCurrency(m.amount)}</td>
                <td data-label="Status"><span class="status-badge status-${m.payment ? m.payment.toLowerCase() : 'due'}">${m.payment || 'Due'}</span></td>
                <td data-label="Expiry Date">${formatDate(expiryDate.toISOString().split('T')[0])}</td>
                <td data-label="Actions">
                    <button class="btn-edit" onclick="editPremiumMember('${m.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteMember('${m.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
                <td data-label="Trainer Assigned">
                    <span style="color: var(--text-primary); font-weight: 500;">
                        ${trainerName === 'Not Assigned' 
                            ? '<span style="color: var(--text-secondary);">Not Assigned</span>' 
                            : '<i class="fas fa-user-tie"></i> ' + trainerName}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Clear any hidden inputs
        const hiddenInputs = modal.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => input.value = '');
    }
}

// ============= SETTINGS & BACKUP FUNCTIONS =============

// Load settings
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        
        if (!response.ok) {
            console.warn('Settings not available, using defaults');
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const settings = result.data;
            
            // Apply dark mode
            if (settings.darkMode) {
                document.body.classList.add('dark-mode');
                const toggle = document.getElementById('darkModeToggle');
                if (toggle) toggle.checked = true;
            }
            
            // Set auto backup
            const autoBackupToggle = document.getElementById('autoBackupToggle');
            if (autoBackupToggle) {
                autoBackupToggle.checked = settings.autoBackup || false;
            }
            
            // Set backup frequency
            if (settings.backupFrequency) {
                const freqSelect = document.getElementById('backupFrequency');
                if (freqSelect) freqSelect.value = settings.backupFrequency;
            }
            
            // Show last backup time
            if (settings.lastBackup) {
                const lastBackupEl = document.getElementById('lastBackupTime');
                if (lastBackupEl) lastBackupEl.textContent = formatDate(settings.lastBackup);
            }
            
            // Show backup location
            if (settings.backupLocation) {
                const backupLocEl = document.getElementById('currentBackupLocation');
                if (backupLocEl) backupLocEl.textContent = settings.backupLocation;
            }
        }
    } catch (error) {
        console.warn('Could not load settings:', error.message);
        // Set default backup location
        const backupLocEl = document.getElementById('currentBackupLocation');
        if (backupLocEl) backupLocEl.textContent = 'Default location (AppData)';
    }
}

// Update system info
async function updateSystemInfo() {
    const activeMembers = members.filter(m => m.status === 'Active').length;
    const activeTrainers = trainers.filter(t => t.status === 'Active').length;
    
    document.getElementById('systemTotalMembers').textContent = activeMembers;
    document.getElementById('systemTotalTrainers').textContent = activeTrainers;
    
    // Database size will be calculated from server below
document.getElementById('databaseSize').textContent = 'Loading...';
    
    // Get drive information
    try {
        const response = await fetch('/api/database/info');
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const info = result.data;
                
                // Update database size from server if available
if (info.databaseSize) {
    const serverSizeKB = (info.databaseSize / 1024).toFixed(2);
    const serverSizeMB = (info.databaseSize / (1024 * 1024)).toFixed(2);
    
    let dbDisplay;
    if (serverSizeMB >= 1) {
        dbDisplay = `${serverSizeMB} MB`;
    } else {
        dbDisplay = `${serverSizeKB} KB`;
    }
    
    // Add total drive capacity
    if (info.driveInfo && info.driveInfo.totalSpaceGB) {
        document.getElementById('databaseSize').textContent = `${dbDisplay} / ${info.driveInfo.totalSpaceGB} GB`;
    } else {
        document.getElementById('databaseSize').textContent = dbDisplay;
    }
}
                
                // Update drive info display
                const driveInfoEl = document.getElementById('driveInfo');
                if (driveInfoEl && info.driveInfo) {
                    const drive = info.driveInfo;
                    driveInfoEl.innerHTML = `
                        <div class="info-row">
                            <span>Drive:</span>
                            <strong>${drive.name || drive.path}</strong>
                        </div>
                        ${drive.totalSpaceGB ? `
                        <div class="info-row">
                            <span>Total Space:</span>
                            <strong>${drive.totalSpaceGB} GB</strong>
                        </div>
                        ` : ''}
                        ${drive.freeSpaceGB ? `
                        <div class="info-row">
                            <span>Available Space:</span>
                            <strong>${drive.freeSpaceGB} GB</strong>
                        </div>
                        ` : ''}
                    `;
                }
            }
        }
    } catch (error) {
        console.error('Error getting database info from server:', error);
        // Size already calculated from local data above
    }
}

// Toggle dark mode
async function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.classList.toggle('dark-mode', isDark);
    
    try {
        await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ darkMode: isDark })
        });
        showToast('Theme updated successfully', 'success');
    } catch (error) {
        showToast('Failed to save theme preference', 'error');
    }
}

// Toggle auto backup
async function toggleAutoBackup() {
    const isEnabled = document.getElementById('autoBackupToggle').checked;
    const frequency = document.getElementById('backupFrequency').value;
    
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                autoBackup: isEnabled,
                backupFrequency: frequency
            })
        });
        
        const result = await response.json();
        if (result.success) {
            showToast(`Auto backup ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
        }
    } catch (error) {
        showToast('Failed to update auto backup settings', 'error');
    }
}

// Update backup frequency
async function updateBackupFrequency() {
    const frequency = document.getElementById('backupFrequency').value;
    const isEnabled = document.getElementById('autoBackupToggle').checked;
    
    if (isEnabled) {
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    autoBackup: true,
                    backupFrequency: frequency
                })
            });
            showToast(`Backup frequency updated to ${frequency}`, 'success');
        } catch (error) {
            showToast('Failed to update backup frequency', 'error');
        }
    }
}

// Open settings
function openSettings() {
    switchSection('settings');
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-item[data-section="settings"]').classList.add('active');
}

// Open backup modal
function openBackupModal() {
    document.getElementById('quickBackupModal').classList.add('show');
}

// Select backup location
async function selectBackupLocation() {
    const modal = document.getElementById('backupLocationModal');
    const drivesList = document.getElementById('drivesList');
    
    modal.classList.add('show');
    drivesList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Detecting drives...</div>';
    
    try {
        const response = await fetch('/api/database/drives');
        
        if (!response.ok) {
            throw new Error('Failed to fetch drives');
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            drivesList.innerHTML = result.data.map(drive => `
                <div class="drive-item ${drive.recommended ? 'recommended' : ''}" onclick="setBackupDrive('${drive.path.replace(/\\/g, '\\\\')}')">
                    <div class="drive-header">
                        <div class="drive-name">
                            <i class="fas fa-hdd"></i> ${drive.name || (drive.letter ? drive.letter + ':\\' : drive.path)} 
                            ${drive.type ? ' - ' + drive.type : ''}
                        </div>
                        ${drive.recommended ? '<span class="drive-badge"><i class="fas fa-star"></i> Recommended</span>' : ''}
                    </div>
                    <div class="drive-info">
                        ${drive.totalSpaceGB && drive.totalSpaceGB !== 'Available' && drive.totalSpaceGB !== '0' ? `
                            <span><i class="fas fa-hdd"></i> Total: ${drive.totalSpaceGB} GB</span>
                            <span><i class="fas fa-chart-pie" style="color: #f39c12;"></i> Used: ${drive.usedSpaceGB} GB</span>
                            <span><i class="fas fa-check-circle" style="color: #28a745;"></i> Free: ${drive.freeSpaceGB} GB</span>
                        ` : `
                            <span><i class="fas fa-check-circle" style="color: #28a745;"></i> Drive Available</span>
                        `}
                        <span><i class="fas fa-folder"></i> ${drive.path}</span>
                    </div>
                </div>
            `).join('');
        } else {
            drivesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No drives detected. Using default location.</p>';
        }
    } catch (error) {
        console.error('Error detecting drives:', error);
        drivesList.innerHTML = `
            <p style="text-align: center; color: var(--accent-color); padding: 2rem;">
                Error detecting drives: ${error.message}
            </p>
        `;
    }
}

// Set backup drive
async function setBackupDrive(drivePath) {
    try {
        showToast('Setting database location...', 'info');
        
        const response = await fetch('/api/database/backup-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drivePath })
        });
        
        const result = await response.json();
        if (result.success) {
            document.getElementById('currentBackupLocation').textContent = result.path;
            closeModal('backupLocationModal');
            showToast('Database location updated successfully!', 'success');
            
            // Update system info with new drive details
            updateSystemInfo();
            loadSettings();
        } else {
            showToast('Failed to set database location: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showToast('Error setting database location: ' + error.message, 'error');
        console.error('Error:', error);
    }
}

// Create manual backup
async function createManualBackup() {
    showToast('Creating backup...', 'info');
    
    try {
        const response = await fetch('/api/database/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        const result = await response.json();
        if (result.success) {
            showToast(`Backup created successfully at ${result.backupPath}`, 'success');
            loadSettings(); // Reload to update last backup time
            closeModal('quickBackupModal');
        } else {
            showToast('Backup failed: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showToast('Error creating backup', 'error');
        console.error('Error:', error);
    }
}

// Updated showRestoreModal function for single backup file
async function showRestoreModal() {
    const modal = document.getElementById('restoreBackupModal');
    const backupsList = document.getElementById('backupsList');
    
    modal.classList.add('show');
    backupsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading backups...</div>';
    
    try {
        const response = await fetch('/api/database/backups');
        const result = await response.json();
        
        console.log('Backups received:', result); // Debug log
        
        if (result.success && result.data && result.data.length > 0) {
            // All backups are from single file, so show them in one group
            let html = `
                <div class="backup-location-group">
                    <h4 style="color: var(--text-secondary); font-size: 0.9rem; margin: 1rem 0 0.5rem 0; padding: 0.5rem; background: var(--card-background); border-radius: 4px;">
                        <i class="fas fa-database"></i> Single Backup File (${result.data.length} backup${result.data.length !== 1 ? 's' : ''})
                    </h4>
            `;
            
            html += result.data.map(backup => {
                // Use backup.id or backup.path as the identifier
                const backupId = backup.id || backup.path;
                const displayName = backup.name || `Backup ${formatDate(backup.created)}`;
                const size = backup.sizeMB >= 1 ? backup.sizeMB + ' MB' : backup.sizeKB + ' KB';
                
                return `
                    <div class="backup-item">
                        <div class="backup-content" onclick="confirmRestore('${backupId}')">
                            <div class="backup-header">
                                <div class="backup-name">
                                    <i class="fas fa-clock"></i> ${displayName}
                                </div>
                            </div>
                            <div class="backup-info">
                                <span><i class="fas fa-calendar"></i> ${formatDate(backup.created)}</span>
                                <span><i class="fas fa-database"></i> ${size}</span>
                            </div>
                        </div>
                        <button class="btn-delete-backup" onclick="event.stopPropagation(); deleteBackupFile('${backupId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }).join('');
            
            html += '</div>';
            
            backupsList.innerHTML = html;
        } else {
            backupsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No backups found. Create a backup to get started.</p>';
        }
    } catch (error) {
        backupsList.innerHTML = '<p style="text-align: center; color: var(--accent-color); padding: 2rem;">Error loading backups: ' + error.message + '</p>';
        console.error('Error loading backups:', error);
    }
}

// Updated deleteBackupFile to use backup ID
async function deleteBackupFile(backupId) {
    if (!confirm('Are you sure you want to delete this backup? This cannot be undone.')) {
        return;
    }
    
    showToast('Deleting backup...', 'info');
    
    try {
        const response = await fetch('/api/database/backup/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupPath: backupId }) // Send as backupPath for compatibility
        });
        
        const result = await response.json();
        if (result.success) {
            showToast('Backup deleted successfully', 'success');
            // Refresh the backup list
            showRestoreModal();
        } else {
            showToast('Failed to delete backup: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showToast('Error deleting backup', 'error');
        console.error('Error:', error);
    }
}

// Updated confirmRestore to use backup ID
function confirmRestore(backupId) {
    if (confirm('Are you sure you want to restore this backup? Your current data will be backed up first.')) {
        restoreBackup(backupId);
    }
}

async function restoreBackup(backupId) {
    console.log('Starting restore for backup ID:', backupId);
    showToast('Restoring backup...', 'info');
    
    try {
        const response = await fetch('/api/database/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupPath: backupId })
        });
        
        const result = await response.json();
        console.log('Restore result:', result);
        
        if (result.success) {
            showToast(`Backup restored successfully! Reloading...`, 'success');
            closeModal('restoreBackupModal');
            
            // Wait a bit for database to settle
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('Before loadDataFromServer - attendance length:', attendance.length);
            
            // ✅ CRITICAL FIX: Load all data INCLUDING trainerAttendance
            await loadDataFromServer();
            await loadReportsFromServer();
            
            // ✅ ADD THIS LINE - Explicitly reload trainerAttendance
            const trainerAttendanceResponse = await fetch('/api/trainer-attendance');
            const trainerAttendanceResult = await trainerAttendanceResponse.json();
            if (trainerAttendanceResult.success) {
                trainerAttendance = trainerAttendanceResult.data || [];
                console.log('Loaded trainer attendance after restore:', trainerAttendance.length);
            }
            
            console.log('After loadDataFromServer - attendance length:', attendance.length);
            console.log('Attendance data:', attendance);
            
            // Render everything
            renderMembers();
            renderTrainers();
            renderPayments();
            renderPremiumSection();
            renderReceipts();
            renderReports();
            renderEquipment();
            renderAttendance();
            renderTrainerAttendance();  // ✅ ADD THIS LINE
            updateDashboard();
            
            showToast(`✓ Successfully restored!`, 'success');
            
        } else {
            showToast('Restore failed: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showToast('Error restoring backup: ' + error.message, 'error');
        console.error('Restore error:', error);
    }
}

// Export database
async function exportDatabase() {
    const exportPath = prompt('Enter export path (or leave empty for default):');
    if (exportPath === null) return;
    
    showToast('Exporting database...', 'info');
    
    try {
        const response = await fetch('/api/database/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exportPath: exportPath || undefined })
        });
        
        const result = await response.json();
        if (result.success) {
            showToast(`Database exported to ${result.path}`, 'success');
        } else {
            showToast('Export failed', 'error');
        }
    } catch (error) {
        showToast('Error exporting database', 'error');
        console.error('Error:', error);
    }
}

// Import database
async function importDatabase() {
    const importPath = prompt('Enter full path to import file:');
    if (!importPath) return;
    
    if (confirm('This will replace your current database. Are you sure?')) {
        showToast('Importing database...', 'info');
        
        try {
            const response = await fetch('/api/database/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ importPath })
            });
            
            const result = await response.json();
            if (result.success) {
                showToast('Database imported successfully. Reloading...', 'success');
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                showToast('Import failed: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showToast('Error importing database', 'error');
            console.error('Error:', error);
        }
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `message-toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 4000);
}

// ============= PAYMENT HISTORY FUNCTIONS =============

let currentMemberForPayment = null;

// View all payments for a specific member
function viewMemberPayments(memberId) {
    currentMemberForPayment = memberId;  // Keep as string
    const member = members.find(m => m.id === memberId);
    
    if (!member) {
        showToast('Member not found', 'error');
        return;
    }
    
    // Update modal title and info
    document.getElementById('paymentHistoryTitle').textContent = `Payment History - ${member.name}`;
    document.getElementById('paymentHistoryMemberInfo').innerHTML = `
        <strong>Type:</strong> ${member.type} | 
        <strong>Phone:</strong> ${member.phone} | 
        <strong>Status:</strong> ${member.status}
    `;
    
    // Get all payments for this member
    const memberPayments = payments.filter(p => p.memberId === memberId);
    
    // Render payment history
    renderPaymentHistory(memberPayments);
    
    // Show modal
    document.getElementById('paymentHistoryModal').classList.add('show');
}

// Render payment history table
function renderPaymentHistory(memberPayments) {
    const tbody = document.getElementById('paymentHistoryTableBody');
    
    if (memberPayments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No payment records found. Click "Add Payment Record" to create one.
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedPayments = [...memberPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sortedPayments.map((p, index) => {
    const statusClass = p.status.toLowerCase();
    const rowClass = `payment-record-row ${statusClass}-record`;
    const isPaid = p.status === 'Paid';
    
    return `
        <tr class="${rowClass}">
            <td data-label="ID">${p.memberId}</td>
            <td data-label="Amount">${formatCurrency(p.amount)}</td>
            <td data-label="Status">
                <span class="status-badge status-${statusClass}">${p.status}</span>
            </td>
            <td data-label="Date & Time">${formatDateTime(p.date, p.time)}</td>
            <td data-label="Actions">
                <button class="btn-mark-paid" onclick="markPaymentAsPaid(${p.id})" ${isPaid ? 'disabled' : ''}>
                    <i class="fas fa-check-circle"></i> ${isPaid ? 'Paid' : 'Mark as Paid'}
                </button>
                <button class="btn-delete" onclick="deletePaymentRecord(${p.id})" style="margin-left: 0.5rem;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `;
}).join('');
}

// Format date and time - FIXED VERSION
function formatDateTime(dateString, timeString) {
    const date = new Date(dateString);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    
    // If time exists and is valid, show it; otherwise show just the date
    if (timeString && timeString.trim() !== '') {
        return `${formattedDate} at ${timeString}`;
    } else {
        return formattedDate;
    }
}

// Mark payment as paid
async function markPaymentAsPaid(paymentId) {
    if (!confirm('Mark this payment as Paid?')) return;
    
    try {
        showToast('Updating payment status...', 'info');
        
        const payment = payments.find(p => p.id === paymentId);
        
        if (!payment) {
            showToast('Payment not found', 'error');
            return;
        }
        
        const paymentData = {
            memberId: payment.memberId,
            memberName: payment.memberName,
            amount: payment.amount,
            status: 'Paid',
            date: payment.date,
            time: payment.time || new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            })
        };
        
        const response = await fetch(`/api/payments/${paymentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadDataFromServer();
            
            // Refresh payment history display
            viewMemberPayments(currentMemberForPayment);
            
            // Update other displays
            renderPayments();
            renderMembers();
            renderEquipment();
            updateDashboard();
            
            showToast('Payment marked as Paid', 'success');
        } else {
            showToast('Failed to update payment', 'error');
        }
    } catch (error) {
        console.error('Error updating payment:', error);
        showToast('Error updating payment', 'error');
    }
}

// Delete payment record
async function deletePaymentRecord(paymentId) {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    
    try {
        showToast('Deleting payment record...', 'info');
        
        const response = await fetch(`/api/payments/${paymentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadDataFromServer();
            
            // Refresh payment history display
            viewMemberPayments(currentMemberForPayment);
            
            // Update other displays
            renderPayments();
            updateDashboard();
            
            showToast('Payment record deleted', 'success');
        } else {
            showToast('Failed to delete payment', 'error');
        }
    } catch (error) {
        console.error('Error deleting payment:', error);
        showToast('Error deleting payment', 'error');
    }
}

// ============= DATE FILTER FUNCTIONS =============

// Global filter state
let currentFilter = {
    section: null,
    filterType: 'all',
    filterValue: null
};

// Initialize date filter dropdowns
function initializeDateFilters() {
    populateYearFilters();
    populateMonthFilters();
    setupFilterListeners();
}

// Populate year filter dropdowns
function populateYearFilters() {
    const currentYear = new Date().getFullYear();
    const yearFilters = document.querySelectorAll('.year-filter');
    
    yearFilters.forEach(select => {
        select.innerHTML = '<option value="all">All Years</option>';
        for (let year = currentYear; year >= currentYear - 10; year--) {
            select.innerHTML += `<option value="${year}">${year}</option>`;
        }
    });
}

// Populate month filter dropdowns
function populateMonthFilters() {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthFilters = document.querySelectorAll('.month-filter');
    
    monthFilters.forEach(select => {
        select.innerHTML = '<option value="all">All Months</option>';
        months.forEach((month, index) => {
            select.innerHTML += `<option value="${index}">${month}</option>`;
        });
    });
}

// Setup filter event listeners
function setupFilterListeners() {
    // Members filters
    document.getElementById('membersFilterType')?.addEventListener('change', (e) => {
        handleFilterTypeChange('members', e.target.value);
    });
    
    document.getElementById('membersYearFilter')?.addEventListener('change', () => {
        applyFilters('members');
    });
    
    document.getElementById('membersMonthFilter')?.addEventListener('change', () => {
        applyFilters('members');
    });
    
    document.getElementById('membersDateFilter')?.addEventListener('change', () => {
        applyFilters('members');
    });
    
    // Trainers filters
    document.getElementById('trainersFilterType')?.addEventListener('change', (e) => {
        handleFilterTypeChange('trainers', e.target.value);
    });
    
    document.getElementById('trainersYearFilter')?.addEventListener('change', () => {
        applyFilters('trainers');
    });
    
    document.getElementById('trainersMonthFilter')?.addEventListener('change', () => {
        applyFilters('trainers');
    });
    
    document.getElementById('trainersDateFilter')?.addEventListener('change', () => {
        applyFilters('trainers');
    });
    
    // Payments filters
    document.getElementById('paymentsFilterType')?.addEventListener('change', (e) => {
        handleFilterTypeChange('payments', e.target.value);
    });
    
    document.getElementById('paymentsYearFilter')?.addEventListener('change', () => {
        applyFilters('payments');
    });
    
    document.getElementById('paymentsMonthFilter')?.addEventListener('change', () => {
        applyFilters('payments');
    });
    
    document.getElementById('paymentsDateFilter')?.addEventListener('change', () => {
        applyFilters('payments');
    });
    
    // Premium filters
    document.getElementById('premiumFilterType')?.addEventListener('change', (e) => {
        handleFilterTypeChange('premium', e.target.value);
    });
    
    document.getElementById('premiumYearFilter')?.addEventListener('change', () => {
        applyFilters('premium');
    });
    
    document.getElementById('premiumMonthFilter')?.addEventListener('change', () => {
        applyFilters('premium');
    });
    
    document.getElementById('premiumDateFilter')?.addEventListener('change', () => {
        applyFilters('premium');
    });
}

// Handle filter type change
function handleFilterTypeChange(section, filterType) {
    const yearFilter = document.getElementById(`${section}YearFilter`);
    const monthFilter = document.getElementById(`${section}MonthFilter`);
    const dateFilter = document.getElementById(`${section}DateFilter`);
    
    // Hide all filters first
    yearFilter.style.display = 'none';
    monthFilter.style.display = 'none';
    dateFilter.style.display = 'none';
    
    // Show relevant filter
    switch(filterType) {
        case 'year':
            yearFilter.style.display = 'inline-block';
            break;
        case 'month':
            yearFilter.style.display = 'inline-block';
            monthFilter.style.display = 'inline-block';
            break;
        case 'date':
            dateFilter.style.display = 'inline-block';
            break;
    }
    
    applyFilters(section);
}

// Apply filters based on current selection
function applyFilters(section) {
    const filterType = document.getElementById(`${section}FilterType`)?.value || 'all';
    
    switch(section) {
        case 'members':
            applyMemberFilters(); // Changed
            break;
        case 'trainers':
            applyTrainerFilters(); // Changed
            break;
        case 'payments':
            applyPaymentFilters();
            break;
        case 'premium':
            renderPremiumWithFilter(filterType);
            break;
    }
}

// Generic date filter function
function filterByDate(data, filterType, section, dateField) {
    const year = document.getElementById(`${section}YearFilter`)?.value;
    const month = document.getElementById(`${section}MonthFilter`)?.value;
    const date = document.getElementById(`${section}DateFilter`)?.value;
    
    return data.filter(item => {
        if (!item[dateField]) return false;
        
        const itemDate = new Date(item[dateField]);
        
        switch(filterType) {
            case 'year':
                if (year === 'all') return true;
                return itemDate.getFullYear() === parseInt(year);
                
            case 'month':
                if (year === 'all') return true;
                const yearMatch = itemDate.getFullYear() === parseInt(year);
                if (month === 'all') return yearMatch;
                return yearMatch && itemDate.getMonth() === parseInt(month);
                
            case 'date':
                if (!date) return true;
                const selectedDate = new Date(date);
                return itemDate.toDateString() === selectedDate.toDateString();
                
            default:
                return true;
        }
    });
}

// Update filtered count display
function updateFilteredCount(section, filtered, total) {
    const countElement = document.getElementById(`${section}FilterCount`);
    if (countElement) {
        if (filtered === total) {
            countElement.textContent = `Showing all ${total} records`;
            countElement.style.color = 'var(--text-secondary)';
        } else {
            countElement.textContent = `Showing ${filtered} of ${total} records`;
            countElement.style.color = 'var(--secondary-color)';
        }
    }
}

// Filter premium members by date
function renderPremiumWithFilter(filterType) {
    let filteredMembers = members.filter(m => m.type === 'Premium' && m.status === 'Active');
    
    if (filterType !== 'all') {
        filteredMembers = filterByDate(filteredMembers, filterType, 'premium', 'joinDate');
    }
    
    const tbody = document.getElementById('premiumTableBody');
    
    if (filteredMembers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No premium members found for the selected filter.
                </td>
            </tr>
        `;
        updateFilteredCount('premium', 0, members.filter(m => m.type === 'Premium' && m.status === 'Active').length);
        return;
    }
    
    tbody.innerHTML = filteredMembers.map(m => {
        const joinDate = new Date(m.joinDate);
        const expiryDate = new Date(joinDate);
        
        const planMonths = {
            'Monthly Premium': 1,
            'Quarterly Premium': 3,
            'Annual Premium': 12
        };
        
        const monthsToAdd = planMonths[m.plan] || 12;
        expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);
        
        const trainerName = m.trainerName || 'Not Assigned';
        
        return `
            <tr>
                <td data-label="ID">${m.id}</td>
                <td data-label="Name">${m.name}</td>
                <td data-label="Plan">${m.plan || 'Annual Premium'}</td>
                <td data-label="Amount">${formatCurrency(m.amount)}</td>
                <td data-label="Status"><span class="status-badge status-${m.payment ? m.payment.toLowerCase() : 'due'}">${m.payment || 'Due'}</span></td>
                <td data-label="Expiry Date">${formatDate(expiryDate.toISOString().split('T')[0])}</td>
                <td data-label="Actions">
                    <button class="btn-edit" onclick="editPremiumMember('${m.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteMember('${m.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
                <td data-label="Trainer Assigned">
                    <span style="color: var(--text-primary); font-weight: 500;">
                        ${trainerName === 'Not Assigned' 
                            ? '<span style="color: var(--text-secondary);">Not Assigned</span>' 
                            : '<i class="fas fa-user-tie"></i> ' + trainerName}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    updateFilteredCount('premium', filteredMembers.length, members.filter(m => m.type === 'Premium' && m.status === 'Active').length);
}

// Reset filters for a section
function resetFilters(section) {
    if (section === 'members') {
        resetMemberFilters();
    } else if (section === 'trainers') {
        resetTrainerFilters();
    } else if (section === 'payments') {
        resetPaymentFilters();
    } else {
        // Old reset logic for premium
        document.getElementById(`${section}FilterType`).value = 'all';
        document.getElementById(`${section}YearFilter`).value = 'all';
        document.getElementById(`${section}MonthFilter`).value = 'all';
        document.getElementById(`${section}DateFilter`).value = '';
        
        document.getElementById(`${section}YearFilter`).style.display = 'none';
        document.getElementById(`${section}MonthFilter`).style.display = 'none';
        document.getElementById(`${section}DateFilter`).style.display = 'none';
        
        applyFilters(section);
    }
}
// Apply payment filters (status, search, and date combined)
function applyPaymentFilters() {
    const statusFilter = document.getElementById('paymentsStatusFilter')?.value || 'all';
    const searchQuery = document.getElementById('paymentsMemberSearch')?.value.toLowerCase() || '';
    const filterType = document.getElementById('paymentsFilterType')?.value || 'all';
    
    let filteredPayments = [...payments];
    
    // Apply status filter
    if (statusFilter === 'paid') {
        filteredPayments = filteredPayments.filter(p => p.status === 'Paid');
    } else if (statusFilter === 'due') {
        filteredPayments = filteredPayments.filter(p => p.status === 'Due');
    }
    
    // Apply search filter (by name or ID)
    if (searchQuery) {
        filteredPayments = filteredPayments.filter(p => {
            const memberName = p.memberName.toLowerCase();
            const memberId = String(p.memberId).toLowerCase();
            const memberIdNumber = memberId.replace(/[^0-9]/g, ''); // Extract just numbers
            const paymentId = String(p.id);
            
            return memberName.includes(searchQuery) || 
                   memberId.includes(searchQuery) || 
                   memberIdNumber.includes(searchQuery) ||
                   paymentId.includes(searchQuery);
        });
    }
    
    // Apply date filter
    if (filterType !== 'all') {
        filteredPayments = filterByDate(filteredPayments, filterType, 'payments', 'date');
    }
    
    // Render filtered payments
    renderFilteredPayments(filteredPayments);
    
    // Update count
    updatePaymentFilterCount(filteredPayments.length, payments.length, statusFilter, searchQuery);
}

// Render filtered payments
function renderFilteredPayments(filteredPayments) {
    const tbody = document.getElementById('paymentsTableBody');
    
    if (filteredPayments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-search" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                    No payments found matching your filters.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredPayments.map(p => {
        const member = members.find(m => m.id === p.memberId);
        const isPremium = member && member.type === 'Premium';
        const trainerName = member && member.trainerName ? member.trainerName : 'Not Assigned';
        
        return `
            <tr>
                <td data-label="ID">${p.id}</td>
                <td data-label="Member Name">${p.memberName}</td>
                <td data-label="Member Type">
                    <span class="status-badge status-${isPremium ? 'premium' : 'regular'}">
                        ${isPremium ? '<i class="fas fa-crown"></i> Premium' : 'Regular'}
                    </span>
                </td>
                <td data-label="Trainer Assigned">
                    ${isPremium ? 
                        `<span style="color: var(--text-primary); font-weight: 500;">
                            ${trainerName === 'Not Assigned' 
                                ? '<span style="color: var(--text-secondary);">Not Assigned</span>' 
                                : '<i class="fas fa-user-tie"></i> ' + trainerName}
                        </span>` 
                        : '<span style="color: var(--text-secondary);">—</span>'}
                </td>
                <td data-label="Amount">$${p.amount}</td>
                <td data-label="Status"><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
                <td data-label="Date">${formatDate(p.date)}</td>
                <td data-label="Actions">
                    <button class="btn-edit" onclick="editPayment(${p.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deletePayment(${p.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="btn-view-payments" onclick="viewMemberPayments(${p.memberId})">
                        <i class="fas fa-file-invoice-dollar"></i> View History
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update payment filter count with more detail
function updatePaymentFilterCount(filtered, total, statusFilter, searchQuery) {
    const countElement = document.getElementById('paymentsFilterCount');
    if (!countElement) return;
    
    let message = `Showing ${filtered} of ${total} payment${total !== 1 ? 's' : ''}`;
    
    if (statusFilter !== 'all') {
        message += ` (${statusFilter === 'paid' ? 'Paid' : 'Due'} only)`;
    }
    
    if (searchQuery) {
        message += ` matching "${searchQuery}"`;
    }
    
    countElement.textContent = message;
    
    if (filtered === total) {
        countElement.style.color = 'var(--text-secondary)';
    } else {
        countElement.style.color = 'var(--secondary-color)';
    }
}

// Reset all payment filters
function resetPaymentFilters() {
    document.getElementById('paymentsStatusFilter').value = 'all';
    document.getElementById('paymentsMemberSearch').value = '';
    document.getElementById('paymentsFilterType').value = 'all';
    document.getElementById('paymentsYearFilter').value = 'all';
    document.getElementById('paymentsMonthFilter').value = 'all';
    document.getElementById('paymentsDateFilter').value = '';
    
    document.getElementById('paymentsYearFilter').style.display = 'none';
    document.getElementById('paymentsMonthFilter').style.display = 'none';
    document.getElementById('paymentsDateFilter').style.display = 'none';
    
    applyPaymentFilters();
}

// ============= MEMBER FILTER FUNCTIONS =============

// Apply member filters (search and date combined)
function applyMemberFilters() {
    const searchQuery = document.getElementById('membersSearch')?.value.toLowerCase() || '';
    const filterType = document.getElementById('membersFilterType')?.value || 'all';
    
    let filteredMembers = [...members];
    
    // Apply search filter (by name or ID)
    if (searchQuery) {
        filteredMembers = filteredMembers.filter(m => {
            const memberName = m.name.toLowerCase();
            const memberId = String(m.id).toLowerCase();
            const memberIdNumber = memberId.replace(/[^0-9]/g, ''); // Extract just numbers (M01 -> 01)
            
            return memberName.includes(searchQuery) || 
                   memberId.includes(searchQuery) || 
                   memberIdNumber.includes(searchQuery);
        });
    }
    
    // Apply date filter
    if (filterType !== 'all') {
        filteredMembers = filterByDate(filteredMembers, filterType, 'members', 'joinDate');
    }
    
    // Render filtered members
    renderFilteredMembers(filteredMembers);
    
    // Update count
    updateMemberFilterCount(filteredMembers.length, members.length, searchQuery);
}

// Render filtered members
function renderFilteredMembers(filteredMembers) {
    const tbody = document.getElementById('membersTableBody');
    
    if (filteredMembers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-search" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                    No members found matching your filters.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredMembers.map(m => `
        <tr>
            <td data-label="ID">${m.id}</td>
            <td data-label="Name">${m.name}</td>
            <td data-label="Type"><span class="status-badge status-${m.type.toLowerCase()}">${m.type}</span></td>
            <td data-label="Phone">${m.phone}</td>
            <td data-label="Email">
                ${m.email ? `<a href="mailto:${m.email}" style="color: var(--secondary-color); text-decoration: none;">
                    <i class="fas fa-envelope"></i> ${m.email}
                </a>` : '<span style="color: var(--text-secondary);">—</span>'}
            </td>
            <td data-label="Address" style="max-width: 200px;">
                ${m.address ? `<span title="${m.address}" style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <i class="fas fa-map-marker-alt"></i> ${m.address}
                </span>` : '<span style="color: var(--text-secondary);">—</span>'}
            </td>
            <td data-label="Status"><span class="status-badge status-${m.status.toLowerCase()}">${m.status}</span></td>
            <td data-label="Join Date">${formatDate(m.joinDate)}</td>
            <td data-label="Actions">
                <button class="btn-edit" onclick="editMember(${m.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteMember(${m.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Update member filter count
function updateMemberFilterCount(filtered, total, searchQuery) {
    const countElement = document.getElementById('membersFilterCount');
    if (!countElement) return;
    
    let message = `Showing ${filtered} of ${total} member${total !== 1 ? 's' : ''}`;
    
    if (searchQuery) {
        message += ` matching "${searchQuery}"`;
    }
    
    countElement.textContent = message;
    
    if (filtered === total) {
        countElement.style.color = 'var(--text-secondary)';
    } else {
        countElement.style.color = 'var(--secondary-color)';
    }
}

// Reset member filters
function resetMemberFilters() {
    document.getElementById('membersSearch').value = '';
    document.getElementById('membersFilterType').value = 'all';
    document.getElementById('membersYearFilter').value = 'all';
    document.getElementById('membersMonthFilter').value = 'all';
    document.getElementById('membersDateFilter').value = '';
    
    document.getElementById('membersYearFilter').style.display = 'none';
    document.getElementById('membersMonthFilter').style.display = 'none';
    document.getElementById('membersDateFilter').style.display = 'none';
    
    applyMemberFilters();
}

// ============= TRAINER FILTER FUNCTIONS =============

// Apply trainer filters (search and date combined)
function applyTrainerFilters() {
    const searchQuery = document.getElementById('trainersSearch')?.value.toLowerCase() || '';
    const filterType = document.getElementById('trainersFilterType')?.value || 'all';
    
    let filteredTrainers = [...trainers];
    
    // Apply search filter (by name or ID)
    if (searchQuery) {
        filteredTrainers = filteredTrainers.filter(t => {
            const trainerName = t.name.toLowerCase();
            const trainerId = String(t.id).toLowerCase();
            const trainerIdNumber = trainerId.replace(/[^0-9]/g, ''); // Extract just numbers (T01 -> 01)
            
            return trainerName.includes(searchQuery) || 
                   trainerId.includes(searchQuery) || 
                   trainerIdNumber.includes(searchQuery);
        });
    }
    
    // Apply date filter
    if (filterType !== 'all') {
        filteredTrainers = filterByDate(filteredTrainers, filterType, 'trainers', 'joinDate');
    }
    
    // Render filtered trainers
    renderFilteredTrainers(filteredTrainers);
    
    // Update count
    updateTrainerFilterCount(filteredTrainers.length, trainers.length, searchQuery);
}

// Render filtered trainers
function renderFilteredTrainers(filteredTrainers) {
    const tbody = document.getElementById('trainersTableBody');
    
    if (filteredTrainers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-search" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                    No trainers found matching your filters.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredTrainers.map(t => `
        <tr>
            <td data-label="ID">${t.id}</td>
            <td data-label="Name">${t.name}</td>
            <td data-label="Specialty">${t.specialty}</td>
            <td data-label="Status"><span class="status-badge status-${t.status.toLowerCase()}">${t.status}</span></td>
            <td data-label="Salary">$${t.salary.toLocaleString()}</td>
            <td data-label="Join Date">${formatDate(t.joinDate)}</td>
            <td data-label="Actions">
                <button class="btn-edit" onclick="editTrainer('${t.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteTrainer('${t.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Update trainer filter count
function updateTrainerFilterCount(filtered, total, searchQuery) {
    const countElement = document.getElementById('trainersFilterCount');
    if (!countElement) return;
    
    let message = `Showing ${filtered} of ${total} trainer${total !== 1 ? 's' : ''}`;
    
    if (searchQuery) {
        message += ` matching "${searchQuery}"`;
    }
    
    countElement.textContent = message;
    
    if (filtered === total) {
        countElement.style.color = 'var(--text-secondary)';
    } else {
        countElement.style.color = 'var(--secondary-color)';
    }
}

// Reset trainer filters
function resetTrainerFilters() {
    document.getElementById('trainersSearch').value = '';
    document.getElementById('trainersFilterType').value = 'all';
    document.getElementById('trainersYearFilter').value = 'all';
    document.getElementById('trainersMonthFilter').value = 'all';
    document.getElementById('trainersDateFilter').value = '';
    
    document.getElementById('trainersYearFilter').style.display = 'none';
    document.getElementById('trainersMonthFilter').style.display = 'none';
    document.getElementById('trainersDateFilter').style.display = 'none';
    
    applyTrainerFilters();
}

// ============= TRAINER SALARY FUNCTIONS =============


let currentTrainerForSalary = null;

// Load trainer salary data from server
async function loadTrainerSalaryData() {
    try {
        const response = await fetch('/api/trainer-salaries');  // Make sure it's NOT trainer-salaries1
        const result = await response.json();
        if (result.success) {
            trainerSalaryPayments = result.data;
            console.log('Loaded trainer salary payments:', trainerSalaryPayments.length);
        }
    } catch (error) {
        console.error('Error loading trainer salary data:', error);
    }
}

// Show trainer salary section
function showTrainerSalarySection() {
    switchSection('trainer-salary');
    renderTrainerSalarySection();
}

// Render trainer salary section
function renderTrainerSalarySection() {
    const activeTrainers = trainers.filter(t => t.status === 'Active');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate stats
    const totalSalary = activeTrainers.reduce((sum, t) => sum + (t.salary || 0), 0);
    
    const paidThisMonth = trainerSalaryPayments
        .filter(p => {
            const paymentDate = new Date(p.paymentDate);
            return p.status === 'Paid' && 
                   paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);
    
    const unpaidSalary = totalSalary - paidThisMonth;
    
    // Update stats
    document.getElementById('totalTrainerSalary').textContent = formatCurrency(totalSalary);
document.getElementById('paidTrainerSalary').textContent = formatCurrency(paidThisMonth);
document.getElementById('unpaidTrainerSalary').textContent = formatCurrency(unpaidSalary);
    
    // Render table
    renderTrainerSalaryTable();
}

// Render trainer salary table
function renderTrainerSalaryTable() {
    const tbody = document.getElementById('trainerSalaryTableBody');
    const activeTrainers = trainers.filter(t => t.status === 'Active');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    if (activeTrainers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No active trainers found.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = activeTrainers.map(trainer => {
        // Check if salary paid this month
        const salaryPayment = trainerSalaryPayments.find(p => {
            const paymentDate = new Date(p.paymentDate);
            return p.trainerId === trainer.id && 
                   paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear &&
                   p.status === 'Paid';
        });
        
        const isPaid = !!salaryPayment;
        const paymentDate = salaryPayment ? formatDate(salaryPayment.paymentDate) : '—';
        const status = isPaid ? 'Paid' : 'Unpaid';
        const statusClass = isPaid ? 'paid' : 'due';
        
        return `
            <tr>
                <td data-label="ID">${trainer.id}</td>
                <td data-label="Trainer Name">${trainer.name}</td>
                <td data-label="Specialty">${trainer.specialty}</td>
                <td data-label="Monthly Salary">${formatCurrency(trainer.salary)}</td>
                <td data-label="Payment Date">${paymentDate}</td>
                <td data-label="Status">
                    <span class="status-badge status-${statusClass}">${status}</span>
                </td>
                <td data-label="Actions">
    ${!isPaid ? `
        <button class="btn-edit" onclick="paySalary('${trainer.id}')">
            <i class="fas fa-dollar-sign"></i> Pay Salary
        </button>
    ` : `
        <button class="btn-edit" disabled style="opacity: 0.5; cursor: not-allowed;">
            <i class="fas fa-check"></i> Paid
        </button>
    `}
    <button class="btn-view-payments" onclick="viewTrainerSalaryHistory('${trainer.id}')">
        <i class="fas fa-history"></i> View History
    </button>
</td>
            </tr>
        `;
    }).join('');
}

// Pay salary to trainer - FIXED TIME SAVING
async function paySalary(trainerId) {
    const trainer = trainers.find(t => t.id === trainerId);
    
    if (!trainer) {
        showToast('Trainer not found', 'error');
        return;
    }
    
    if (!confirm(`Pay salary of ${formatCurrency(trainer.salary)} to ${trainer.name}?`)) {
        return;
    }
    
    try {
        showToast('Processing salary payment...', 'info');
        
        // Get current time
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        });
        
        const salaryData = {
            trainerId: trainer.id,
            trainerName: trainer.name,
            amount: trainer.salary,
            status: 'Paid',
            paymentDate: new Date().toISOString().split('T')[0],
            time: currentTime
        };
        
        console.log('Sending salary data:', salaryData); // Debug log
        
        const response = await fetch('/api/trainer-salaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salaryData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadDataFromServer();
            renderTrainerSalarySection();
            updateDashboard();
            showToast('Salary paid successfully', 'success');
        } else {
            showToast('Failed to pay salary', 'error');
        }
    } catch (error) {
        console.error('Error paying salary:', error);
        showToast('Error processing payment', 'error');
    }
}

// View trainer salary history - FIXED
function viewTrainerSalaryHistory(trainerId) {
    // Keep trainerId as string, don't parse it
    currentTrainerForSalary = trainerId;
    const trainer = trainers.find(t => t.id === trainerId);
    
    if (!trainer) {
        showToast('Trainer not found', 'error');
        return;
    }
    
    // Update modal title and info
    document.getElementById('trainerSalaryHistoryTitle').textContent = `Salary History - ${trainer.name}`;
    document.getElementById('trainerSalaryHistoryInfo').innerHTML = `
        <strong>Specialty:</strong> ${trainer.specialty} | 
        <strong>Monthly Salary:</strong> ${formatCurrency(trainer.salary)} | 
        <strong>Status:</strong> ${trainer.status}
    `;
    
    // Get all salary payments for this trainer
    const salaryHistory = trainerSalaryPayments.filter(p => p.trainerId === trainerId);
    
    // Render salary history
    renderTrainerSalaryHistory(salaryHistory);
    
    // Show modal
    document.getElementById('trainerSalaryHistoryModal').classList.add('show');
}

// Render trainer salary history - WITH TIME
function renderTrainerSalaryHistory(salaryHistory) {
    const tbody = document.getElementById('trainerSalaryHistoryTableBody');
    
    if (salaryHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No salary payment records found.
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedPayments = [...salaryHistory].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    
    tbody.innerHTML = sortedPayments.map(payment => {
        const statusClass = payment.status.toLowerCase();
        const rowClass = `payment-record-row ${statusClass}-record`;
        const isPaid = payment.status === 'Paid';
        
        return `
            <tr class="${rowClass}">
                <td data-label="ID">${payment.trainerId}</td>
                <td data-label="Amount">${formatCurrency(payment.amount)}</td>
                <td data-label="Status">
                    <span class="status-badge status-${statusClass}">${payment.status}</span>
                </td>
                <td data-label="Payment Date">${formatDate(payment.paymentDate)}</td>
                <td data-label="Time">${payment.time || 'N/A'}</td>
                <td data-label="Actions">
                    <button class="btn-mark-paid" onclick="markSalaryAsPaid(${payment.id})" ${isPaid ? 'disabled' : ''}>
                        <i class="fas fa-check-circle"></i> ${isPaid ? 'Paid' : 'Mark as Paid'}
                    </button>
                    <button class="btn-delete" onclick="deleteSalaryPayment(${payment.id})" style="margin-left: 0.5rem;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}
// Add new salary payment
function addNewSalaryPayment() {
    if (!currentTrainerForSalary) {
        showToast('No trainer selected', 'error');
        return;
    }
    
    const trainer = trainers.find(t => t.id === currentTrainerForSalary);
    
    if (!trainer) {
        showToast('Trainer not found', 'error');
        return;
    }
    
    paySalary(currentTrainerForSalary);
    closeModal('trainerSalaryHistoryModal');
}

// Mark salary as paid - WITH TIME
async function markSalaryAsPaid(paymentId) {
    if (!confirm('Mark this salary payment as Paid?')) return;
    
    try {
        showToast('Updating payment status...', 'info');
        
        const payment = trainerSalaryPayments.find(p => p.id === paymentId);
        
        if (!payment) {
            showToast('Payment not found', 'error');
            return;
        }
        
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        });
        
        const response = await fetch(`/api/trainer-salaries/${paymentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ...payment, 
                status: 'Paid',
                time: currentTime
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadDataFromServer();
            viewTrainerSalaryHistory(currentTrainerForSalary);
            renderTrainerSalarySection();
            updateDashboard();
            showToast('Payment marked as Paid', 'success');
        } else {
            showToast('Failed to update payment', 'error');
        }
    } catch (error) {
        console.error('Error updating payment:', error);
        showToast('Error updating payment', 'error');
    }
}

// Delete salary payment
async function deleteSalaryPayment(paymentId) {
    if (!confirm('Are you sure you want to delete this salary payment record?')) return;
    
    try {
        showToast('Deleting payment record...', 'info');
        
        const response = await fetch(`/api/trainer-salaries/${paymentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
    await loadDataFromServer();
    viewTrainerSalaryHistory(currentTrainerForSalary);
    renderTrainerSalarySection(); // ⬅️ ADD THIS
    updateDashboard();
    showToast('Payment record deleted', 'success');
        } else {
            showToast('Failed to delete payment', 'error');
        }
    } catch (error) {
        console.error('Error deleting payment:', error);
        showToast('Error deleting payment', 'error');
    }
}

// Reset trainer salary filters
function resetTrainerSalaryFilters() {
    document.getElementById('trainerSalaryFilterType').value = 'all';
    document.getElementById('trainerSalaryYearFilter').value = 'all';
    document.getElementById('trainerSalaryMonthFilter').value = 'all';
    
    document.getElementById('trainerSalaryYearFilter').style.display = 'none';
    document.getElementById('trainerSalaryMonthFilter').style.display = 'none';
    
    renderTrainerSalarySection();
}

// ============= REPORTS FUNCTIONS =============

function showReportsModal() {
    document.getElementById('reportsModal').classList.add('show');
    switchReportTab('summary');
}

function switchReportTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.report-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Generate report content
    const reportContent = document.getElementById('reportContent');
    
    switch(tabName) {
        case 'summary':
            reportContent.innerHTML = generateSummaryReport();
            break;
        case 'revenue':
            reportContent.innerHTML = generateRevenueReport();
            break;
        case 'members':
            reportContent.innerHTML = generateMembersReport();
            break;
        case 'trainers':
            reportContent.innerHTML = generateTrainersReport();
            break;
    }
}

function generateSummaryReport() {
    const totalRevenue = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const totalMembers = members.filter(m => m.status === 'Active').length;
    const premiumMembers = members.filter(m => m.type === 'Premium' && m.status === 'Active').length;
    const activeTrainers = trainers.filter(t => t.status === 'Active').length;
    const trainerSalaries = trainerSalaryPayments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0);
    const equipmentExpenses = equipment.reduce((sum, e) => sum + (e.cost * e.quantity), 0);
    const totalExpenses = trainerSalaries + equipmentExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const duePayments = payments.filter(p => p.status === 'Due').length;
    
    return `
        <div class="report-summary">
            <div class="report-card">
                <h4>Total Revenue</h4>
                <div class="value" style="color: #28a745;">${formatCurrency(totalRevenue)}</div>
            </div>
            <div class="report-card">
                <h4>Total Members</h4>
                <div class="value">${totalMembers}</div>
            </div>
            <div class="report-card">
                <h4>Premium Members</h4>
                <div class="value" style="color: #ffa726;">${premiumMembers}</div>
            </div>
            <div class="report-card">
                <h4>Active Trainers</h4>
                <div class="value">${activeTrainers}</div>
            </div>
            <div class="report-card">
                <h4>Trainer Salaries</h4>
                <div class="value" style="color: #dc3545;">${formatCurrency(trainerSalaries)}</div>
            </div>
            <div class="report-card">
                <h4>Net Profit</h4>
                <div class="value" style="color: ${netProfit >= 0 ? '#28a745' : '#dc3545'};">${formatCurrency(netProfit)}</div>
            </div>
            <div class="report-card">
                <h4>Due Payments</h4>
                <div class="value" style="color: #dc3545;">${duePayments}</div>
            </div>
        </div>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Financial Overview</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Income</td>
                    <td style="color: #28a745; font-weight: 600;">${formatCurrency(totalRevenue)}</td>
                </tr>
                <tr>
                    <td>Total Expenses (Salaries + Equipment)</td>
                    <td style="color: #dc3545; font-weight: 600;">${formatCurrency(totalExpenses)}</td>
                </tr>
                <tr style="background: var(--light-bg);">
                    <td><strong>Net Profit</strong></td>
                    <td style="font-weight: 700; font-size: 1.2rem; color: ${netProfit >= 0 ? '#28a745' : '#dc3545'};">${formatCurrency(netProfit)}</td>
                </tr>
            </tbody>
        </table>
    `;
}

function generateRevenueReport() {
    const paidPayments = payments.filter(p => p.status === 'Paid');
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const averagePayment = paidPayments.length > 0 ? (totalRevenue / paidPayments.length).toFixed(2) : 0;
    
    // Group by month
    const revenueByMonth = {};
    paidPayments.forEach(p => {
        const month = new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        revenueByMonth[month] = (revenueByMonth[month] || 0) + p.amount;
    });
    
    return `
        <div class="report-summary">
            <div class="report-card">
                <h4>Total Revenue</h4>
                <div class="value" style="color: #28a745;">$${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="report-card">
                <h4>Total Payments</h4>
                <div class="value">${paidPayments.length}</div>
            </div>
            <div class="report-card">
                <h4>Average Payment</h4>
                <div class="value">$${parseFloat(averagePayment).toLocaleString()}</div>
            </div>
        </div>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Revenue by Month</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Revenue</th>
                    <th>Payments</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(revenueByMonth).map(month => {
                    const count = paidPayments.filter(p => 
                        new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) === month
                    ).length;
                    return `
                        <tr>
                            <td>${month}</td>
                            <td style="color: #28a745; font-weight: 600;">$${revenueByMonth[month].toLocaleString()}</td>
                            <td>${count}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function generateAttendanceReport() {
    const totalRecords = attendance.length;
    const morningShift = attendance.filter(a => a.shift === 'Morning').length;
    const eveningShift = attendance.filter(a => a.shift === 'Evening').length;
    const nightShift = attendance.filter(a => a.shift === 'Night').length;
    
    // Group by member
    const memberAttendance = {};
    attendance.forEach(a => {
        if (!memberAttendance[a.memberId]) {
            memberAttendance[a.memberId] = {
                name: a.memberName,
                count: 0
            };
        }
        memberAttendance[a.memberId].count++;
    });
    
    // Sort by attendance count
    const sortedMembers = Object.values(memberAttendance)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10
    
    return `
        <div class="report-summary">
            <div class="report-card">
                <h4>Total Records</h4>
                <div class="value">${totalRecords}</div>
            </div>
            <div class="report-card">
                <h4>Morning Shift</h4>
                <div class="value" style="color: #ffa726;">${morningShift}</div>
            </div>
            <div class="report-card">
                <h4>Evening Shift</h4>
                <div class="value" style="color: #3498DB;">${eveningShift}</div>
            </div>
            <div class="report-card">
                <h4>Night Shift</h4>
                <div class="value" style="color: #e74c3c;">${nightShift}</div>
            </div>
        </div>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Top 10 Most Active Members</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Member Name</th>
                    <th>Total Visits</th>
                </tr>
            </thead>
            <tbody>
                ${sortedMembers.map((member, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${member.name}</td>
                        <td style="font-weight: 600;">${member.count}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Recent Attendance</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Member Name</th>
                    <th>Shift</th>
                    <th>Date</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody>
                ${attendance.slice(0, 20).map(a => `
                    <tr>
                        <td>${a.memberName}</td>
                        <td><span class="status-badge status-${a.shift.toLowerCase()}">${a.shift}</span></td>
                        <td>${formatDate(a.date)}</td>
                        <td>${a.time}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generateAllReports() {
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    return `
        <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 3px solid var(--primary-color);">
            <h1 style="color: var(--primary-color); margin: 0;">DENIM GYM</h1>
            <h2 style="color: var(--text-secondary); margin: 0.5rem 0;">Complete Business Report</h2>
            <p style="color: var(--text-secondary);">Generated on ${currentDate}</p>
        </div>
        
        <!-- SUMMARY SECTION -->
        <div style="page-break-after: always;">
            <h2 style="color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                <i class="fas fa-chart-pie"></i> EXECUTIVE SUMMARY
            </h2>
            ${generateSummaryReport()}
        </div>
        
        <!-- REVENUE SECTION -->
        <div style="page-break-after: always;">
            <h2 style="color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                <i class="fas fa-dollar-sign"></i> REVENUE ANALYSIS
            </h2>
            ${generateRevenueReport()}
        </div>
        
        <!-- MEMBERS SECTION -->
        <div style="page-break-after: always;">
            <h2 style="color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                <i class="fas fa-users"></i> MEMBERS OVERVIEW
            </h2>
            ${generateMembersReport()}
        </div>
        
        <!-- TRAINERS SECTION -->
        <div style="page-break-after: always;">
            <h2 style="color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                <i class="fas fa-user-tie"></i> TRAINERS OVERVIEW
            </h2>
            ${generateTrainersReport()}
        </div>
        
        <!-- TRAINER SALARY SECTION (NEW) -->
        <div style="page-break-after: always;">
            <h2 style="color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                <i class="fas fa-money-check-alt"></i> TRAINER SALARY REPORT
            </h2>
            ${generateTrainerSalaryReport()}
        </div>
        
        <!-- MEMBER ATTENDANCE SECTION -->
        <div style="page-break-after: always;">
            <h2 style="color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                <i class="fas fa-clipboard-check"></i> MEMBER ATTENDANCE ANALYSIS
            </h2>
            ${generateAttendanceReport()}
        </div>
        
        <!-- TRAINER ATTENDANCE SECTION (NEW) -->
        <div>
            <h2 style="color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                <i class="fas fa-user-clock"></i> TRAINER ATTENDANCE REPORT
            </h2>
            ${generateTrainerAttendanceReport()}
        </div>
        
        <!-- FOOTER -->
        <div style="margin-top: 3rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color); text-align: center; color: var(--text-secondary);">
            <p><strong>End of Report</strong></p>
            <p style="font-size: 0.9rem;">This report contains confidential business information</p>
            <p style="font-size: 0.85rem;">Generated by Denim Gym Management System v2.0</p>
        </div>
    `;
}
function generateMembersReport() {
    const activeMembers = members.filter(m => m.status === 'Active');
    const premiumMembers = activeMembers.filter(m => m.type === 'Premium');
    const regularMembers = activeMembers.filter(m => m.type === 'Regular');
    const suspendedMembers = members.filter(m => m.status === 'Suspended');
    
    return `
        <div class="report-summary">
            <div class="report-card">
                <h4>Total Active</h4>
                <div class="value">${activeMembers.length}</div>
            </div>
            <div class="report-card">
                <h4>Premium</h4>
                <div class="value" style="color: #ffa726;">${premiumMembers.length}</div>
            </div>
            <div class="report-card">
                <h4>Regular</h4>
                <div class="value" style="color: #3498DB;">${regularMembers.length}</div>
            </div>
            <div class="report-card">
                <h4>Suspended</h4>
                <div class="value" style="color: #dc3545;">${suspendedMembers.length}</div>
            </div>
        </div>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Member List</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Join Date</th>
                </tr>
            </thead>
            <tbody>
                ${activeMembers.map(m => `
                    <tr>
                        <td>${m.id}</td>
                        <td>${m.name}</td>
                        <td><span class="status-badge status-${m.type.toLowerCase()}">${m.type}</span></td>
                        <td><span class="status-badge status-${m.status.toLowerCase()}">${m.status}</span></td>
                        <td>${formatDate(m.joinDate)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generateTrainersReport() {
    const activeTrainers = trainers.filter(t => t.status === 'Active');
    const totalSalaries = activeTrainers.reduce((sum, t) => sum + (t.salary || 0), 0);
    const averageSalary = activeTrainers.length > 0 ? (totalSalaries / activeTrainers.length).toFixed(2) : 0;
    
    return `
        <div class="report-summary">
            <div class="report-card">
                <h4>Active Trainers</h4>
                <div class="value">${activeTrainers.length}</div>
            </div>
            <div class="report-card">
                <h4>Total Salaries</h4>
                <div class="value" style="color: #dc3545;">$${totalSalaries.toLocaleString()}</div>
            </div>
            <div class="report-card">
                <h4>Average Salary</h4>
                <div class="value">$${parseFloat(averageSalary).toLocaleString()}</div>
            </div>
        </div>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Trainer Details</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Specialty</th>
                    <th>Salary</th>
                    <th>Join Date</th>
                </tr>
            </thead>
            <tbody>
                ${activeTrainers.map(t => `
                    <tr>
                        <td>${t.id}</td>
                        <td>${t.name}</td>
                        <td>${t.specialty}</td>
                        <td style="font-weight: 600;">$${t.salary.toLocaleString()}</td>
                        <td>${formatDate(t.joinDate)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function printReport() {
    window.print();
}

// ============= RECEIPT FUNCTIONS =============

function showReceiptModal() {
    const modal = document.getElementById('receiptModal');
    const memberSelect = document.getElementById('receiptMember');
    
    // Populate member dropdown
    memberSelect.innerHTML = '<option value="">Select Member</option>' +
        members.map(m => `<option value="${m.id}">${m.name} (${m.type})</option>`).join('');
    
    // Reset form
    document.getElementById('receiptForm').reset();
    document.getElementById('receiptMemberType').value = '';
    
    modal.classList.add('show');
}

function updateReceiptDetails() {
    const memberId = document.getElementById('receiptMember').value;
    const member = members.find(m => m.id === memberId);
    
    if (member) {
        document.getElementById('receiptMemberType').value = member.type;
        document.getElementById('receiptAmount').value = member.amount || 100;
    }
}

async function generateReceipt() {
    const memberId = document.getElementById('receiptMember').value;
    const member = members.find(m => m.id === memberId);
    
    if (!member) {
        showToast('Please select a member', 'error');
        return;
    }
    
    const amount = inputToINR(document.getElementById('receiptAmount').value);
    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    const paymentMethod = document.getElementById('receiptPaymentMethod').value;
    const description = document.getElementById('receiptDescription').value || 'Membership Fee';
    
    const receiptNumber = 'RCP' + Date.now();
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const formattedTime = currentDate.toLocaleTimeString('en-US');
    
    const receiptHTML = `
        <div class="receipt-content">
            <div class="receipt-header">
                <h2>DENIM GYM</h2>
                <p>Payment Receipt</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Receipt #: ${receiptNumber}</p>
            </div>
            
            <div style="margin: 1.5rem 0;">
                <div class="receipt-row">
                    <span>Date:</span>
                    <strong>${formattedDate}</strong>
                </div>
                <div class="receipt-row">
                    <span>Time:</span>
                    <strong>${formattedTime}</strong>
                </div>
            </div>
            
            <div style="margin: 1.5rem 0;">
                <h3 style="border-bottom: 2px solid #000; padding-bottom: 0.5rem;">Customer Details</h3>
                <div class="receipt-row">
                    <span>Name:</span>
                    <strong>${member.name}</strong>
                </div>
                <div class="receipt-row">
                    <span>Member ID:</span>
                    <strong>${member.id}</strong>
                </div>
                <div class="receipt-row">
                    <span>Member Type:</span>
                    <strong>${member.type}</strong>
                </div>
                <div class="receipt-row">
                    <span>Phone:</span>
                    <strong>${member.phone}</strong>
                </div>
            </div>
            
            <div style="margin: 1.5rem 0;">
                <h3 style="border-bottom: 2px solid #000; padding-bottom: 0.5rem;">Payment Details</h3>
                <div class="receipt-row">
                    <span>Description:</span>
                    <strong>${description}</strong>
                </div>
                <div class="receipt-row">
                    <span>Payment Method:</span>
                    <strong>${paymentMethod}</strong>
                </div>
                <div class="receipt-row total">
                        <span>TOTAL AMOUNT:</span>
                        <strong class="receipt-amount-display">${formatCurrency(amount)}</strong>
                    </div>
            </div>
            
            <div class="receipt-footer">
                <p>Thank you for your payment!</p>
                <p>For any queries, please contact us at: contact@denimgym.com</p>
                <p style="margin-top: 1rem; font-size: 0.85rem;">This is a computer-generated receipt.</p>
            </div>
        </div>
    `;
    
    // Save receipt to database
    try {
        const receiptData = {
            receiptNumber: receiptNumber,
            memberId: memberId,
            memberName: member.name,
            memberType: member.type,
            amount: amount,
            paymentMethod: paymentMethod,
            description: description,
            date: currentDate.toISOString().split('T')[0],
            time: formattedTime,
            htmlContent: receiptHTML
        };
        
        const response = await fetch('/api/receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receiptData)
        });
        
       const result = await response.json();
if (result.success) {
    await loadDataFromServer();
    renderReceipts();  // ⬅️ ADD THIS LINE - updates the receipts table immediately!
    showToast('Receipt generated and saved successfully', 'success');
}
    } catch (error) {
        console.error('Error saving receipt:', error);
        showToast('Receipt generated but failed to save', 'warning');
    }
    
    document.getElementById('receiptContent').innerHTML = receiptHTML;
    closeModal('receiptModal');
    document.getElementById('receiptPrintView').classList.add('show');
}

function printReceipt() {
    const printWindow = window.open('', '_blank');
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Receipt</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Courier New', monospace; 
                    padding: 20px; 
                    line-height: 1.6;
                }
                .receipt-content { max-width: 800px; margin: 0 auto; }
                .receipt-header { 
                    text-align: center; 
                    border-bottom: 2px dashed #000; 
                    padding-bottom: 1rem; 
                    margin-bottom: 1rem; 
                }
                .receipt-header h2 { margin: 0; font-size: 1.8rem; }
                .receipt-row { 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 0.5rem 0; 
                    border-bottom: 1px solid #ddd; 
                }
                .receipt-row.total { 
                    border-top: 2px solid #000; 
                    border-bottom: 2px double #000; 
                    font-weight: 700; 
                    font-size: 1.2rem; 
                    margin-top: 1rem; 
                }
                .receipt-footer { 
                    text-align: center; 
                    margin-top: 2rem; 
                    padding-top: 1rem; 
                    border-top: 2px dashed #000; 
                    font-style: italic; 
                }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${receiptContent}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 100);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Render receipts table
function renderReceipts() {
    const tbody = document.getElementById('receiptsTableBody');
    
    if (receipts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No receipts found. Click "Create New Receipt" to generate one.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = receipts.map(r => `
        <tr>
            <td data-label="Receipt #">${r.receiptNumber}</td>
            <td data-label="Member Name">${r.memberName}</td>
            <td data-label="Date">${formatDate(r.date)}</td>
            <td data-label="Amount">${formatCurrency(r.amount)}</td>
            <td data-label="Payment Method">${r.paymentMethod}</td>
            <td data-label="Actions">
                <button class="btn-edit" onclick="viewReceipt(${r.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn-secondary" onclick="printSavedReceipt(${r.id})">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn-delete" onclick="deleteReceipt(${r.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// View saved receipt
function viewReceipt(receiptId) {
    const receipt = receipts.find(r => r.id === receiptId);
    if (receipt) {
        document.getElementById('receiptContent').innerHTML = receipt.htmlContent;
        document.getElementById('receiptPrintView').classList.add('show');
    }
}

// Print saved receipt
function printSavedReceipt(receiptId) {
    const receipt = receipts.find(r => r.id === receiptId);
    if (receipt) {
        document.getElementById('receiptContent').innerHTML = receipt.htmlContent;
        printReceipt();
    }
}

// Delete receipt
async function deleteReceipt(receiptId) {
    if (!confirm('Are you sure you want to delete this receipt?')) return;
    
    try {
        const response = await fetch(`/api/receipts/${receiptId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderReceipts();
            showToast('Receipt deleted successfully', 'success');
        } else {
            showToast('Failed to delete receipt', 'error');
        }
    } catch (error) {
        console.error('Error deleting receipt:', error);
        showToast('Error deleting receipt', 'error');
    }
}

// ============= REPORTS WITH HISTORY =============
let currentReportForView = null;

// Show generate report modal
function showGenerateReportModal() {
    document.getElementById('generateReportModal').classList.add('show');
}

// Generate new report and save it
async function generateNewReport() {
    const reportType = document.getElementById('reportType').value;
    
    try {
        showToast('Generating report...', 'info');
        
        let reportContent = '';
        let reportTitle = '';
        
        switch(reportType) {
            case 'all':
                reportContent = generateAllReports();
                reportTitle = 'Complete Business Report';
                break;
            case 'summary':
                reportContent = generateSummaryReport();
                reportTitle = 'Summary Report';
                break;
            case 'revenue':
                reportContent = generateRevenueReport();
                reportTitle = 'Revenue Report';
                break;
            case 'members':
                reportContent = generateMembersReport();
                reportTitle = 'Members Report';
                break;
            case 'trainers':
                reportContent = generateTrainersReport();
                reportTitle = 'Trainers Report';
                break;
            case 'trainer-attendance': // NEW
                reportContent = generateTrainerAttendanceReport();
                reportTitle = 'Trainer Attendance Report';
                break;
            case 'trainer-salary': // NEW
                reportContent = generateTrainerSalaryReport();
                reportTitle = 'Trainer Salary Report';
                break;
            case 'attendance':
                reportContent = generateAttendanceReport();
                reportTitle = 'Member Attendance Report';
                break;
        }
        
        const reportData = {
            reportType: reportType,
            reportTitle: reportTitle,
            htmlContent: reportContent,
            generatedDate: new Date().toISOString().split('T')[0]
        };
        
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
        });
        
        const result = await response.json();
        if (result.success) {
            await loadReportsFromServer();
            renderReports();
            closeModal('generateReportModal');
            showToast('Report generated and saved successfully', 'success');
        } else {
            showToast('Failed to save report', 'error');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Error generating report', 'error');
    }
}

// Load reports from server
async function loadReportsFromServer() {
    try {
        const response = await fetch('/api/reports');  // ⬅️ MAKE SURE IT'S /api/reports NOT /api/reports1
        const result = await response.json();
        if (result.success) {
            reports = result.data;
            console.log('Loaded reports:', reports.length);
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Render reports table
function renderReports() {
    const tbody = document.getElementById('reportsTableBody');
    
    if (reports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No reports found. Click "Generate New Report" to create one.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = reports.map(r => `
        <tr>
            <td data-label="Report Type">${r.reportTitle}</td>
            <td data-label="Generated Date">${formatDate(r.generatedDate)}</td>
            <td data-label="Date & Time">${formatDateTime(r.createdAt)}</td>
            <td data-label="Actions">
                <button class="btn-edit" onclick="viewReport(${r.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn-secondary" onclick="printReportById(${r.id})">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn-delete" onclick="deleteReport(${r.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// View saved report
function viewReport(reportId) {
    const report = reports.find(r => r.id === reportId);
    if (report) {
        currentReportForView = report;
        document.getElementById('reportViewTitle').innerHTML = `<i class="fas fa-chart-bar"></i> ${report.reportTitle}`;
        document.getElementById('reportViewContent').innerHTML = report.htmlContent;
        document.getElementById('reportViewModal').classList.add('show');
    }
}

// Print report by ID
function printReportById(reportId) {
    const report = reports.find(r => r.id === reportId);
    if (report) {
        currentReportForView = report;
        printSavedReport();
    }
}

// Print saved report with proper formatting
function printSavedReport() {
    if (!currentReportForView) {
        showToast('No report selected', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const reportContent = currentReportForView.htmlContent;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Report - ${currentReportForView.reportTitle}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    padding: 20px; 
                    line-height: 1.6;
                    color: #2C3E50;
                }
                h3 { 
                    color: #2C3E50; 
                    margin-top: 2rem; 
                    margin-bottom: 1rem; 
                    font-size: 1.2rem;
                }
                .report-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .report-card {
                    background: #ECF0F1;
                    padding: 1.5rem;
                    border-radius: 8px;
                    border-left: 4px solid #3498DB;
                }
                .report-card h4 {
                    color: #7F8C8D;
                    font-size: 0.85rem;
                    margin-bottom: 0.5rem;
                }
                .report-card .value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #2C3E50;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                .data-table thead {
                    background: #2C3E50;
                    color: white;
                }
                .data-table th {
                    padding: 1rem;
                    text-align: left;
                    font-weight: 600;
                }
                .data-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #ECF0F1;
                }
                .data-table tbody tr:hover {
                    background: #ECF0F1;
                }
                .status-badge {
                    padding: 0.4rem 0.8rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: inline-block;
                }
                .status-active { background: #d4edda; color: #155724; }
                .status-premium { background: #fff3cd; color: #856404; }
                .status-regular { background: #e3f2fd; color: #1976d2; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1 style="text-align: center; margin-bottom: 2rem; color: #2C3E50;">${currentReportForView.reportTitle}</h1>
            <p style="text-align: center; color: #7F8C8D; margin-bottom: 2rem;">Generated on ${formatDate(currentReportForView.generatedDate)}</p>
            ${reportContent}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 100);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Delete report
async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
        const response = await fetch(`/api/reports/${reportId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            await loadReportsFromServer();
            renderReports();
            showToast('Report deleted successfully', 'success');
        } else {
            showToast('Failed to delete report', 'error');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        showToast('Error deleting report', 'error');
    }
}

// ============= EQUIPMENT MANAGEMENT =============

function renderEquipment() {
    const tbody = document.getElementById('equipmentTableBody');
    
    if (!equipment || equipment.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No equipment found. Click "Add Equipment" to add one.
                </td>
            </tr>
        `;
        updateEquipmentStats();
        return;
    }
    
    tbody.innerHTML = equipment.map(e => `
        <tr>
            <td data-label="Name">${e.name}</td>
            <td data-label="Category">${e.category}</td>
            <td data-label="Quantity">${e.quantity}</td>
            <td data-label="Total Cost">${formatCurrency(e.cost * e.quantity)}</td>
            <td data-label="Status">
                <span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span>
            </td>
            <td data-label="Purchase Date">${formatDate(e.purchaseDate)}</td>
            <td data-label="Actions">
                <button class="btn-edit" onclick="editEquipment(${e.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteEquipment(${e.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
    
    updateEquipmentStats();
}
function updateEquipmentStats() {
    const total = equipment.length;
    const broken = equipment.filter(e => e.status === 'Broken' || e.status === 'Missing').length;
    const totalExpenses = equipment.reduce((sum, e) => sum + (e.cost * e.quantity), 0);
    
    document.getElementById('totalEquipment').textContent = total;
    document.getElementById('brokenEquipment').textContent = broken;
    document.getElementById('equipmentExpenses').textContent = formatCurrency(totalExpenses);
}

function showEquipmentModal(id = null) {
    const modal = document.getElementById('equipmentModal');
    const form = document.getElementById('equipmentForm');
    const title = document.getElementById('equipmentModalTitle');
    
    if (id) {
        const item = equipment.find(e => e.id === id);
        title.textContent = 'Edit Equipment';
        document.getElementById('equipmentId').value = item.id;
        document.getElementById('equipmentName').value = item.name;
        document.getElementById('equipmentCategory').value = item.category;
        document.getElementById('equipmentQuantity').value = item.quantity;
        document.getElementById('equipmentCost').value = item.cost;
        document.getElementById('equipmentStatus').value = item.status;
        document.getElementById('equipmentPurchaseDate').value = item.purchaseDate;
    } else {
        title.textContent = 'Add Equipment';
        form.reset();
        document.getElementById('equipmentId').value = '';
        document.getElementById('equipmentPurchaseDate').value = new Date().toISOString().split('T')[0];
    }
    
    modal.classList.add('show');
}

function editEquipment(id) {
    showEquipmentModal(id);
}

async function deleteEquipment(id) {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    
    try {
        const response = await fetch(`/api/equipment/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderEquipment();
            updateDashboard();
            showToast('Equipment deleted successfully', 'success');
        } else {
            showToast('Failed to delete equipment', 'error');
        }
    } catch (error) {
        console.error('Error deleting equipment:', error);
        showToast('Error deleting equipment', 'error');
    }
}

document.getElementById('equipmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('equipmentId').value;
    const equipmentData = {
        name: document.getElementById('equipmentName').value,
        category: document.getElementById('equipmentCategory').value,
        quantity: parseInt(document.getElementById('equipmentQuantity').value),
        cost: parseFloat(document.getElementById('equipmentCost').value),
        status: document.getElementById('equipmentStatus').value,
        purchaseDate: document.getElementById('equipmentPurchaseDate').value
    };
    
    console.log('=== SUBMITTING EQUIPMENT ===');
    console.log('Equipment data:', equipmentData);
    console.log('Equipment array BEFORE save:', equipment.length);
    
    try {
        let response;
        if (id) {
            console.log('Updating equipment ID:', id);
            response = await fetch(`/api/equipment/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(equipmentData)
            });
        } else {
            console.log('Creating NEW equipment');
            response = await fetch('/api/equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(equipmentData)
            });
        }
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Server response:', result);
        
        if (result.success) {
            console.log('✓ Server confirmed success');
            console.log('Equipment array BEFORE loadDataFromServer:', equipment.length);
            
            // Reload all data from server
            await loadDataFromServer();
            
            console.log('Equipment array AFTER loadDataFromServer:', equipment.length);
            console.log('Equipment contents:', equipment);
            
            // Update the equipment display
            renderEquipment();
            
            // Update dashboard stats
            updateDashboard();
            
            // Close the modal
            closeModal('equipmentModal');
            
            // Show success message
            showToast(id ? 'Equipment updated successfully' : 'Equipment added successfully', 'success');
        } else {
            console.error('❌ Server returned success:false');
            showToast('Failed to save equipment: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('❌ Error saving equipment:', error);
        showToast('Error saving equipment: ' + error.message, 'error');
    }
});

function applyEquipmentFilters() {
    const categoryFilter = document.getElementById('equipmentCategoryFilter').value;
    const statusFilter = document.getElementById('equipmentStatusFilter').value;
    
    let filtered = [...equipment];
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(e => e.category === categoryFilter);
    }
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(e => e.status === statusFilter);
    }
    
    renderFilteredEquipment(filtered);
}

function renderFilteredEquipment(filtered) {
    const tbody = document.getElementById('equipmentTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No equipment found matching your filters.
                </td>
            </tr>
        `;
        document.getElementById('equipmentFilterCount').textContent = `Showing 0 of ${equipment.length} equipment`;
        return;
    }
    
    tbody.innerHTML = filtered.map(e => `
        <tr>
            <td data-label="Name">${e.name}</td>
            <td data-label="Category">${e.category}</td>
            <td data-label="Quantity">${e.quantity}</td>
            <td data-label="Total Cost">${formatCurrency(e.cost * e.quantity)}</td>
            <td data-label="Status">
                <span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span>
            </td>
            <td data-label="Purchase Date">${formatDate(e.purchaseDate)}</td>
            <td data-label="Actions">
                <button class="btn-edit" onclick="editEquipment(${e.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteEquipment(${e.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('equipmentFilterCount').textContent = 
        filtered.length === equipment.length 
            ? `Showing all ${equipment.length} equipment` 
            : `Showing ${filtered.length} of ${equipment.length} equipment`;
}

function resetEquipmentFilters() {
    document.getElementById('equipmentCategoryFilter').value = 'all';
    document.getElementById('equipmentStatusFilter').value = 'all';
    renderEquipment();
    document.getElementById('equipmentFilterCount').textContent = `Showing all equipment`;
}

// ============= FIXED ATTENDANCE MANAGEMENT =============

// Render attendance - Show ONLY latest record per member
function renderAttendance() {
    const tbody = document.getElementById('attendanceTableBody');
    
    if (!attendance || attendance.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No attendance records found. Click "Mark Attendance" to add one.
                </td>
            </tr>
        `;
        return;
    }
    
    // Group by member and get ONLY the latest record
    const latestAttendance = {};
    attendance.forEach(a => {
        if (!latestAttendance[a.memberId]) {
            latestAttendance[a.memberId] = a;
        } else {
            // Compare dates and times - keep the newest
            const currentDate = new Date(latestAttendance[a.memberId].date + ' ' + latestAttendance[a.memberId].time);
            const newDate = new Date(a.date + ' ' + a.time);
            
            if (newDate > currentDate) {
                latestAttendance[a.memberId] = a;
            }
        }
    });
    
    // Convert to array for display
    const recordsToShow = Object.values(latestAttendance);
    
    // Count total records for each member
    const recordCounts = {};
    attendance.forEach(a => {
        recordCounts[a.memberId] = (recordCounts[a.memberId] || 0) + 1;
    });
    
    tbody.innerHTML = recordsToShow.map(a => {
        const totalRecords = recordCounts[a.memberId];
        
        return `
            <tr>
                <td data-label="Member ID">${a.memberId}</td>
                <td data-label="Member Name">
                    ${a.memberName}
                    ${totalRecords > 1 ? `<span style="color: var(--secondary-color); font-size: 0.85rem; margin-left: 0.5rem;">(${totalRecords} visits)</span>` : ''}
                </td>
                <td data-label="Latest Shift">
                    <span class="status-badge status-${a.shift.toLowerCase()}">${a.shift}</span>
                </td>
                <td data-label="Latest Time">${a.time}</td>
                <td data-label="Latest Date">${formatDate(a.date)}</td>
                <td data-label="Total Records">${totalRecords}</td>
                <td data-label="Actions">
                    <button class="btn-view-payments" onclick="viewMemberAttendanceHistory('${a.memberId}')" ${totalRecords > 1 ? 'style="background: var(--secondary-color); border-color: var(--secondary-color);"' : ''}>
                        <i class="fas fa-history"></i> View History ${totalRecords > 1 ? `(${totalRecords})` : ''}
                    </button>
                    <button class="btn-secondary" onclick="printMemberAttendance('${a.memberId}')">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="btn-delete" onclick="deleteAttendance(${a.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Show mark attendance modal
async function showMarkAttendanceModal() {
    // ✅ ALWAYS reload fresh data first - THIS IS THE KEY FIX
    await loadDataFromServer();
    
    const modal = document.getElementById('markAttendanceModal');
    const memberSelect = document.getElementById('attendanceMember');
    
    // ✅ NOW populate dropdown with FRESH data including newly added members
    memberSelect.innerHTML = '<option value="">Choose a member...</option>' +
        members.filter(m => m.status === 'Active').map(m => 
            `<option value="${m.id}">${m.name} (ID: ${m.id})</option>`
        ).join('');
    
    // Reset form
    document.getElementById('attendanceForm').reset();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;
    
    // Show modal
    modal.classList.add('show');
}

// Handle attendance form submission
document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // ✅ FIX: Don't parse to integer, keep as string (IDs are TEXT like "M04")
    const memberId = document.getElementById('attendanceMember').value;
    const shift = document.getElementById('attendanceShift').value;
    const date = document.getElementById('attendanceDate').value;
    
    // ✅ FIX: Check if memberId exists (not empty string)
    if (!memberId) {
        showToast('Please select a member', 'error');
        return;
    }
    
    // ✅ FIX: Find member by string ID, not integer
    const member = members.find(m => m.id === memberId);
    
    if (!member) {
        showToast('Member not found', 'error');
        return;
    }
    
    try {
        showToast('Marking attendance...', 'info');
        
        const attendanceData = {
            memberId: memberId,  // ✅ Keep as string
            memberName: member.name,
            shift: shift,
            time: new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            date: date
        };
        
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadDataFromServer();
            renderAttendance();
            updateDashboard();
            closeModal('markAttendanceModal');
            showToast('Attendance marked successfully', 'success');
        } else {
            showToast('Failed to mark attendance', 'error');
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        showToast('Error marking attendance', 'error');
    }
});

// View member attendance history
function viewMemberAttendanceHistory(memberId) {
    currentMemberForAttendance = memberId;  // Keep as string
    const member = members.find(m => m.id === memberId); 
    
    if (!member) {
        showToast('Member not found', 'error');
        return;
    }
    
    // Get all attendance records for this member
    const memberAttendance = attendance.filter(a => a.memberId === memberId);
    
    // Update modal title
    document.getElementById('attendanceHistoryTitle').textContent = `Attendance History - ${member.name}`;
    
    // Update member info
    document.getElementById('attendanceHistoryInfo').innerHTML = `
        <strong>Member ID:</strong> ${member.id} | 
        <strong>Type:</strong> ${member.type} | 
        <strong>Total Visits:</strong> ${memberAttendance.length}
    `;
    
    // Render history table
    renderAttendanceHistoryTable(memberAttendance);
    
    // Show modal
    document.getElementById('memberAttendanceHistoryModal').classList.add('show');
}

// Render attendance history table - FIXED TIME DISPLAY
function renderAttendanceHistoryTable(records) {
    const tbody = document.getElementById('attendanceHistoryTableBody');
    
    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No attendance records found.
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sorted = [...records].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });
    
    tbody.innerHTML = sorted.map(a => `
        <tr>
            <td data-label="ID">${a.memberId}</td>
            <td data-label="Shift">
                <span class="status-badge status-${a.shift.toLowerCase()}">${a.shift}</span>
            </td>
            <td data-label="Time">${a.time || 'N/A'}</td>
            <td data-label="Date">${formatDate(a.date)}</td>
            <td data-label="Actions">
                <button class="btn-delete" onclick="deleteAttendanceFromHistory(${a.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}
// Delete attendance from history and refresh
async function deleteAttendanceFromHistory(id) {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
        const response = await fetch(`/api/attendance/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            
            // Refresh history modal if still viewing
            if (currentMemberForAttendance) {
                // Check if member still exists
                const member = members.find(m => m.id === currentMemberForAttendance);
                if (member) {
                    viewMemberAttendanceHistory(currentMemberForAttendance);
                } else {
                    // Member was deleted, close modal
                    closeModal('memberAttendanceHistoryModal');
                    showToast('Attendance record deleted. Member no longer exists.', 'info');
                }
            }
            
            // Refresh main attendance table
            renderAttendance();
            
            showToast('Attendance record deleted', 'success');
        } else {
            showToast('Failed to delete attendance', 'error');
        }
    } catch (error) {
        console.error('Error deleting attendance:', error);
        showToast('Error deleting attendance', 'error');
    }
}

// Delete ALL attendance records for a member
async function deleteAttendance(latestRecordId) {
    // Find the latest record to get the memberId
    const latestRecord = attendance.find(a => a.id === latestRecordId);
    
    if (!latestRecord) {
        showToast('Attendance record not found', 'error');
        return;
    }
    
    const memberId = latestRecord.memberId;
    
    // Find all attendance records for this member
    const memberAttendance = attendance.filter(a => a.memberId === memberId);
    
    // Try to find the member (but don't fail if not found)
    const member = members.find(m => m.id === memberId);
    const memberName = member ? member.name : latestRecord.memberName; // Use name from record if member deleted
    
    if (!confirm(`Are you sure you want to delete ALL ${memberAttendance.length} attendance record(s) for ${memberName}? This cannot be undone.`)) {
        return;
    }
    
    try {
        showToast('Deleting all attendance records...', 'info');
        
        // Delete all records for this member
        let deletedCount = 0;
        for (const record of memberAttendance) {
            const response = await fetch(`/api/attendance/${record.id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                deletedCount++;
            }
        }
        
        if (deletedCount === memberAttendance.length) {
            await loadDataFromServer();
            renderAttendance();
            updateDashboard();
            showToast(`Successfully deleted all ${deletedCount} attendance records for ${memberName}`, 'success');
        } else {
            await loadDataFromServer();
            renderAttendance();
            updateDashboard();
            showToast(`Deleted ${deletedCount} of ${memberAttendance.length} records`, 'warning');
        }
    } catch (error) {
        console.error('Error deleting attendance:', error);
        showToast('Error deleting attendance records', 'error');
    }
}

// Print member attendance report

// Print member attendance report
function printMemberAttendance(memberId) {
    const member = members.find(m => m.id === memberId);
    
    if (!member) {
        showToast('Member not found', 'error');
        return;
    }
    
    const memberAttendance = attendance.filter(a => a.memberId === memberId);
    
    if (memberAttendance.length === 0) {
        showToast('No attendance records to print', 'error');
        return;
    }
    
    // Sort by date (newest first)
    const sorted = [...memberAttendance].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });
    
    // Count shifts
    const morningCount = sorted.filter(a => a.shift === 'Morning').length;
    const eveningCount = sorted.filter(a => a.shift === 'Evening').length;
    const nightCount = sorted.filter(a => a.shift === 'Night').length;
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Attendance Report - ${member.name}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    padding: 30px; 
                    line-height: 1.6;
                    color: #2C3E50;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #3498DB;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #2C3E50;
                    margin-bottom: 10px;
                }
                .header p {
                    color: #7F8C8D;
                    font-size: 0.95rem;
                }
                .member-info {
                    background: #ECF0F1;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                .info-item {
                    display: flex;
                    justify-content: space-between;
                }
                .info-item span:first-child {
                    font-weight: 600;
                    color: #7F8C8D;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: #3498DB;
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }
                .stat-card h3 {
                    font-size: 2rem;
                    margin-bottom: 5px;
                }
                .stat-card p {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                thead {
                    background: #2C3E50;
                    color: white;
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #ECF0F1;
                }
                tbody tr:hover {
                    background: #F8F9FA;
                }
                .shift-badge {
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: inline-block;
                }
                .shift-morning { background: #FFF3CD; color: #856404; }
                .shift-evening { background: #D1ECF1; color: #0C5460; }
                .shift-night { background: #F8D7DA; color: #721C24; }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #ECF0F1;
                    text-align: center;
                    color: #7F8C8D;
                    font-size: 0.9rem;
                }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏋️ DENIM GYM</h1>
                <p>Attendance Report</p>
                <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="member-info">
                <div class="info-item">
                    <span>Member Name:</span>
                    <strong>${member.name}</strong>
                </div>
                <div class="info-item">
                    <span>Member ID:</span>
                    <strong>${member.id}</strong>
                </div>
                <div class="info-item">
                    <span>Member Type:</span>
                    <strong>${member.type}</strong>
                </div>
                <div class="info-item">
                    <span>Phone:</span>
                    <strong>${member.phone}</strong>
                </div>
            </div>
            
            <div class="stats">
                <div class="stat-card">
                    <h3>${sorted.length}</h3>
                    <p>Total Visits</p>
                </div>
                <div class="stat-card" style="background: #F39C12;">
                    <h3>${morningCount}</h3>
                    <p>Morning Shifts</p>
                </div>
                <div class="stat-card" style="background: #3498DB;">
                    <h3>${eveningCount}</h3>
                    <p>Evening Shifts</p>
                </div>
                <div class="stat-card" style="background: #E74C3C;">
                    <h3>${nightCount}</h3>
                    <p>Night Shifts</p>
                </div>
            </div>
            
            <h2 style="margin-bottom: 15px; color: #2C3E50;">Attendance Records</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Shift</th>
                        <th>Time</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => `
                        <tr>
                            <td>${a.id}</td>
                            <td><span class="shift-badge shift-${a.shift.toLowerCase()}">${a.shift}</span></td>
                            <td>${a.time}</td>
                            <td>${formatDate(a.date)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p><strong>End of Report</strong></p>
                <p>This is a computer-generated document from Denim Gym Management System</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 100);
                };
            </script>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// Apply attendance filters (updated to work with new structure)
function applyAttendanceFilters() {
    const searchQuery = document.getElementById('attendanceSearch').value.toLowerCase();
    const shiftFilter = document.getElementById('attendanceShiftFilter').value;
    const dateFilter = document.getElementById('attendanceDateFilter').value;
    
    // Get latest attendance per member first
    const latestAttendance = {};
    attendance.forEach(a => {
        if (!latestAttendance[a.memberId]) {
            latestAttendance[a.memberId] = a;
        } else {
            const currentDate = new Date(latestAttendance[a.memberId].date + ' ' + latestAttendance[a.memberId].time);
            const newDate = new Date(a.date + ' ' + a.time);
            if (newDate > currentDate) {
                latestAttendance[a.memberId] = a;
            }
        }
    });
    
    let filtered = Object.values(latestAttendance);
    
    // Apply search filter
    if (searchQuery) {
        filtered = filtered.filter(a => 
            a.memberName.toLowerCase().includes(searchQuery) ||
            a.memberId.toString().includes(searchQuery)
        );
    }
    
    // Apply shift filter
    if (shiftFilter !== 'all') {
        filtered = filtered.filter(a => a.shift === shiftFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
        filtered = filtered.filter(a => a.date === dateFilter);
    }
    
    renderFilteredAttendance(filtered);
    updateAttendanceCount(filtered.length, Object.keys(latestAttendance).length);
}

// Render filtered attendance
function renderFilteredAttendance(filtered) {
    const tbody = document.getElementById('attendanceTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No records found matching your filters.
                </td>
            </tr>
        `;
        return;
    }
    
    // Count total records for each member
    const recordCounts = {};
    attendance.forEach(a => {
        recordCounts[a.memberId] = (recordCounts[a.memberId] || 0) + 1;
    });
    
    tbody.innerHTML = filtered.map(a => {
        const totalRecords = recordCounts[a.memberId];
        
        return `
            <tr>
                <td data-label="Member ID">${a.memberId}</td>
                <td data-label="Member Name">
                    ${a.memberName}
                    ${totalRecords > 1 ? `<span style="color: var(--secondary-color); font-size: 0.85rem; margin-left: 0.5rem;">(${totalRecords} visits)</span>` : ''}
                </td>
                <td data-label="Latest Shift">
                    <span class="status-badge status-${a.shift.toLowerCase()}">${a.shift}</span>
                </td>
                <td data-label="Latest Time">${a.time}</td>
                <td data-label="Latest Date">${formatDate(a.date)}</td>
                <td data-label="Total Records">${totalRecords}</td>
                <td data-label="Actions">
                    <button class="btn-view-payments" onclick="viewMemberAttendanceHistory(${a.memberId})" ${totalRecords > 1 ? 'style="background: var(--secondary-color); border-color: var(--secondary-color);"' : ''}>
                        <i class="fas fa-history"></i> View History ${totalRecords > 1 ? `(${totalRecords})` : ''}
                    </button>
                    <button class="btn-secondary" onclick="printMemberAttendance(${a.memberId})">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="btn-delete" onclick="deleteAttendance(${a.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update attendance count
function updateAttendanceCount(filtered, total) {
    const countElement = document.getElementById('attendanceFilterCount');
    if (countElement) {
        countElement.textContent = filtered === total 
            ? `Showing all ${total} records` 
            : `Showing ${filtered} of ${total} records`;
    }
}

// Reset attendance filters
function resetAttendanceFilters() {
    document.getElementById('attendanceSearch').value = '';
    document.getElementById('attendanceShiftFilter').value = 'all';
    document.getElementById('attendanceDateFilter').value = '';
    renderAttendance();
    updateAttendanceCount(attendance.length, attendance.length);
}

// ============= TRAINER ATTENDANCE MANAGEMENT =============

let trainerAttendance = [];
let currentTrainerForAttendance = null;

// Render trainer attendance - Show ONLY latest record per trainer
// Render trainer attendance - Show ONLY latest record per trainer
function renderTrainerAttendance() {
    const tbody = document.getElementById('trainerAttendanceTableBody');
    
    if (!trainerAttendance || trainerAttendance.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No attendance records found. Click "Mark Trainer Attendance" to add one.
                </td>
            </tr>
        `;
        return;
    }
    
    // Group by trainer and get ONLY the latest record
    const latestAttendance = {};
    trainerAttendance.forEach(a => {
        if (!latestAttendance[a.trainerId]) {
            latestAttendance[a.trainerId] = a;
        } else {
            const currentDate = new Date(latestAttendance[a.trainerId].date + ' ' + latestAttendance[a.trainerId].time);
            const newDate = new Date(a.date + ' ' + a.time);
            
            if (newDate > currentDate) {
                latestAttendance[a.trainerId] = a;
            }
        }
    });
    
    // Convert to array for display
    const recordsToShow = Object.values(latestAttendance);
    
    // Count total records for each trainer
    const recordCounts = {};
    trainerAttendance.forEach(a => {
        recordCounts[a.trainerId] = (recordCounts[a.trainerId] || 0) + 1;
    });
    
    tbody.innerHTML = recordsToShow.map(a => {
        const totalRecords = recordCounts[a.trainerId];
        
        return `
            <tr>
                <td data-label="Trainer ID">${a.trainerId}</td>
                <td data-label="Trainer Name">
                    ${a.trainerName}
                    ${totalRecords > 1 ? `<span style="color: var(--secondary-color); font-size: 0.85rem; margin-left: 0.5rem;">(${totalRecords} visits)</span>` : ''}
                </td>
                <td data-label="Latest Shift">
                    <span class="status-badge status-${a.shift.toLowerCase()}">${a.shift}</span>
                </td>
                <td data-label="Latest Time">${a.time}</td>
                <td data-label="Latest Date">${formatDate(a.date)}</td>
                <td data-label="Total Records">${totalRecords}</td>
                <td data-label="Actions">
                    <button class="btn-view-payments" onclick="viewTrainerAttendanceHistory('${a.trainerId}')" ${totalRecords > 1 ? 'style="background: var(--secondary-color); border-color: var(--secondary-color);"' : ''}>
                        <i class="fas fa-history"></i> View History ${totalRecords > 1 ? `(${totalRecords})` : ''}
                    </button>
                    <button class="btn-secondary" onclick="printTrainerAttendance('${a.trainerId}')">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="btn-delete" onclick="deleteTrainerAttendance(${a.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Show mark trainer attendance modal
async function showMarkTrainerAttendanceModal() {
    // ✅ ALWAYS reload fresh data first - THIS IS THE KEY FIX
    await loadDataFromServer();
    
    const modal = document.getElementById('markTrainerAttendanceModal');
    const trainerSelect = document.getElementById('trainerAttendanceMember');
    
    // ✅ NOW populate dropdown with FRESH data including newly added trainers
    trainerSelect.innerHTML = '<option value="">Choose a trainer...</option>' +
        trainers.filter(t => t.status === 'Active').map(t => 
            `<option value="${t.id}">${t.name} (ID: ${t.id})</option>`
        ).join('');
    
    // Reset form
    document.getElementById('trainerAttendanceForm').reset();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('trainerAttendanceDate').value = today;
    
    // Show modal
    modal.classList.add('show');
}

// Handle trainer attendance form submission
document.getElementById('trainerAttendanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // ✅ FIX: Keep as string, don't parse to integer
    const trainerId = document.getElementById('trainerAttendanceMember').value;
    const shift = document.getElementById('trainerAttendanceShift').value;
    const date = document.getElementById('trainerAttendanceDate').value;
    
    // ✅ FIX: Check if trainerId exists
    if (!trainerId) {
        showToast('Please select a trainer', 'error');
        return;
    }
    
    // ✅ FIX: Find trainer by string ID
    const trainer = trainers.find(t => t.id === trainerId);
    
    if (!trainer) {
        showToast('Trainer not found', 'error');
        return;
    }
    
    try {
        showToast('Marking attendance...', 'info');
        
        const attendanceData = {
            trainerId: trainerId,  // ✅ Keep as string
            trainerName: trainer.name,
            shift: shift,
            time: new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            date: date
        };
        
        const response = await fetch('/api/trainer-attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadDataFromServer();
            renderTrainerAttendance();
            updateDashboard();
            closeModal('markTrainerAttendanceModal');
            showToast('Trainer attendance marked successfully', 'success');
        } else {
            showToast('Failed to mark attendance', 'error');
        }
    } catch (error) {
        console.error('Error marking trainer attendance:', error);
        showToast('Error marking attendance', 'error');
    }
});

// View trainer attendance history
function viewTrainerAttendanceHistory(trainerId) {
    currentTrainerForAttendance = trainerId;
    const trainer = trainers.find(t => t.id === trainerId);
    
    if (!trainer) {
        showToast('Trainer not found', 'error');
        return;
    }
    
    const trainerAttendanceRecords = trainerAttendance.filter(a => a.trainerId === trainerId);
    
    document.getElementById('trainerAttendanceHistoryTitle').textContent = `Attendance History - ${trainer.name}`;
    document.getElementById('trainerAttendanceHistoryInfo').innerHTML = `
        <strong>Trainer ID:</strong> ${trainer.id} | 
        <strong>Specialty:</strong> ${trainer.specialty} | 
        <strong>Total Visits:</strong> ${trainerAttendanceRecords.length}
    `;
    
    renderTrainerAttendanceHistoryTable(trainerAttendanceRecords);
    document.getElementById('trainerAttendanceHistoryModal').classList.add('show');
}

// Render trainer attendance history table
function renderTrainerAttendanceHistoryTable(records) {
    const tbody = document.getElementById('trainerAttendanceHistoryTableBody');
    
    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No attendance records found.
                </td>
            </tr>
        `;
        return;
    }
    
    const sorted = [...records].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });
    
    tbody.innerHTML = sorted.map(a => `
        <tr>
            <td data-label="ID">${a.trainerId}</td>
            <td data-label="Shift">
                <span class="status-badge status-${a.shift.toLowerCase()}">${a.shift}</span>
            </td>
            <td data-label="Time">${a.time}</td>
            <td data-label="Date">${formatDate(a.date)}</td>
            <td data-label="Actions">
                <button class="btn-delete" onclick="deleteTrainerAttendanceFromHistory(${a.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Delete trainer attendance from history
async function deleteTrainerAttendanceFromHistory(id) {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
        const response = await fetch(`/api/trainer-attendance/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            
            if (currentTrainerForAttendance) {
                viewTrainerAttendanceHistory(currentTrainerForAttendance);
            }
            
            renderTrainerAttendance();
            showToast('Attendance record deleted', 'success');
        } else {
            showToast('Failed to delete attendance', 'error');
        }
    } catch (error) {
        console.error('Error deleting trainer attendance:', error);
        showToast('Error deleting attendance', 'error');
    }
}

// Delete ALL trainer attendance records
async function deleteTrainerAttendance(latestRecordId) {
    const latestRecord = trainerAttendance.find(a => a.id === latestRecordId);
    
    if (!latestRecord) {
        showToast('Attendance record not found', 'error');
        return;
    }
    
    const trainerId = latestRecord.trainerId;
    const trainerAttendanceRecords = trainerAttendance.filter(a => a.trainerId === trainerId);
    const trainer = trainers.find(t => t.id === trainerId);
    
    if (!trainer) {
        showToast('Trainer not found', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ALL ${trainerAttendanceRecords.length} attendance record(s) for ${trainer.name}? This cannot be undone.`)) {
        return;
    }
    
    try {
        showToast('Deleting all attendance records...', 'info');
        
        let deletedCount = 0;
        for (const record of trainerAttendanceRecords) {
            const response = await fetch(`/api/trainer-attendance/${record.id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                deletedCount++;
            }
        }
        
        if (deletedCount === trainerAttendanceRecords.length) {
            await loadDataFromServer();
            renderTrainerAttendance();
            updateDashboard();
            showToast(`Successfully deleted all ${deletedCount} attendance records for ${trainer.name}`, 'success');
        } else {
            await loadDataFromServer();
            renderTrainerAttendance();
            updateDashboard();
            showToast(`Deleted ${deletedCount} of ${trainerAttendanceRecords.length} records`, 'warning');
        }
    } catch (error) {
        console.error('Error deleting trainer attendance:', error);
        showToast('Error deleting attendance records', 'error');
    }
}

// Print trainer attendance report
function printTrainerAttendance(trainerId) {
    const trainer = trainers.find(t => t.id === trainerId);
    
    if (!trainer) {
        showToast('Trainer not found', 'error');
        return;
    }
    
    const trainerAttendanceRecords = trainerAttendance.filter(a => a.trainerId === trainerId);
    
    if (trainerAttendanceRecords.length === 0) {
        showToast('No attendance records to print', 'error');
        return;
    }
    
    const sorted = [...trainerAttendanceRecords].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });
    
    const morningCount = sorted.filter(a => a.shift === 'Morning').length;
    const eveningCount = sorted.filter(a => a.shift === 'Evening').length;
    const nightCount = sorted.filter(a => a.shift === 'Night').length;
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Trainer Attendance Report - ${trainer.name}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    padding: 30px; 
                    line-height: 1.6;
                    color: #2C3E50;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #3498DB;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #2C3E50;
                    margin-bottom: 10px;
                }
                .trainer-info {
                    background: #ECF0F1;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                .info-item {
                    display: flex;
                    justify-content: space-between;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: #3498DB;
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                thead {
                    background: #2C3E50;
                    color: white;
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #ECF0F1;
                }
                .shift-badge {
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .shift-morning { background: #FFF3CD; color: #856404; }
                .shift-evening { background: #D1ECF1; color: #0C5460; }
                .shift-night { background: #F8D7DA; color: #721C24; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏋️ DENIM GYM</h1>
                <p>Trainer Attendance Report</p>
                <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="trainer-info">
                <div class="info-item">
                    <span>Trainer Name:</span>
                    <strong>${trainer.name}</strong>
                </div>
                <div class="info-item">
                    <span>Trainer ID:</span>
                    <strong>${trainer.id}</strong>
                </div>
                <div class="info-item">
                    <span>Specialty:</span>
                    <strong>${trainer.specialty}</strong>
                </div>
                <div class="info-item">
                    <span>Status:</span>
                    <strong>${trainer.status}</strong>
                </div>
            </div>
            
            <div class="stats">
                <div class="stat-card">
                    <h3>${sorted.length}</h3>
                    <p>Total Visits</p>
                </div>
                <div class="stat-card" style="background: #F39C12;">
                    <h3>${morningCount}</h3>
                    <p>Morning Shifts</p>
                </div>
                <div class="stat-card">
                    <h3>${eveningCount}</h3>
                    <p>Evening Shifts</p>
                </div>
                <div class="stat-card" style="background: #E74C3C;">
                    <h3>${nightCount}</h3>
                    <p>Night Shifts</p>
                </div>
            </div>
            
            <h2 style="margin-bottom: 15px;">Attendance Records</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Shift</th>
                        <th>Time</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => `
                        <tr>
                            <td>${a.id}</td>
                            <td><span class="shift-badge shift-${a.shift.toLowerCase()}">${a.shift}</span></td>
                            <td>${a.time}</td>
                            <td>${formatDate(a.date)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 100);
                };
            </script>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// Apply trainer attendance filters
function applyTrainerAttendanceFilters() {
    const searchQuery = document.getElementById('trainerAttendanceSearch').value.toLowerCase();
    const shiftFilter = document.getElementById('trainerAttendanceShiftFilter').value;
    
    const latestAttendance = {};
    trainerAttendance.forEach(a => {
        if (!latestAttendance[a.trainerId]) {
            latestAttendance[a.trainerId] = a;
        } else {
            const currentDate = new Date(latestAttendance[a.trainerId].date + ' ' + latestAttendance[a.trainerId].time);
            const newDate = new Date(a.date + ' ' + a.time);
            if (newDate > currentDate) {
                latestAttendance[a.trainerId] = a;
            }
        }
    });
    
    let filtered = Object.values(latestAttendance);
    
    if (searchQuery) {
        filtered = filtered.filter(a => {
            const trainerName = a.trainerName.toLowerCase();
            const trainerId = String(a.trainerId).toLowerCase();
            const trainerIdNumber = trainerId.replace(/[^0-9]/g, ''); // Extract just numbers (T01 -> 01)
            
            return trainerName.includes(searchQuery) || 
                   trainerId.includes(searchQuery) || 
                   trainerIdNumber.includes(searchQuery);
        });
    }
    
    if (shiftFilter !== 'all') {
        filtered = filtered.filter(a => a.shift === shiftFilter);
    }
    
    renderFilteredTrainerAttendance(filtered);
    updateTrainerAttendanceCount(filtered.length, Object.keys(latestAttendance).length);
}

// Render filtered trainer attendance
function renderFilteredTrainerAttendance(filtered) {
    const tbody = document.getElementById('trainerAttendanceTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No records found matching your filters.
                </td>
            </tr>
        `;
        return;
    }
    
    const recordCounts = {};
    trainerAttendance.forEach(a => {
        recordCounts[a.trainerId] = (recordCounts[a.trainerId] || 0) + 1;
    });
    
    tbody.innerHTML = filtered.map(a => {
        const totalRecords = recordCounts[a.trainerId];
        
        return `
            <tr>
                <td data-label="Trainer ID">${a.trainerId}</td>
                <td data-label="Trainer Name">
                    ${a.trainerName}
                    ${totalRecords > 1 ? `<span style="color: var(--secondary-color); font-size: 0.85rem; margin-left: 0.5rem;">(${totalRecords} visits)</span>` : ''}
                </td>
                <td data-label="Latest Shift">
                    <span class="status-badge status-${a.shift.toLowerCase()}">${a.shift}</span>
                </td>
                <td data-label="Latest Time">${a.time}</td>
                <td data-label="Latest Date">${formatDate(a.date)}</td>
                <td data-label="Total Records">${totalRecords}</td>
                <td data-label="Actions">
                    <button class="btn-view-payments" onclick="viewTrainerAttendanceHistory('${a.trainerId}')">
                        <i class="fas fa-history"></i> View History
                    </button>
                    <button class="btn-secondary" onclick="printTrainerAttendance('${a.trainerId}')">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="btn-delete" onclick="deleteTrainerAttendance(${a.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update trainer attendance count
function updateTrainerAttendanceCount(filtered, total) {
    const countElement = document.getElementById('trainerAttendanceFilterCount');
    if (countElement) {
        countElement.textContent = filtered === total 
            ? `Showing all ${total} records` 
            : `Showing ${filtered} of ${total} records`;
    }
}

// Reset trainer attendance filters
function resetTrainerAttendanceFilters() {
    document.getElementById('trainerAttendanceSearch').value = '';
    document.getElementById('trainerAttendanceShiftFilter').value = 'all';
    renderTrainerAttendance();
    updateTrainerAttendanceCount(trainerAttendance.length, trainerAttendance.length);
}

// ============= TRAINER ATTENDANCE REPORT =============
function generateTrainerAttendanceReport() {
    const totalRecords = trainerAttendance.length;
    const morningShift = trainerAttendance.filter(a => a.shift === 'Morning').length;
    const eveningShift = trainerAttendance.filter(a => a.shift === 'Evening').length;
    const nightShift = trainerAttendance.filter(a => a.shift === 'Night').length;
    
    // Group by trainer
    const trainerAttendanceStats = {};
    trainerAttendance.forEach(a => {
        if (!trainerAttendanceStats[a.trainerId]) {
            trainerAttendanceStats[a.trainerId] = {
                name: a.trainerName,
                count: 0,
                shifts: { Morning: 0, Evening: 0, Night: 0 }
            };
        }
        trainerAttendanceStats[a.trainerId].count++;
        trainerAttendanceStats[a.trainerId].shifts[a.shift]++;
    });
    
    // Sort by attendance count
    const sortedTrainers = Object.values(trainerAttendanceStats)
        .sort((a, b) => b.count - a.count);
    
    return `
        <div class="report-summary">
            <div class="report-card">
                <h4>Total Records</h4>
                <div class="value">${totalRecords}</div>
            </div>
            <div class="report-card">
                <h4>Morning Shift</h4>
                <div class="value" style="color: #ffa726;">${morningShift}</div>
            </div>
            <div class="report-card">
                <h4>Evening Shift</h4>
                <div class="value" style="color: #3498DB;">${eveningShift}</div>
            </div>
            <div class="report-card">
                <h4>Night Shift</h4>
                <div class="value" style="color: #e74c3c;">${nightShift}</div>
            </div>
        </div>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Trainer Attendance Summary</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Trainer Name</th>
                    <th>Total Visits</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Night</th>
                </tr>
            </thead>
            <tbody>
                ${sortedTrainers.map((trainer, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${trainer.name}</td>
                        <td style="font-weight: 600;">${trainer.count}</td>
                        <td>${trainer.shifts.Morning}</td>
                        <td>${trainer.shifts.Evening}</td>
                        <td>${trainer.shifts.Night}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Recent Trainer Attendance (Last 20)</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Trainer Name</th>
                    <th>Shift</th>
                    <th>Date</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody>
                ${trainerAttendance.slice(0, 20).map(a => `
                    <tr>
                        <td>${a.trainerName}</td>
                        <td><span class="status-badge status-${a.shift.toLowerCase()}">${a.shift}</span></td>
                        <td>${formatDate(a.date)}</td>
                        <td>${a.time}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ============= TRAINER SALARY REPORT =============
function generateTrainerSalaryReport() {
    const activeTrainers = trainers.filter(t => t.status === 'Active');
    const totalSalaries = activeTrainers.reduce((sum, t) => sum + (t.salary || 0), 0);
    const averageSalary = activeTrainers.length > 0 ? (totalSalaries / activeTrainers.length) : 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const paidThisMonth = trainerSalaryPayments
        .filter(p => {
            const paymentDate = new Date(p.paymentDate);
            return p.status === 'Paid' && 
                   paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);
    
    const unpaidSalary = totalSalaries - paidThisMonth;
    
    // Group salary payments by trainer
    const trainerSalaryStats = {};
    trainerSalaryPayments.forEach(payment => {
        if (!trainerSalaryStats[payment.trainerId]) {
            trainerSalaryStats[payment.trainerId] = {
                name: payment.trainerName,
                totalPaid: 0,
                payments: 0
            };
        }
        if (payment.status === 'Paid') {
            trainerSalaryStats[payment.trainerId].totalPaid += payment.amount;
            trainerSalaryStats[payment.trainerId].payments++;
        }
    });
    
    return `
        <div class="report-summary">
            <div class="report-card">
                <h4>Total Monthly Salaries</h4>
                <div class="value">${formatCurrency(totalSalaries)}</div>
            </div>
            <div class="report-card">
                <h4>Paid This Month</h4>
                <div class="value" style="color: #28a745;">${formatCurrency(paidThisMonth)}</div>
            </div>
            <div class="report-card">
                <h4>Unpaid This Month</h4>
                <div class="value" style="color: #dc3545;">${formatCurrency(unpaidSalary)}</div>
            </div>
            <div class="report-card">
                <h4>Average Salary</h4>
                <div class="value">${formatCurrency(averageSalary)}</div>
            </div>
        </div>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Trainer Salary Details</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Trainer ID</th>
                    <th>Name</th>
                    <th>Specialty</th>
                    <th>Monthly Salary</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${activeTrainers.map(t => `
                    <tr>
                        <td>${t.id}</td>
                        <td>${t.name}</td>
                        <td>${t.specialty}</td>
                        <td style="font-weight: 600;">${formatCurrency(t.salary)}</td>
                        <td><span class="status-badge status-${t.status.toLowerCase()}">${t.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Salary Payment History</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Trainer Name</th>
                    <th>Total Paid</th>
                    <th>Number of Payments</th>
                </tr>
            </thead>
            <tbody>
                ${Object.values(trainerSalaryStats).map(stat => `
                    <tr>
                        <td>${stat.name}</td>
                        <td style="color: #28a745; font-weight: 600;">${formatCurrency(stat.totalPaid)}</td>
                        <td>${stat.payments}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Recent Salary Payments</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Trainer Name</th>
                    <th>Amount</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${trainerSalaryPayments.slice(0, 20).map(p => `
                    <tr>
                        <td>${p.trainerName}</td>
                        <td style="font-weight: 600;">${formatCurrency(p.amount)}</td>
                        <td>${formatDate(p.paymentDate)}</td>
                        <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Fix all close buttons
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        });
    });
});

// ============= LICENSE MANAGEMENT FUNCTIONS =============

// License data structure (temporary - will be stored in database later)
let licenseData = {
    isActive: false,
    activationDate: null,
    expiryDate: null,
    key: null,
    history: []
};

// Load license data from localStorage (temporary storage)
function loadLicenseData() {
    const saved = localStorage.getItem('gymLicenseData');
    if (saved) {
        try {
            licenseData = JSON.parse(saved);
        } catch (error) {
            console.error('Error loading license data:', error);
        }
    }
    updateLicenseDisplay();
}

// Save license data to localStorage
function saveLicenseData() {
    localStorage.setItem('gymLicenseData', JSON.stringify(licenseData));
}

// Update license display
function updateLicenseDisplay() {
    if (!licenseData.isActive || !licenseData.expiryDate) {
        // No active license
        document.getElementById('licenseStatusBadge').textContent = 'Inactive';
        document.getElementById('licenseStatusBadge').className = 'status-badge status-expired';
        document.getElementById('licenseActivationDate').textContent = '—';
        document.getElementById('licenseExpiryDate').textContent = '—';
        document.getElementById('licenseDaysRemaining').textContent = '0';
        document.getElementById('licenseDaysRemaining').style.color = 'var(--accent-color)';
        document.getElementById('licenseProgressFill').style.width = '0%';
        document.getElementById('licenseProgressText').textContent = 'License not activated';
        return;
    }
    
    const now = new Date();
    const expiryDate = new Date(licenseData.expiryDate);
    const activationDate = new Date(licenseData.activationDate);
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((expiryDate - activationDate) / (1000 * 60 * 60 * 24));
    const percentRemaining = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
    
    // Update status
    if (daysRemaining <= 0) {
        document.getElementById('licenseStatusBadge').textContent = 'Expired';
        document.getElementById('licenseStatusBadge').className = 'status-badge status-expired';
        document.getElementById('licenseDaysRemaining').textContent = 'Expired';
        document.getElementById('licenseDaysRemaining').style.color = 'var(--accent-color)';
        document.getElementById('licenseProgressText').textContent = 'License has expired. Please renew.';
        licenseData.isActive = false;
        saveLicenseData();
    } else if (daysRemaining <= 7) {
        document.getElementById('licenseStatusBadge').textContent = 'Expiring Soon';
        document.getElementById('licenseStatusBadge').className = 'status-badge status-expiring';
        document.getElementById('licenseDaysRemaining').textContent = daysRemaining;
        document.getElementById('licenseDaysRemaining').style.color = 'var(--warning-color)';
        document.getElementById('licenseProgressText').textContent = `License expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
    } else {
        document.getElementById('licenseStatusBadge').textContent = 'Active';
        document.getElementById('licenseStatusBadge').className = 'status-badge status-active';
        document.getElementById('licenseDaysRemaining').textContent = daysRemaining;
        document.getElementById('licenseDaysRemaining').style.color = 'var(--success-color)';
        document.getElementById('licenseProgressText').textContent = `License is active (${daysRemaining} days remaining)`;
    }
    
    // Update dates
    document.getElementById('licenseActivationDate').textContent = formatDate(licenseData.activationDate);
    document.getElementById('licenseExpiryDate').textContent = formatDate(licenseData.expiryDate);
    
    // Update progress bar
    const progressFill = document.getElementById('licenseProgressFill');
    progressFill.style.width = percentRemaining + '%';
    
    if (percentRemaining <= 20) {
        progressFill.style.background = 'linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)';
    } else if (percentRemaining <= 50) {
        progressFill.style.background = 'linear-gradient(90deg, #f39c12 0%, #f1c40f 100%)';
    } else {
        progressFill.style.background = 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)';
    }
    
    // Update history table
    renderLicenseHistory();
}

// Render license history
function renderLicenseHistory() {
    const tbody = document.getElementById('licenseHistoryTableBody');
    
    if (!licenseData.history || licenseData.history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No activation history available
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = licenseData.history.map(record => `
        <tr>
            <td>${formatDate(record.date)}</td>
            <td>${record.action}</td>
            <td>****-${record.keyLast4}</td>
            <td>${record.duration} days</td>
            <td><span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span></td>
        </tr>
    `).join('');
}

// Activate license
function activateLicense() {
    const keyInput = document.getElementById('licenseKeyInput');
    const key = keyInput.value.trim().toUpperCase();
    
    if (!key) {
        showToast('Please enter a license key', 'error');
        return;
    }
    
    // Basic validation (you'll add real validation later)
    if (key.length < 10) {
        showToast('Invalid license key format', 'error');
        return;
    }
    
    // Simulate activation (you'll replace this with real API call)
    showToast('Validating license key...', 'info');
    
    setTimeout(() => {
        // For now, accept any key and activate for 30 days
        // You'll replace this with real key validation
        const activationDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days license
        
        licenseData = {
            isActive: true,
            activationDate: activationDate.toISOString(),
            expiryDate: expiryDate.toISOString(),
            key: key,
            history: [
                ...licenseData.history,
                {
                    date: activationDate.toISOString(),
                    action: 'Activation',
                    keyLast4: key.slice(-4),
                    duration: 30,
                    status: 'Success'
                }
            ]
        };
        
        saveLicenseData();
        updateLicenseDisplay();
        
        keyInput.value = '';
        showToast('✓ License activated successfully! Valid for 30 days.', 'success');
    }, 1500);
}

// Auto-format license key input (add dashes)
document.addEventListener('DOMContentLoaded', () => {
    const keyInput = document.getElementById('licenseKeyInput');
    if (keyInput) {
        keyInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
            let formatted = '';
            
            for (let i = 0; i < value.length && i < 16; i++) {
                if (i > 0 && i % 4 === 0) {
                    formatted += '-';
                }
                formatted += value[i];
            }
            
            e.target.value = formatted;
        });
    }
    
    // Load license data on startup
    loadLicenseData();
});

// Check license status on app startup
function checkLicenseStatus() {
    if (!licenseData.isActive || !licenseData.expiryDate) {
        return false;
    }
    
    const now = new Date();
    const expiryDate = new Date(licenseData.expiryDate);
    
    if (now > expiryDate) {
        licenseData.isActive = false;
        saveLicenseData();
        return false;
    }
    
    return true;
}

// Optional: Block app usage if license expired
function enforceActiveLicense() {
    if (!checkLicenseStatus()) {
        // Show warning but allow access for now
        // You can change this to block access completely
        if (licenseData.expiryDate) {
            showToast('⚠️ Your license has expired. Please activate a new license.', 'error');
        }
    }
}

// ============= VOICE CONTROL SYSTEM WITH AUTO-SAVE =============

let isVoiceEnabled = false;
let recognition = null;
let isSpeaking = false;
let isListening = false;
let voiceTimeout = null;

// Voice form data collection
let voiceFormMode = null;
let voiceFormData = {};
let voiceFormStep = 0;

// Initialize Speech Recognition
function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            console.log('Voice recognition started');
            isListening = true;
            updateVoiceUI();
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log('Heard:', transcript);
            processVoiceCommand(transcript);
        };
        
        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            if (event.error === 'no-speech') {
                if (isVoiceEnabled) {
                    setTimeout(() => {
                        if (isVoiceEnabled && recognition) {
                            recognition.start();
                        }
                    }, 1000);
                }
            }
        };
        
        recognition.onend = () => {
            isListening = false;
            updateVoiceUI();
            if (isVoiceEnabled && !isSpeaking) {
                setTimeout(() => {
                    if (isVoiceEnabled && recognition) {
                        recognition.start();
                    }
                }, 500);
            }
        };
        
        return true;
    } else {
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return false;
    }
}

// Toggle voice control on/off
function toggleVoiceControl() {
    if (!recognition) {
        if (!initializeVoiceRecognition()) {
            return;
        }
    }
    
    isVoiceEnabled = !isVoiceEnabled;
    
    if (isVoiceEnabled) {
        recognition.start();
        speak('Voice control activated. Say create member, create payment, or say help for all commands.');
        showToast('Voice control enabled', 'success');
    } else {
        recognition.stop();
        speak('Voice control deactivated.');
        showToast('Voice control disabled', 'info');
        voiceFormMode = null;
        voiceFormData = {};
        voiceFormStep = 0;
    }
    
    updateVoiceUI();
}

// Update voice control UI
function updateVoiceUI() {
    const voiceToggle = document.getElementById('voiceToggle');
    const voiceMicIcon = document.getElementById('voiceMicIcon');
    const voiceStatus = document.getElementById('voiceStatus');
    const voiceIndicator = document.getElementById('voiceIndicator');
    const lastCommandDisplay = document.getElementById('lastCommandDisplay');
    
    if (isVoiceEnabled) {
        voiceToggle.classList.add('active');
        voiceMicIcon.className = 'fas fa-microphone';
        voiceStatus.textContent = 'Voice: ON';
        lastCommandDisplay.classList.add('active');
        
        if (isListening) {
            voiceToggle.classList.add('listening');
            voiceIndicator.classList.add('active');
        } else {
            voiceToggle.classList.remove('listening');
            voiceIndicator.classList.remove('active');
        }
    } else {
        voiceToggle.classList.remove('active', 'listening');
        voiceMicIcon.className = 'fas fa-microphone-slash';
        voiceStatus.textContent = 'Voice: OFF';
        voiceIndicator.classList.remove('active');
        lastCommandDisplay.classList.remove('active');
    }
}

// Text-to-Speech function
function speak(text) {
    if (!('speechSynthesis' in window)) {
        console.log('Speech synthesis not supported');
        return;
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    isSpeaking = true;
    
    utterance.onstart = () => {
        if (recognition && isVoiceEnabled) {
            recognition.stop();
        }
    };
    
    utterance.onend = () => {
        isSpeaking = false;
        if (isVoiceEnabled && recognition) {
            setTimeout(() => {
                if (isVoiceEnabled && !isSpeaking) {
                    recognition.start();
                }
            }, 500);
        }
    };
    
    window.speechSynthesis.speak(utterance);
}

// Show visual feedback
function showVoiceFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'voice-feedback';
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        document.body.removeChild(feedback);
    }, 2000);
}

// Process voice commands - COMPLETE WITH AUTO-SAVE
function processVoiceCommand(command) {
    document.getElementById('lastCommandText').textContent = command;
    
    // ========== HANDLE VOICE FORM INPUT ==========
    if (voiceFormMode) {
        handleVoiceFormInput(command);
        return;
    }
    
    // ========== CANCEL COMMAND ==========
    if (command.includes('cancel') || command.includes('stop') || command.includes('nevermind')) {
        if (voiceFormMode) {
            voiceFormMode = null;
            voiceFormData = {};
            voiceFormStep = 0;
            speak('Cancelled');
            showVoiceFeedback('Cancelled');
        } else {
            closeAllModals();
            speak('Closing');
        }
        return;
    }
    
    // ========== NAVIGATION COMMANDS ==========
    if (command.includes('dashboard') || command.includes('home')) {
        navigateTo('dashboard');
        speak('Opening dashboard');
        return;
    }
    
    if (command.includes('payment') && !command.includes('create') && !command.includes('add')) {
        navigateTo('payments');
        speak('Opening payments section');
        return;
    }
    
    if (command.includes('member') && !command.includes('create') && !command.includes('add')) {
        navigateTo('members');
        speak('Opening members section');
        return;
    }
    
    if (command.includes('trainer') && !command.includes('create') && !command.includes('add') && !command.includes('salary')) {
        navigateTo('trainers');
        speak('Opening trainers section');
        return;
    }
    
    if (command.includes('premium') && !command.includes('create') && !command.includes('add')) {
        navigateTo('premium');
        speak('Opening premium members section');
        return;
    }
    
    if (command.includes('attendance') && !command.includes('mark') && !command.includes('add')) {
        navigateTo('attendance');
        speak('Opening attendance section');
        return;
    }
    
    if (command.includes('equipment') && !command.includes('add') && !command.includes('create')) {
        navigateTo('equipment');
        speak('Opening equipment section');
        return;
    }
    
    if (command.includes('receipt')) {
        navigateTo('receipts-list');
        speak('Opening receipts section');
        return;
    }
    
    if (command.includes('report')) {
        navigateTo('reports-list');
        speak('Opening reports section');
        return;
    }
    
    if (command.includes('setting')) {
        navigateTo('settings');
        speak('Opening settings');
        return;
    }
    
    // ========== CREATE MEMBER COMMAND ==========
    if (command.includes('create member') || command.includes('add member') || command.includes('new member')) {
        startVoiceCreateMember();
        return;
    }
    
    // ========== CREATE TRAINER COMMAND ==========
    if (command.includes('create trainer') || command.includes('add trainer') || command.includes('new trainer')) {
        startVoiceCreateTrainer();
        return;
    }
    
    // ========== CREATE PAYMENT COMMAND ==========
    if (command.includes('create payment') || command.includes('add payment') || command.includes('new payment')) {
        startVoiceCreatePayment();
        return;
    }
    
    // ========== CREATE PREMIUM MEMBER COMMAND ==========
    if (command.includes('create premium') || command.includes('add premium') || command.includes('new premium')) {
        startVoiceCreatePremium();
        return;
    }
    
    // ========== MARK ATTENDANCE COMMAND ==========
    if (command.includes('mark attendance') || command.includes('add attendance')) {
        startVoiceMarkAttendance();
        return;
    }
    
    // ========== ADD EQUIPMENT COMMAND ==========
    if (command.includes('add equipment') || command.includes('create equipment')) {
        startVoiceAddEquipment();
        return;
    }
    
    // ========== CREATE RECEIPT COMMAND ==========
    if (command.includes('create receipt') || command.includes('generate receipt')) {
        startVoiceCreateReceipt();
        return;
    }
    
    // ========== GENERATE REPORT COMMAND ==========
    if (command.includes('generate report') || command.includes('create report')) {
        startVoiceGenerateReport();
        return;
    }
    
    // ========== PAY SALARY COMMAND ==========
    if (command.includes('pay salary') || command.includes('trainer salary')) {
        startVoicePaySalary();
        return;
    }
    
    // ========== BACKUP COMMANDS ==========
    if (command.includes('create backup')) {
        createManualBackup();
        speak('Creating backup now');
        return;
    }
    
    if (command.includes('backup')) {
        openBackupModal();
        speak('Opening backup options');
        return;
    }
    
    if (command.includes('restore')) {
        showRestoreModal();
        speak('Opening restore options');
        return;
    }
    
    // ========== STATISTICS COMMANDS ==========
    if (command.includes('total revenue') || command.includes('show revenue')) {
        const totalRevenue = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
        speak(`Total revenue is ${totalRevenue} dollars`);
        return;
    }
    
    if (command.includes('total members')) {
        const totalMembers = members.filter(m => m.status === 'Active').length;
        speak(`Total active members: ${totalMembers}`);
        return;
    }
    
    if (command.includes('total trainers')) {
        const totalTrainers = trainers.filter(t => t.status === 'Active').length;
        speak(`Total active trainers: ${totalTrainers}`);
        return;
    }

    // Add these to processVoiceCommand function (insert before "UNKNOWN COMMAND" section):

// ========== VIEW HISTORY COMMANDS ==========
/*
if (command.includes('payment history') || command.includes('view payments')) {
    if (command.match(/\d+/)) {
        handleViewPaymentHistory(command);
        return;
    } else {
        speak('Please say the member ID number to view payment history');
        return;
    }
}

if (command.includes('salary history') || command.includes('view salary')) {
    if (command.match(/\d+/)) {
        handleViewSalaryHistory(command);
        return;
    } else {
        speak('Please say the trainer ID number to view salary history');
        return;
    }
}
*/

    
    // ========== HELP COMMAND ==========
    if (command.includes('help') || command.includes('what can you do')) {
        showVoiceHelp();
        return;
    }
    
    // ========== UNKNOWN COMMAND ==========
    speak('Sorry, I did not understand that command. Say help for available commands.');
}

// ========== VOICE FORM HANDLERS ==========

// Create Member with Voice
function startVoiceCreateMember() {
    voiceFormMode = 'createMember';
    voiceFormData = {};
    voiceFormStep = 0;
    speak('Creating new member. What is the member name?');
    showVoiceFeedback('Creating Member - Step 1: Name');
}

function handleVoiceFormInput(command) {
    if (voiceFormMode === 'createMember') {
        switch(voiceFormStep) {
            case 0: // Name
                voiceFormData.name = capitalizeWords(command);
                voiceFormStep++;
                speak('What is the member type? Say regular or premium');
                showVoiceFeedback('Step 2: Type');
                break;
                
            case 1: // Type
                if (command.includes('premium')) {
                    voiceFormData.type = 'Premium';
                } else {
                    voiceFormData.type = 'Regular';
                }
                voiceFormStep++;
                speak('What is the phone number?');
                showVoiceFeedback('Step 3: Phone');
                break;
                
            case 2: // Phone
                voiceFormData.phone = extractPhoneNumber(command);
                voiceFormStep++;
                speak('What is the email? Say skip to skip');
                showVoiceFeedback('Step 4: Email');
                break;
                
            case 3: // Email
                if (command.includes('skip')) {
                    voiceFormData.email = null;
                } else {
                    voiceFormData.email = command.replace(/ at /g, '@').replace(/ dot /g, '.');
                }
                voiceFormStep++;
                speak('What is the address? Say skip to skip');
                showVoiceFeedback('Step 5: Address');
                break;
                
            case 4: // Address
                if (command.includes('skip')) {
                    voiceFormData.address = null;
                } else {
                    voiceFormData.address = capitalizeWords(command);
                }
                voiceFormStep++;
                speak('What is the member status? Say active, suspended, or quit');
                showVoiceFeedback('Step 6: Status');
                break;
                
            case 5: // Status
                if (command.includes('suspended')) {
                    voiceFormData.status = 'Suspended';
                } else if (command.includes('quit')) {
                    voiceFormData.status = 'Quit';
                } else {
                    voiceFormData.status = 'Active';
                }
                // Save member
                saveVoiceMember();
                break;
        }
    }
    
    else if (voiceFormMode === 'createTrainer') {
        switch(voiceFormStep) {
            case 0: // Name
                voiceFormData.name = capitalizeWords(command);
                voiceFormStep++;
                speak('What is the trainer specialty?');
                showVoiceFeedback('Step 2: Specialty');
                break;
                
            case 1: // Specialty
                voiceFormData.specialty = capitalizeWords(command);
                voiceFormStep++;
                speak('What is the phone number?');
                showVoiceFeedback('Step 3: Phone');
                break;
                
            case 2: // Phone
                voiceFormData.phone = extractPhoneNumber(command);
                voiceFormStep++;
                speak('What is the monthly salary in dollars?');
                showVoiceFeedback('Step 4: Salary');
                break;
                
            case 3: // Salary
                voiceFormData.salary = extractNumber(command);
                voiceFormStep++;
                speak('What is the status? Say active or inactive');
                showVoiceFeedback('Step 5: Status');
                break;
                
            case 4: // Status
                voiceFormData.status = command.includes('inactive') ? 'Inactive' : 'Active';
                saveVoiceTrainer();
                break;
        }
    }
    
    else if (voiceFormMode === 'createPayment') {
        switch(voiceFormStep) {
            case 0: // Member selection
                const memberId = extractNumber(command);
                const member = members.find(m => m.id === memberId);
                if (member) {
                    voiceFormData.memberId = member.id;
                    voiceFormData.memberName = member.name;
                    voiceFormStep++;
                    speak(`Selected ${member.name}. What is the payment amount in dollars?`);
                    showVoiceFeedback('Step 2: Amount');
                } else {
                    speak('Member not found. Please say the member ID number again');
                }
                break;
                
            case 1: // Amount
                voiceFormData.amount = extractNumber(command);
                voiceFormStep++;
                speak('Is the payment paid or due?');
                showVoiceFeedback('Step 3: Status');
                break;
                
            case 2: // Status
                voiceFormData.status = command.includes('paid') ? 'Paid' : 'Due';
                saveVoicePayment();
                break;
        }
    }
    
    else if (voiceFormMode === 'createPremium') {
        switch(voiceFormStep) {
            case 0: // Name
                voiceFormData.name = capitalizeWords(command);
                voiceFormStep++;
                speak('What is the phone number?');
                showVoiceFeedback('Step 2: Phone');
                break;
                
            case 1: // Phone
                voiceFormData.phone = extractPhoneNumber(command);
                voiceFormStep++;
                speak('What is the plan? Say monthly, quarterly, or annual');
                showVoiceFeedback('Step 3: Plan');
                break;
                
            case 2: // Plan
                if (command.includes('monthly')) {
                    voiceFormData.plan = 'Monthly Premium';
                    voiceFormData.amount = 150;
                } else if (command.includes('quarterly')) {
                    voiceFormData.plan = 'Quarterly Premium';
                    voiceFormData.amount = 400;
                } else {
                    voiceFormData.plan = 'Annual Premium';
                    voiceFormData.amount = 1500;
                }
                voiceFormStep++;
                speak('Is the payment paid or due?');
                showVoiceFeedback('Step 4: Payment Status');
                break;
                
            case 3: // Payment status
                voiceFormData.payment = command.includes('paid') ? 'Paid' : 'Due';
                voiceFormStep++;
                speak('Assign a trainer? Say trainer ID number or say skip');
                showVoiceFeedback('Step 5: Trainer');
                break;
                
            case 4: // Trainer
                if (command.includes('skip')) {
                    voiceFormData.trainerId = null;
                    voiceFormData.trainerName = null;
                } else {
                    const trainerId = extractNumber(command);
                    const trainer = trainers.find(t => t.id === trainerId);
                    if (trainer) {
                        voiceFormData.trainerId = trainer.id;
                        voiceFormData.trainerName = trainer.name;
                    }
                }
                saveVoicePremium();
                break;
        }
    }
    
    else if (voiceFormMode === 'markAttendance') {
        switch(voiceFormStep) {
            case 0: // Member
                const memberId = extractNumber(command);
                const member = members.find(m => m.id === memberId && m.status === 'Active');
                if (member) {
                    voiceFormData.memberId = member.id;
                    voiceFormData.memberName = member.name;
                    voiceFormStep++;
                    speak(`Selected ${member.name}. What shift? Say morning, evening, or night`);
                    showVoiceFeedback('Step 2: Shift');
                } else {
                    speak('Member not found or inactive. Please say member ID again');
                }
                break;
                
            case 1: // Shift
                if (command.includes('evening')) {
                    voiceFormData.shift = 'Evening';
                } else if (command.includes('night')) {
                    voiceFormData.shift = 'Night';
                } else {
                    voiceFormData.shift = 'Morning';
                }
                saveVoiceAttendance();
                break;
        }
    }
    
    else if (voiceFormMode === 'addEquipment') {
        switch(voiceFormStep) {
            case 0: // Name
                voiceFormData.name = capitalizeWords(command);
                voiceFormStep++;
                speak('What is the category? Say cardio, strength, or other');
                showVoiceFeedback('Step 2: Category');
                break;
                
            case 1: // Category
                if (command.includes('cardio')) {
                    voiceFormData.category = 'Cardio';
                } else if (command.includes('strength')) {
                    voiceFormData.category = 'Strength';
                } else {
                    voiceFormData.category = 'Other';
                }
                voiceFormStep++;
                speak('How many pieces?');
                showVoiceFeedback('Step 3: Quantity');
                break;
                
            case 2: // Quantity
                voiceFormData.quantity = extractNumber(command);
                voiceFormStep++;
                speak('What is the cost per item in dollars?');
                showVoiceFeedback('Step 4: Cost');
                break;
                
            case 3: // Cost
                voiceFormData.cost = extractNumber(command);
                voiceFormStep++;
                speak('What is the status? Say working, broken, or missing');
                showVoiceFeedback('Step 5: Status');
                break;
                
            case 4: // Status
                if (command.includes('broken')) {
                    voiceFormData.status = 'Broken';
                } else if (command.includes('missing')) {
                    voiceFormData.status = 'Missing';
                } else {
                    voiceFormData.status = 'Working';
                }
                saveVoiceEquipment();
                break;
        }
    }
    
    else if (voiceFormMode === 'createReceipt') {
        switch(voiceFormStep) {
            case 0: // Member
                const memberId = extractNumber(command);
                const member = members.find(m => m.id === memberId);
                if (member) {
                    voiceFormData.member = member;
                    voiceFormStep++;
                    speak(`Selected ${member.name}. What is the payment amount in dollars?`);
                    showVoiceFeedback('Step 2: Amount');
                } else {
                    speak('Member not found. Please say member ID again');
                }
                break;
                
            case 1: // Amount
                voiceFormData.amount = extractNumber(command);
                voiceFormStep++;
                speak('What is the payment method? Say cash, card, or online');
                showVoiceFeedback('Step 3: Payment Method');
                break;
                
            case 2: // Payment method
                if (command.includes('card')) {
                    voiceFormData.paymentMethod = 'Card';
                } else if (command.includes('online')) {
                    voiceFormData.paymentMethod = 'Online';
                } else {
                    voiceFormData.paymentMethod = 'Cash';
                }
                saveVoiceReceipt();
                break;
        }
    }
    
    // In handleVoiceFormInput() for generateReport
else if (voiceFormMode === 'generateReport') {
    const reportType = command.includes('all') || command.includes('complete') ? 'all' :
                      command.includes('revenue') ? 'revenue' :
                      command.includes('member') && !command.includes('attendance') ? 'members' :
                      command.includes('trainer') && command.includes('attendance') ? 'trainer-attendance' :
                      command.includes('trainer') && command.includes('salary') ? 'trainer-salary' :
                      command.includes('trainer') ? 'trainers' :
                      command.includes('attendance') ? 'attendance' : 'summary';
    voiceFormData.reportType = reportType;
    saveVoiceReport();
}
    
    else if (voiceFormMode === 'paySalary') {
        const trainerId = extractNumber(command);
        const trainer = trainers.find(t => t.id === trainerId && t.status === 'Active');
        if (trainer) {
            voiceFormData.trainer = trainer;
            saveVoiceSalary();
        } else {
            speak('Trainer not found or inactive. Please say trainer ID again');
        }
    }
}

// ========== SAVE FUNCTIONS ==========

async function saveVoiceMember() {
    speak('Saving member. Please wait');
    showVoiceFeedback('Saving...');
    
    try {
        const response = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voiceFormData)
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderMembers();
            updateDashboard();
            speak(`Member ${voiceFormData.name} created successfully with ID ${result.data.id}`);
            showToast('Member created successfully', 'success');
        } else {
            speak('Failed to create member');
            showToast('Failed to create member', 'error');
        }
    } catch (error) {
        speak('Error creating member');
        showToast('Error creating member', 'error');
    }
    
    voiceFormMode = null;
    voiceFormData = {};
    voiceFormStep = 0;
}

async function saveVoiceTrainer() {
    speak('Saving trainer. Please wait');
    showVoiceFeedback('Saving...');
    
    try {
        const response = await fetch('/api/trainers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voiceFormData)
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderTrainers();
            updateDashboard();
            speak(`Trainer ${voiceFormData.name} created successfully with ID ${result.data.id}`);
            showToast('Trainer created successfully', 'success');
        } else {
            speak('Failed to create trainer');
            showToast('Failed to create trainer', 'error');
        }
    } catch (error) {
        speak('Error creating trainer');
        showToast('Error creating trainer', 'error');
    }
    
    voiceFormMode = null;
    voiceFormData = {};
    voiceFormStep = 0;
}

async function saveVoicePayment() {
    speak('Saving payment. Please wait');
    showVoiceFeedback('Saving...');
    
    try {
        const paymentData = {
            memberId: voiceFormData.memberId,
            memberName: voiceFormData.memberName,
            amount: voiceFormData.amount,
            status: voiceFormData.status,
            date: new Date().toISOString().split('T')[0]
        };
        
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderPayments();
            updateDashboard();
            speak(`Payment of ${voiceFormData.amount} dollars for ${voiceFormData.memberName} saved successfully`);
            showToast('Payment saved successfully', 'success');
        } else {
            speak('Failed to save payment');
            showToast('Failed to save payment', 'error');
        }
    } catch (error) {
        speak('Error saving payment');
        showToast('Error saving payment', 'error');
    }
    
    voiceFormMode = null;
    voiceFormData = {};
    voiceFormStep = 0;
}

async function saveVoicePremium() {
    speak('Saving premium member. Please wait');
    showVoiceFeedback('Saving...');
    
    try {
        const premiumData = {
            name: voiceFormData.name,
            type: 'Premium',
            phone: voiceFormData.phone,
            amount: voiceFormData.amount,
            status: 'Active',
            payment: voiceFormData.payment,
            plan: voiceFormData.plan,
            trainerId: voiceFormData.trainerId,
            trainerName: voiceFormData.trainerName
        };
        
        const response = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(premiumData)
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            
            if (voiceFormData.payment === 'Paid') {
                await fetch('/api/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberId: result.data.id,
                        memberName: result.data.name,
                        amount: result.data.amount,
                        status: 'Paid'
                    })
                });
                await loadDataFromServer();
            }
            
            renderMembers();
            renderPremiumSection();
            renderPayments();
            updateDashboard();
            speak(`Premium member ${voiceFormData.name} created successfully`);
            showToast('Premium member created successfully', 'success');
        } else {
            speak('Failed to create premium member');
            showToast('Failed to create premium member', 'error');
        }
    } catch (error) {
        speak('Error creating premium member');
        showToast('Error creating premium member', 'error');
    }
    
    voiceFormMode = null;
    voiceFormData = {};
    voiceFormStep = 0;
}

async function saveVoiceAttendance() {
    speak('Saving attendance. Please wait');
    showVoiceFeedback('Saving...');
    
    try {
        const attendanceData = {
            memberId: voiceFormData.memberId,
            memberName: voiceFormData.memberName,
            shift: voiceFormData.shift,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString().split('T')[0]
        };
        
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceData)
        });
        
        const result = await response.json();
        if (result.success) {
            // ✅ ADD THIS: Reload data first
            await loadDataFromServer();
            
            // ✅ THEN render
            renderAttendance();
            updateDashboard();
            
            speak(`Attendance marked for ${voiceFormData.memberName} for ${voiceFormData.shift} shift`);
            showToast('Attendance marked successfully', 'success');
        } else {
            speak('Failed to mark attendance');
            showToast('Failed to mark attendance', 'error');
        }
    } catch (error) {
        speak('Error marking attendance');
        showToast('Error marking attendance', 'error');
    }
    
    voiceFormMode = null;
    voiceFormData = {};
    voiceFormStep = 0;
}

async function saveVoiceEquipment() {
    speak('Saving equipment. Please wait');
    showVoiceFeedback('Saving...');
    
    try {
        const equipmentData = {
            name: voiceFormData.name,
            category: voiceFormData.category,
            quantity: voiceFormData.quantity,
            cost: voiceFormData.cost,
            status: voiceFormData.status,
            purchaseDate: new Date().toISOString().split('T')[0]
        };
        
        const response = await fetch('/api/equipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(equipmentData)
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderEquipment();
            updateDashboard();
            speak(`Equipment ${voiceFormData.name} added successfully with ID ${result.data.id}`);
            showToast('Equipment added successfully', 'success');
        } else {
            speak('Failed to add equipment');
            showToast('Failed to add equipment', 'error');
        }
    } catch (error) {
        speak('Error adding equipment');
        showToast('Error adding equipment', 'error');
    }
    
    voiceFormMode = null;
    voiceFormData = {};
    voiceFormStep = 0;
}

async function saveVoiceReceipt() {
    speak('Generating receipt. Please wait');
    showVoiceFeedback('Saving...');
    
    try {
        const member = voiceFormData.member;
        const receiptNumber = 'RCP' + Date.now();
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedTime = currentDate.toLocaleTimeString('en-US');
        const description = 'Membership Fee';
        
        const receiptHTML = `
            <div class="receipt-content">
                <div class="receipt-header">
                    <h2>DENIM GYM</h2>
                    <p>Payment Receipt</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Receipt #: ${receiptNumber}</p>
                </div>
                
                <div style="margin: 1.5rem 0;">
                    <div class="receipt-row">
                        <span>Date:</span>
                        <strong>${formattedDate}</strong>
                    </div>
                    <div class="receipt-row">
                        <span>Time:</span>
                        <strong>${formattedTime}</strong>
                    </div>
                </div>
                
                <div style="margin: 1.5rem 0;">
                    <h3 style="border-bottom: 2px solid #000; padding-bottom: 0.5rem;">Customer Details</h3>
                    <div class="receipt-row">
                        <span>Name:</span>
                        <strong>${member.name}</strong>
                    </div>
                    <div class="receipt-row">
                        <span>Member ID:</span>
                        <strong>${member.id}</strong>
                    </div>
                    <div class="receipt-row">
                        <span>Member Type:</span>
                        <strong>${member.type}</strong>
                    </div>
                    <div class="receipt-row">
                        <span>Phone:</span>
                        <strong>${member.phone}</strong>
                    </div>
                </div>
                
                <div style="margin: 1.5rem 0;">
                    <h3 style="border-bottom: 2px solid #000; padding-bottom: 0.5rem;">Payment Details</h3>
                    <div class="receipt-row">
                        <span>Description:</span>
                        <strong>${description}</strong>
                    </div>
                    <div class="receipt-row">
                        <span>Payment Method:</span>
                        <strong>${voiceFormData.paymentMethod}</strong>
                    </div>
                    <div class="receipt-row total">
                        <span>TOTAL AMOUNT:</span>
                        <strong>$${voiceFormData.amount.toFixed(2)}</strong>
                    </div>
                </div>
                
                <div class="receipt-footer">
                    <p>Thank you for your payment!</p>
                    <p>For any queries, please contact us at: contact@denimgym.com</p>
                    <p style="margin-top: 1rem; font-size: 0.85rem;">This is a computer-generated receipt.</p>
                </div>
            </div>
        `;
        
        const receiptData = {
            receiptNumber: receiptNumber,
            memberId: member.id,
            memberName: member.name,
            memberType: member.type,
            amount: voiceFormData.amount,
            paymentMethod: voiceFormData.paymentMethod,
            description: description,
            date: currentDate.toISOString().split('T')[0],
            time: formattedTime,
            htmlContent: receiptHTML
        };
        
        const response = await fetch('/api/receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receiptData)
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderReceipts();
            speak(`Receipt generated successfully for ${member.name}. Receipt number ${receiptNumber}`);
            showToast('Receipt generated successfully', 'success');
        } else {
            speak('Failed to generate receipt');
            showToast('Failed to generate receipt', 'error');
        }
    } catch (error) {
        speak('Error generating receipt');
        showToast('Error generating receipt', 'error');
    }
    
    voiceFormMode = null;
    voiceFormData = {};
    voiceFormStep = 0;
}

async function saveVoiceReport() {
    speak('Generating report. Please wait');
    showVoiceFeedback('Generating...');
    
    try {
        let reportContent = '';
        let reportTitle = '';
        
        switch(voiceFormData.reportType) {
            case 'summary':
                reportContent = generateSummaryReport();
                reportTitle = 'Summary Report';
                break;
            case 'revenue':
                reportContent = generateRevenueReport();
                reportTitle = 'Revenue Report';
                break;
            case 'members':
                reportContent = generateMembersReport();
                reportTitle = 'Members Report';
                break;
            case 'trainers':
                reportContent = generateTrainersReport();
                reportTitle = 'Trainers Report';
                break;
        }
        
        const reportData = {
            reportType: voiceFormData.reportType,
            reportTitle: reportTitle,
            htmlContent: reportContent,
            generatedDate: new Date().toISOString().split('T')[0]
        };
        
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
        });
        
        const result = await response.json();
        if (result.success) {
            await loadReportsFromServer();
            renderReports();
            speak(`${reportTitle} generated successfully`);
            showToast('Report generated successfully', 'success');
        } else {
            speak('Failed to generate report');
            showToast('Failed to generate report', 'error');
        }
    } catch (error) {
        speak('Error generating report');
        showToast('Error generating report', 'error');
    }
    
    voiceFormMode = null;
    voiceFormData = {};
    voiceFormStep = 0;
}

async function saveVoiceSalary() {
    speak('Processing salary payment. Please wait');
    showVoiceFeedback('Processing...');
    
    try {
        const trainer = voiceFormData.trainer;
        
        const salaryData = {
            trainerId: trainer.id,
            trainerName: trainer.name,
            amount: trainer.salary,
            status: 'Paid'
        };
        
        const response = await fetch('/api/trainer-salaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salaryData)
        });
        
        const result = await response.json();
        if (result.success) {
            await loadDataFromServer();
            renderTrainerSalarySection();
            updateDashboard();
            speak(`Salary of ${trainer.salary} dollars paid to ${trainer.name} successfully`);
            showToast('Salary paid successfully', 'success');
        } else {
            speak('Failed to pay salary');
            showToast('Failed to pay salary', 'error');
        }
    } catch (error) {
        speak('Error processing salary payment');
        showToast('Error processing salary payment', 'error');
    }
    
    voiceFormMode = null;
    voiceFormData = {};
    voiceFormStep = 0;
}

// ========== START VOICE FORM FUNCTIONS ==========

function startVoiceCreateTrainer() {
    voiceFormMode = 'createTrainer';
    voiceFormData = {};
    voiceFormStep = 0;
    speak('Creating new trainer. What is the trainer name?');
    showVoiceFeedback('Creating Trainer - Step 1: Name');
}

function startVoiceCreatePayment() {
    voiceFormMode = 'createPayment';
    voiceFormData = {};
    voiceFormStep = 0;
    speak('Creating new payment. Say the member ID number');
    showVoiceFeedback('Creating Payment - Step 1: Member ID');
}

function startVoiceCreatePremium() {
    voiceFormMode = 'createPremium';
    voiceFormData = {};
    voiceFormStep = 0;
    speak('Creating new premium member. What is the member name?');
    showVoiceFeedback('Creating Premium - Step 1: Name');
}

function startVoiceMarkAttendance() {
    voiceFormMode = 'markAttendance';
    voiceFormData = {};
    voiceFormStep = 0;
    speak('Marking attendance. Say the member ID number');
    showVoiceFeedback('Marking Attendance - Step 1: Member ID');
}

function startVoiceAddEquipment() {
    voiceFormMode = 'addEquipment';
    voiceFormData = {};
    voiceFormStep = 0;
    speak('Adding new equipment. What is the equipment name?');
    showVoiceFeedback('Adding Equipment - Step 1: Name');
}

function startVoiceCreateReceipt() {
    voiceFormMode = 'createReceipt';
    voiceFormData = {};
    voiceFormStep = 0;
    speak('Creating receipt. Say the member ID number');
    showVoiceFeedback('Creating Receipt - Step 1: Member ID');
}

// In startVoiceGenerateReport() function
function startVoiceGenerateReport() {
    voiceFormMode = 'generateReport';
    voiceFormData = {};
    voiceFormStep = 0;
    speak('Generating report. What type of report? Say all reports, summary, revenue, members, trainers, trainer attendance, trainer salary, or member attendance');
    showVoiceFeedback('Generating Report - Choose Type');
}

function startVoicePaySalary() {
    voiceFormMode = 'paySalary';
    voiceFormData = {};
    voiceFormStep = 0;
    speak('Paying trainer salary. Say the trainer ID number');
    showVoiceFeedback('Paying Salary - Step 1: Trainer ID');
}

// ========== HELPER FUNCTIONS ==========

function capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

function extractPhoneNumber(str) {
    // Extract digits only
    const digits = str.replace(/\D/g, '');
    // Format as phone number if 10 digits
    if (digits.length === 10) {
        return `(${digits.substr(0,3)}) ${digits.substr(3,3)}-${digits.substr(6,4)}`;
    }
    return digits;
}

function extractNumber(str) {
    // Remove common words and extract number
    const cleaned = str.replace(/dollars?|dollar|rupees?|rupee/gi, '').trim();
    const number = parseFloat(cleaned.replace(/[^\d.]/g, ''));
    return isNaN(number) ? 0 : number;
}

// Navigate to section
function navigateTo(section) {
    switchSection(section);
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));
    const targetNav = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }
    
    showVoiceFeedback(`Navigating to ${section}`);
}

// Close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('show'));
}

// Show voice help
function showVoiceHelp() {
    const helpCommands = [
        '════════════════════════════════════',
        '🎤 VOICE CONTROL COMMANDS',
        '════════════════════════════════════',
        '',
        '📍 NAVIGATION COMMANDS:',
        '• "Dashboard" - Go to dashboard',
        '• "Payments" - View all payments',
        '• "Members" - View all members',
        '• "Trainers" - View all trainers',
        '• "Premium" - View premium members',
        '• "Attendance" - View attendance',
        '• "Equipment" - View equipment',
        '• "Receipts" - View receipts',
        '• "Reports" - View reports',
        '• "Settings" - Open settings',
        '',
        '➕ CREATE COMMANDS:',
        '• "Create member" - Add new member',
        '• "Create trainer" - Add new trainer',
        '• "Create payment" - Add payment record',
        '• "Create premium" - Add premium member',
        '• "Mark attendance" - Record attendance',
        '• "Add equipment" - Add equipment',
        '• "Create receipt" - Generate receipt',
        '• "Generate report" - Create report',
        '• "Pay salary" - Pay trainer salary',
        '',
        '💰 STATISTICS COMMANDS:',
        '• "Total revenue" - Show revenue',
        '• "Total members" - Show member count',
        '• "Total trainers" - Show trainer count',
        '',
        '💾 BACKUP COMMANDS:',
        '• "Create backup" - Create backup now',
        '• "Backup" - Open backup options',
        '• "Restore" - Open restore options',
        '',
        '🔧 OTHER COMMANDS:',
        '• "Cancel" - Cancel current action',
        '• "Close" - Close modal',
        '• "Help" - Show this help',
        '',
        '════════════════════════════════════',
        '💡 TIP: Speak clearly and wait for',
        '   the system to respond before',
        '   giving the next command.',
        '════════════════════════════════════'
    ];
    
    speak('I can help you navigate, create records, view statistics, and manage backups. Available commands include: dashboard, create member, create payment, mark attendance, add equipment, generate report, pay salary, and more. Check the help window for the complete list.');
    
    // Show help in a better formatted alert
    alert(helpCommands.join('\n'));
}

// Initialize voice control on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize speech recognition but don't start it
    initializeVoiceRecognition();
});

// ========== VOICE CONTROL STATISTICS QUERIES ==========

// Handle voice queries for viewing payment history
function handleViewPaymentHistory(command) {
    const memberId = extractNumber(command);
    const member = members.find(m => m.id === memberId);
    
    if (member) {
        viewMemberPayments(memberId);
        speak(`Opening payment history for ${member.name}`);
    } else {
        speak('Member not found. Please say a valid member ID');
    }
}

// Handle voice queries for viewing salary history
function handleViewSalaryHistory(command) {
    const trainerId = extractNumber(command);
    const trainer = trainers.find(t => t.id === trainerId);
    
    if (trainer) {
        viewTrainerSalaryHistory(trainerId);
        speak(`Opening salary history for ${trainer.name}`);
    } else {
        speak('Trainer not found. Please say a valid trainer ID');
    }
}

// Add these to processVoiceCommand function (insert before "UNKNOWN COMMAND" section):

// ========== VIEW HISTORY COMMANDS ==========
/*
if (command.includes('payment history') || command.includes('view payments')) {
    if (command.match(/\d+/)) {
        handleViewPaymentHistory(command);
        return;
    } else {
        speak('Please say the member ID number to view payment history');
        return;
    }
}

if (command.includes('salary history') || command.includes('view salary')) {
    if (command.match(/\d+/)) {
        handleViewSalaryHistory(command);
        return;
    } else {
        speak('Please say the trainer ID number to view salary history');
        return;
    }
}
*/

// ============= CURRENCY CONVERSION SYSTEM (SIMPLIFIED) =============

let currentCurrency = 'INR';
const USD_TO_INR = 83.12;

// 1. Display amounts (converts from INR storage)
function formatCurrency(amountInINR) {
    const num = parseFloat(amountInINR) || 0;
    
    if (currentCurrency === 'INR') {
        return '₹' + Math.round(num).toLocaleString('en-IN');
    } else {
        return '$' + (num / USD_TO_INR).toFixed(2);
    }
}

// 2. Convert user input TO INR (for saving)
function inputToINR(userInput) {
    const amount = parseFloat(userInput) || 0;
    
    if (currentCurrency === 'INR') {
        return amount; // Already INR
    } else {
        return amount * USD_TO_INR; // USD → INR
    }
}

// 3. Convert INR TO display (for input fields)
function inrToInput(amountInINR) {
    const amount = parseFloat(amountInINR) || 0;
    
    if (currentCurrency === 'INR') {
        return Math.round(amount);
    } else {
        return (amount / USD_TO_INR).toFixed(2);
    }
}

// 4. Change currency and refresh everything
function changeCurrency(currency) {
    currentCurrency = currency;
    localStorage.setItem('selectedCurrency', currency);
    
    // Refresh ALL displays
    updateDashboard();
    renderMembers();
    renderTrainers();
    renderPayments();
    renderPremiumSection();
    renderTrainerSalarySection();
    renderEquipment();
    renderReceipts();
    updateChartCurrency();
    
    showToast(`Currency changed to ${currency === 'INR' ? 'INR (₹)' : 'USD ($)'}`, 'success');
}

// 5. Initialize on page load
function initializeCurrency() {
    const saved = localStorage.getItem('selectedCurrency');
    currentCurrency = saved || 'INR';
    const select = document.getElementById('currencySelect');
    if (select) select.value = currentCurrency;
}

// 6. Update chart labels
function updateChartCurrency() {
    if (revenueChart) {
        revenueChart.options.scales.y.ticks.callback = function(value) {
            return formatCurrency(value);
        };
        revenueChart.update();
    }
    
    if (profitChart) {
        profitChart.options.scales.y.ticks.callback = function(value) {
            return formatCurrency(value);
        };
        profitChart.update();
    }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeCurrency();
    // ... rest of your initialization code
});

            