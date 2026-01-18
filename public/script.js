// Global State
let state = {
    trustedUserId: null,
    isAdmin: false,
    userData: null,
    config: null,
    tasks: [],
    referrals: [],
    withdrawals: [],
    adWatches: { hourly: 0, daily: 0 }
};

// Telegram WebApp API
const tg = window.Telegram.WebApp;

// Initialize App
async function initApp() {
    try {
        // Initialize Telegram WebApp
        tg.ready();
        tg.expand();
        
        // Get raw initData
        const initData = tg.initData;
        
        if (!initData) {
            showError('No Telegram data found. Please open from bot.');
            return;
        }
        
        // Step 1: Verify with backend
        const authResponse = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
        });
        
        if (!authResponse.ok) {
            showError('Invalid session. Please reopen from bot.');
            return;
        }
        
        const authData = await authResponse.json();
        state.trustedUserId = authData.userId;
        state.isAdmin = authData.isAdmin;
        
        // Step 2: Get or create user
        const referrerId = getReferrerIdFromUrl();
        const userResponse = await fetch('/api/user/get-or-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: state.trustedUserId,
                firstName: authData.firstName,
                username: authData.username,
                referrerId
            })
        });
        
        const userData = await userResponse.json();
        state.userData = userData;
        
        // Load config
        await loadConfig();
        
        // Show appropriate page
        if (state.isAdmin) {
            showPage('admin');
            loadAdminData();
        } else {
            showPage('home');
            updateHomeUI();
            setupNavigation();
        }
        
    } catch (error) {
        console.error('Init error:', error);
        showError('Failed to initialize app. Please try again.');
    }
}

// Get referrer ID from URL
function getReferrerIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start');
    if (startParam && startParam.startsWith('ref_')) {
        return startParam.substring(4);
    }
    return null;
}

// Load Config
async function loadConfig() {
    const response = await fetch('/api/config/get');
    state.config = await response.json();
}

// Show Error
function showError(message) {
    hideAllScreens();
    const errorScreen = document.getElementById('error-screen');
    errorScreen.querySelector('p').textContent = message;
    errorScreen.classList.add('active');
}

// Hide All Screens
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Show Page
function showPage(pageName) {
    hideAllScreens();
    const page = document.getElementById(`${pageName}-page`);
    if (page) {
        page.classList.add('active');
    }
}

// Setup Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show page
            showPage(page);
            
            // Load page data
            switch(page) {
                case 'home':
                    updateHomeUI();
                    break;
                case 'tasks':
                    loadTasks();
                    break;
                case 'earn':
                    updateEarnUI();
                    break;
                case 'refer':
                    updateReferUI();
                    break;
                case 'withdraw':
                    updateWithdrawUI();
                    break;
            }
        });
    });
}

// Update Home UI
function updateHomeUI() {
    document.getElementById('balance-display').textContent = state.userData.balance.toFixed(2);
    document.getElementById('total-earned').textContent = state.userData.totalEarned.toFixed(2);
    document.getElementById('streak-display').textContent = state.userData.streak;
    document.getElementById('today-earnings').textContent = '0.00'; // Would need transaction log
    
    // Daily checkin button
    const checkinBtn = document.getElementById('daily-checkin-btn');
    checkinBtn.onclick = handleDailyCheckin;
}

// Handle Daily Checkin
async function handleDailyCheckin() {
    try {
        const response = await fetch('/api/daily/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: state.trustedUserId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            state.userData = result.userData;
            updateHomeUI();
            showNotification(`✅ Claimed ${result.reward} reward! Streak: ${result.streak} days`);
        } else {
            showNotification(result.message || 'Already claimed today');
        }
    } catch (error) {
        console.error('Checkin error:', error);
        showNotification('Failed to claim reward');
    }
}

// Load Tasks
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks/list');
        state.tasks = await response.json();
        
        const tasksList = document.getElementById('tasks-list');
        tasksList.innerHTML = '';
        
        if (state.tasks.length === 0) {
            tasksList.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">No tasks available</p>';
            return;
        }
        
        state.tasks.forEach(task => {
            const isCompleted = state.userData.completedTasks.includes(task.taskId);
            const taskCard = createTaskCard(task, isCompleted);
            tasksList.appendChild(taskCard);
        });
    } catch (error) {
        console.error('Load tasks error:', error);
    }
}

// Create Task Card
function createTaskCard(task, isCompleted) {
    const card = document.createElement('div');
    card.className = `task-card ${isCompleted ? 'completed' : ''}`;
    
    card.innerHTML = `
        <div class="task-header">
            <div class="task-title">${task.title}</div>
            <div class="task-reward">+${task.reward}</div>
        </div>
        <div class="task-actions">
            ${!isCompleted ? `
                <button class="btn btn-secondary" onclick="openTaskLink('${task.link}', '${task.taskId}')">Go to Task</button>
                <button class="btn btn-primary" id="complete-${task.taskId}" style="display:none;" onclick="completeTask('${task.taskId}')">Complete</button>
            ` : '<span style="color:var(--accent-success);">✓ Completed</span>'}
        </div>
    `;
    
    return card;
}

// Open Task Link
function openTaskLink(link, taskId) {
    window.open(link, '_blank');
    
    // Show complete button after 5 seconds
    setTimeout(() => {
        const completeBtn = document.getElementById(`complete-${taskId}`);
        if (completeBtn) {
            completeBtn.style.display = 'inline-flex';
        }
    }, 5000);
}

// Complete Task
async function completeTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/complete/${taskId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: state.trustedUserId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            state.userData = result.userData;
            showNotification(`✅ Task completed! Earned ${result.reward}`);
            loadTasks();
        } else {
            showNotification(result.message || 'Failed to complete task');
        }
    } catch (error) {
        console.error('Complete task error:', error);
        showNotification('Failed to complete task');
    }
}

// Update Earn UI
async function updateEarnUI() {
    document.getElementById('ad-reward-display').textContent = state.config.adReward.toFixed(2);
    
    // Load ad watch counts
    try {
        const response = await fetch(`/api/ads/counts?userId=${state.trustedUserId}`);
        const counts = await response.json();
        
        state.adWatches = counts;
        document.getElementById('hourly-count').textContent = counts.hourly;
        document.getElementById('daily-count').textContent = counts.daily;
        document.getElementById('hourly-limit').textContent = counts.hourlyLimit;
        document.getElementById('daily-limit').textContent = counts.dailyLimit;
        
        const watchBtn = document.getElementById('watch-ad-btn');
        watchBtn.disabled = counts.hourly >= counts.hourlyLimit || counts.daily >= counts.dailyLimit;
        watchBtn.onclick = watchAd;
    } catch (error) {
        console.error('Load ad counts error:', error);
    }
}

// Watch Ad
async function watchAd() {
    // Simulate ad watching (in production, integrate real ad SDK)
    showNotification('Loading ad...');
    
    // Simulate ad completion after 3 seconds
    setTimeout(async () => {
        try {
            const response = await fetch('/api/ads/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.trustedUserId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                state.userData = result.userData;
                showNotification(`✅ Earned ${result.reward}!`);
                updateEarnUI();
            } else {
                showNotification(result.message || 'Failed to complete ad');
            }
        } catch (error) {
            console.error('Ad complete error:', error);
            showNotification('Failed to complete ad');
        }
    }, 3000);
}

// Update Refer UI
async function updateReferUI() {
    document.getElementById('referral-bonus-display').textContent = state.config.referralBonus.toFixed(2);
    document.getElementById('referral-count').textContent = state.userData.referrals;
    
    // Generate referral link
    const botUsername = 'YOUR_BOT_USERNAME'; // Replace with actual bot username
    const referralLink = `https://t.me/${botUsername}?start=ref_${state.trustedUserId}`;
    document.getElementById('referral-link').value = referralLink;
    
    // Copy link button
    document.getElementById('copy-link-btn').onclick = () => {
        navigator.clipboard.writeText(referralLink);
        showNotification('✅ Link copied!');
    };
    
    // Share link button
    document.getElementById('share-link-btn').onclick = () => {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Join me and earn rewards!`);
    };
    
    // Load referrals list
    try {
        const response = await fetch(`/api/referrals/list?userId=${state.trustedUserId}`);
        state.referrals = await response.json();
        
        const container = document.getElementById('referrals-container');
        container.innerHTML = '';
        
        if (state.referrals.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">No referrals yet</p>';
            return;
        }
        
        state.referrals.forEach(ref => {
            const item = document.createElement('div');
            item.className = 'referral-item';
            item.innerHTML = `
                <div class="referral-name">${ref.firstName || ref.username || 'User'}</div>
                <div class="referral-date">${new Date(ref.createdAt).toLocaleDateString()}</div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Load referrals error:', error);
    }
}

// Update Withdraw UI
async function updateWithdrawUI() {
    document.getElementById('withdraw-balance').textContent = state.userData.balance.toFixed(2);
    document.getElementById('min-withdraw-display').textContent = state.config.minWithdraw.toFixed(2);
    
    // Withdraw form
    const form = document.getElementById('withdraw-form');
    form.onsubmit = handleWithdrawRequest;
    
    // Load withdrawal history
    try {
        const response = await fetch(`/api/withdraw/history?userId=${state.trustedUserId}`);
        state.withdrawals = await response.json();
        
        const container = document.getElementById('withdraw-history-container');
        container.innerHTML = '';
        
        if (state.withdrawals.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">No withdrawal history</p>';
            return;
        }
        
        state.withdrawals.forEach(withdrawal => {
            const item = document.createElement('div');
            item.className = 'withdraw-item';
            item.innerHTML = `
                <div class="withdraw-item-header">
                    <span class="withdraw-amount-display">${withdrawal.amount.toFixed(2)}</span>
                    <span class="withdraw-status ${withdrawal.status}">${withdrawal.status}</span>
                </div>
                <div class="withdraw-wallet">${withdrawal.wallet}</div>
                <div style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-top:var(--space-1);">
                    ${new Date(withdrawal.requestedAt).toLocaleString()}
                </div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Load withdrawal history error:', error);
    }
}

// Handle Withdraw Request
async function handleWithdrawRequest(e) {
    e.preventDefault();
    
    const wallet = document.getElementById('wallet-address').value;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    
    if (amount < state.config.minWithdraw) {
        showNotification(`Minimum withdrawal is ${state.config.minWithdraw}`);
        return;
    }
    
    if (amount > state.userData.balance) {
        showNotification('Insufficient balance');
        return;
    }
    
    try {
        const response = await fetch('/api/withdraw/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: state.trustedUserId,
                amount,
                wallet
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            state.userData = result.userData;
            showNotification('✅ Withdrawal request submitted! Balance deducted.');
            document.getElementById('withdraw-form').reset();
            updateWithdrawUI();
        } else {
            showNotification(result.message || 'Failed to submit withdrawal');
        }
    } catch (error) {
        console.error('Withdraw request error:', error);
        showNotification('Failed to submit withdrawal');
    }
}

// Admin Functions
async function loadAdminData() {
    // Load config
    const configResponse = await fetch('/api/config/get');
    const config = await configResponse.json();
    
    document.getElementById('ad-reward').value = config.adReward;
    document.getElementById('daily-login-reward').value = config.dailyLoginReward;
    document.getElementById('referral-bonus').value = config.referralBonus;
    document.getElementById('new-user-bonus').value = config.newUserBonus;
    document.getElementById('min-withdraw').value = config.minWithdraw;
    
    // Config form
    document.getElementById('config-form').onsubmit = handleConfigUpdate;
    
    // Admin tabs
    setupAdminTabs();
    
    // Load tasks
    loadAdminTasks();
    
    // Load withdrawals
    loadPendingWithdrawals();
    
    // Add task button
    document.getElementById('add-task-btn').onclick = () => {
        document.getElementById('task-modal').classList.add('active');
    };
    
    // Task modal close
    document.querySelector('.modal-close').onclick = () => {
        document.getElementById('task-modal').classList.remove('active');
    };
    
    // Task form
    document.getElementById('task-form').onsubmit = handleTaskCreate;
}

// Setup Admin Tabs
function setupAdminTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });
}

// Handle Config Update
async function handleConfigUpdate(e) {
    e.preventDefault();
    
    const config = {
        adReward: parseFloat(document.getElementById('ad-reward').value),
        dailyLoginReward: parseFloat(document.getElementById('daily-login-reward').value),
        referralBonus: parseFloat(document.getElementById('referral-bonus').value),
        newUserBonus: parseFloat(document.getElementById('new-user-bonus').value),
        minWithdraw: parseFloat(document.getElementById('min-withdraw').value)
    };
    
    try {
        const response = await fetch('/api/config/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: state.trustedUserId, config })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Config updated!');
            await loadConfig();
        } else {
            showNotification('Failed to update config');
        }
    } catch (error) {
        console.error('Config update error:', error);
        showNotification('Failed to update config');
    }
}

// Load Admin Tasks
async function loadAdminTasks() {
    const response = await fetch('/api/tasks/list');
    const tasks = await response.json();
    
    const container = document.getElementById('admin-tasks-list');
    container.innerHTML = '';
    
    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-card';
        item.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-reward">+${task.reward}</div>
            </div>
            <div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-top:var(--space-2);">
                ${task.type} - ${task.link}
            </div>
        `;
        container.appendChild(item);
    });
}

// Handle Task Create
async function handleTaskCreate(e) {
    e.preventDefault();
    
    const task = {
        title: document.getElementById('task-title').value,
        reward: parseFloat(document.getElementById('task-reward').value),
        link: document.getElementById('task-link').value,
        type: document.getElementById('task-type').value
    };
    
    try {
        const response = await fetch('/api/tasks/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: state.trustedUserId, task })
        });
        
        const resu
