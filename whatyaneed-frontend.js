// WhatYaNeed - Frontend with SESSION FIX
const API_URL = 'http://localhost:3000/api';

let currentUser = null;
let allRequests = [];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 WhatYaNeed Frontend Initialized');
    console.log('📡 API URL:', API_URL);
    initializeEventListeners();
    checkAuthStatus();
    loadHomeRequests();
});

// ==================== EVENT LISTENERS ====================
function initializeEventListeners() {
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const manageAccountModal = document.getElementById('manage-account-modal');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const closeLogin = document.getElementById('close-login');
    const closeRegister = document.getElementById('close-register');
    const closeManageAccount = document.getElementById('close-manage-account');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const requestForm = document.getElementById('request-form');
    const logoutBtn = document.getElementById('logout-btn');
    const manageAccountBtn = document.getElementById('manage-account-btn');
    const notificationBell = document.getElementById('notification-bell');
    const homeSearchBtn = document.getElementById('home-search-btn');
    const homeSearchInput = document.getElementById('home-search');
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const profileImageInput = document.getElementById('profile-image-input');
    const switchRoleBtn = document.getElementById('switch-role-btn');

    loginBtn.addEventListener('click', () => loginModal.style.display = 'flex');
    registerBtn.addEventListener('click', () => registerModal.style.display = 'flex');
    closeLogin.addEventListener('click', () => loginModal.style.display = 'none');
    closeRegister.addEventListener('click', () => registerModal.style.display = 'none');
    closeManageAccount.addEventListener('click', () => manageAccountModal.style.display = 'none');
    
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        registerModal.style.display = 'flex';
    });
    
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'flex';
    });

    logoutBtn.addEventListener('click', handleLogout);
    manageAccountBtn.addEventListener('click', () => {
        openManageAccountModal();
        manageAccountModal.style.display = 'flex';
    });

    // Notification bell toggle
    notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotificationDropdown();
    });

    // Home search functionality
    homeSearchBtn.addEventListener('click', handleHomeSearch);
    homeSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleHomeSearch();
    });

    // Profile image upload
    uploadImageBtn.addEventListener('click', () => profileImageInput.click());
    profileImageInput.addEventListener('change', handleProfileImageUpload);

    // Role switch
    switchRoleBtn.addEventListener('click', handleRoleSwitch);

    document.querySelectorAll('.user-type').forEach(type => {
        type.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.user-type').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    requestForm.addEventListener('submit', handleCreateRequest);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            navigateToSection(targetSection);
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === registerModal) registerModal.style.display = 'none';
        if (e.target === manageAccountModal) manageAccountModal.style.display = 'none';
        
        // Close notification dropdown if clicked outside
        const dropdown = document.getElementById('notification-dropdown');
        if (!notificationBell.contains(e.target) && dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
        }
    });
}

// ==================== AUTH FUNCTIONS ====================
async function checkAuthStatus() {
    try {
        console.log('🔍 Checking authentication status...');
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIAfterLogin();
            console.log('✅ Authenticated as:', currentUser.email);
        } else {
            currentUser = null;
            console.log('ℹ️  Not authenticated');
        }
    } catch (error) {
        console.log('ℹ️  Auth check failed:', error.message);
        currentUser = null;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        console.log('🔐 Attempting login for:', email);
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // CRITICAL!
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            console.log('✅ Login successful:', currentUser.email);
            
            // CRITICAL: Wait a moment for session to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            
            updateUIAfterLogin();
            document.getElementById('login-modal').style.display = 'none';
            alert(`Welcome back, ${data.user.name}!`);
            
            // Navigate based on role
            if (currentUser.role === 'requester') {
                navigateToSection('requester-dashboard');
                // WAIT before loading dashboard data
                setTimeout(() => loadRequesterDashboard(), 200);
            } else if (currentUser.role === 'volunteer') {
                navigateToSection('browse');
                setTimeout(() => loadBrowseRequests(), 200);
            } else if (currentUser.role === 'admin') {
                window.location.href = 'admin.html';
            }
        } else {
            console.error('❌ Login failed:', data.error);
            alert(data.error || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        alert('Connection error. Make sure the backend server is running on http://localhost:3000');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const location = document.getElementById('register-location').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const role = document.querySelector('#register-modal .user-type.active').dataset.role;
    
    if (password !== confirm) {
        alert("Passwords don't match!");
        return;
    }
    
    if (password.length < 6) {
        alert("Password must be at least 6 characters long!");
        return;
    }
    
    try {
        console.log('📝 Attempting registration for:', email);
        
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, location })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Registration successful');
            alert('Registration successful! Please login with your credentials.');
            document.getElementById('register-modal').style.display = 'none';
            document.getElementById('login-modal').style.display = 'flex';
            document.getElementById('login-email').value = email;
        } else {
            console.error('❌ Registration failed:', data.error);
            alert(data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        alert('Connection error. Please try again.');
    }
}

async function handleLogout() {
    try {
        console.log('🚪 Logging out...');
        
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        
        document.getElementById('user-actions').style.display = 'flex';
        document.getElementById('user-profile').style.display = 'none';
        
        document.getElementById('nav-browse').style.display = 'none';
        document.getElementById('nav-my-requests').style.display = 'none';
        document.getElementById('nav-create').style.display = 'none';
        document.getElementById('nav-my-offers').style.display = 'none';
        
        navigateToSection('home');
        console.log('✅ Logged out successfully');
        alert('You have been logged out successfully.');
    } catch (error) {
        console.error('❌ Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

// ==================== UI UPDATE FUNCTIONS ====================
function updateUIAfterLogin() {
    console.log('🎨 Updating UI for user:', currentUser.email);
    
    document.getElementById('user-actions').style.display = 'none';
    document.getElementById('user-profile').style.display = 'flex';
    
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-role').textContent = 
        currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    
    // Update avatar with profile image or initials
    const avatarEl = document.getElementById('user-avatar');
    if (currentUser.profile_image) {
        avatarEl.innerHTML = `<img src="${currentUser.profile_image}" alt="Profile">`;
    } else {
        const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        avatarEl.textContent = initials.toUpperCase();
    }
    
    document.getElementById('nav-browse').style.display = 'none';
    document.getElementById('nav-my-requests').style.display = 'none';
    document.getElementById('nav-create').style.display = 'none';
    document.getElementById('nav-my-offers').style.display = 'none';
    
    if (currentUser.role === 'requester') {
        document.getElementById('nav-my-requests').style.display = 'list-item';
        document.getElementById('nav-create').style.display = 'list-item';
    } else if (currentUser.role === 'volunteer') {
        document.getElementById('nav-browse').style.display = 'list-item';
        document.getElementById('nav-my-offers').style.display = 'list-item';
    }
    
    // Start loading notifications
    loadNotificationCount();
    startNotificationPolling();
}

function navigateToSection(sectionId) {
    console.log('📄 Navigating to:', sectionId);
    
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active-section');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active-section');
        
        // Load data with delay to ensure session is ready
        if (sectionId === 'browse') {
            setTimeout(() => loadBrowseRequests(), 100);
        }
        if (sectionId === 'requester-dashboard') {
            setTimeout(() => loadRequesterDashboard(), 100);
        }
        if (sectionId === 'volunteer-dashboard') {
            setTimeout(() => loadVolunteerDashboard(), 100);
        }
    }
}

// ==================== REQUEST FUNCTIONS ====================
async function loadHomeRequests() {
    try {
        console.log('📥 Loading home requests...');
        
        const response = await fetch(`${API_URL}/requests`);
        const data = await response.json();
        
        if (response.ok) {
            allRequests = data.requests;
            displayHomeRequests(data.requests.slice(0, 6));
            console.log(`✅ Loaded ${data.requests.length} requests`);
        }
    } catch (error) {
        console.error('❌ Error loading requests:', error);
        document.getElementById('home-requests-grid').innerHTML = 
            '<p style="color: var(--warning);">Error loading requests. Server may be offline.</p>';
    }
}

function displayHomeRequests(requests) {
    const grid = document.getElementById('home-requests-grid');
    
    if (requests.length === 0) {
        grid.innerHTML = '<p>No requests available at the moment.</p>';
        return;
    }
    
    grid.innerHTML = requests.map(request => createRequestCard(request, false)).join('');
}

async function loadBrowseRequests() {
    try {
        console.log('📥 Loading browse requests...');
        
        const response = await fetch(`${API_URL}/requests`);
        const data = await response.json();
        
        if (response.ok) {
            displayBrowseRequests(data.requests);
        }
    } catch (error) {
        console.error('❌ Error loading requests:', error);
    }
}

function displayBrowseRequests(requests) {
    const grid = document.getElementById('browse-requests-grid');
    
    if (requests.length === 0) {
        grid.innerHTML = '<p>No open requests available at the moment.</p>';
        return;
    }
    
    grid.innerHTML = requests.map(request => createRequestCard(request, true)).join('');
    
    document.querySelectorAll('.offer-help-btn').forEach(btn => {
        btn.addEventListener('click', () => handleOfferHelp(btn.dataset.requestId));
    });
}

async function handleCreateRequest(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login to create a request.');
        return;
    }
    
    if (currentUser.role !== 'requester') {
        alert('Only requesters can create requests.');
        return;
    }
    
    const title = document.getElementById('request-title').value;
    const description = document.getElementById('request-description').value;
    const category = document.getElementById('request-category').value;
    const urgency_level = document.getElementById('request-urgency').value;
    const location = document.getElementById('request-location').value;
    
    console.log('📤 Creating request...');
    
    try {
        const response = await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // CRITICAL!
            body: JSON.stringify({ title, description, category, urgency_level, location })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Request created:', data.request_id);
            alert('Request created successfully!');
            document.getElementById('request-form').reset();
            navigateToSection('requester-dashboard');
            setTimeout(() => loadRequesterDashboard(), 200);
        } else {
            console.error('❌ Request creation failed:', data);
            
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                currentUser = null;
                updateUIAfterLogin();
            } else {
                alert(data.error || 'Failed to create request.');
            }
        }
    } catch (error) {
        console.error('❌ Error creating request:', error);
        alert('Connection error. Please try again.');
    }
}

async function handleOfferHelp(requestId) {
    if (!currentUser) {
        alert('Please login as a volunteer to offer help.');
        document.getElementById('login-modal').style.display = 'flex';
        return;
    }
    
    if (currentUser.role !== 'volunteer') {
        alert('Only volunteers can offer help.');
        return;
    }
    
    console.log('🤝 Offering help for request:', requestId);
    
    try {
        const response = await fetch(`${API_URL}/offers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // CRITICAL!
            body: JSON.stringify({ request_id: requestId })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Offer submitted');
            alert('Your help offer has been submitted successfully!');
            loadBrowseRequests();
        } else {
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                currentUser = null;
                document.getElementById('login-modal').style.display = 'flex';
            } else {
                alert(data.error || 'Failed to submit offer.');
            }
        }
    } catch (error) {
        console.error('❌ Error submitting offer:', error);
        alert('Connection error. Please try again.');
    }
}

// ==================== DASHBOARD FUNCTIONS ====================
let requesterRequestsData = [];

async function loadRequesterDashboard() {
    if (!currentUser || currentUser.role !== 'requester') return;
    
    console.log('📊 Loading requester dashboard...');
    
    try {
        const response = await fetch(`${API_URL}/requester/requests`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            requesterRequestsData = data.requests;
            loadRequesterStats(data.requests);
            // Default to showing active requests
            filterRequesterRequests('active');
        } else if (response.status === 401) {
            console.error('❌ Session expired');
            alert('Session expired. Please login again.');
            currentUser = null;
            navigateToSection('home');
        }
    } catch (error) {
        console.error('❌ Error loading requester dashboard:', error);
    }
}

function filterRequesterRequests(filter) {
    let filteredRequests = [];
    let title = '';
    
    switch(filter) {
        case 'active':
            filteredRequests = requesterRequestsData.filter(r => r.status === 'open');
            title = 'Your Active Requests';
            break;
        case 'pending':
            filteredRequests = requesterRequestsData.filter(r => r.pending_offers > 0);
            title = 'Requests with Pending Offers';
            break;
        case 'completed':
            filteredRequests = requesterRequestsData.filter(r => r.status === 'closed');
            title = 'Your Completed Requests';
            break;
        default:
            filteredRequests = requesterRequestsData;
            title = 'All Your Requests';
    }
    
    document.getElementById('filter-title').textContent = title;
    displayFilteredRequests(filteredRequests);
    
    // Update active card styling
    document.querySelectorAll('.dashboard-card').forEach(card => card.classList.remove('active'));
    const activeCard = document.querySelector(`.dashboard-card[data-filter="${filter}"]`);
    if (activeCard) activeCard.classList.add('active');
}

function displayFilteredRequests(requests) {
    const grid = document.getElementById('filtered-content');
    
    if (requests.length === 0) {
        grid.innerHTML = '<p>No requests found for this filter.</p>';
        return;
    }
    
    grid.innerHTML = requests.map(request => createRequesterRequestCard(request)).join('');
}

function loadRequesterStats(requests) {
    const activeCount = requests.filter(r => r.status === 'open').length;
    const completedCount = requests.filter(r => r.status === 'closed').length;
    const pendingOffers = requests.reduce((sum, r) => sum + (r.pending_offers || 0), 0);
    
    document.getElementById('requester-stats').innerHTML = `
        <div class="dashboard-card" data-filter="active" onclick="filterRequesterRequests('active')">
            <i class="fas fa-list-alt"></i>
            <h3>Active Requests</h3>
            <p>${activeCount} Open</p>
        </div>
        <div class="dashboard-card" data-filter="pending" onclick="filterRequesterRequests('pending')">
            <i class="fas fa-users"></i>
            <h3>Pending Offers</h3>
            <p>${pendingOffers} Offers</p>
        </div>
        <div class="dashboard-card" data-filter="completed" onclick="filterRequesterRequests('completed')">
            <i class="fas fa-check-circle"></i>
            <h3>Completed</h3>
            <p>${completedCount} Requests</p>
        </div>
    `;
}

async function loadVolunteerDashboard() {
    if (!currentUser || currentUser.role !== 'volunteer') return;
    
    console.log('📊 Loading volunteer dashboard...');
    
    try {
        const response = await fetch(`${API_URL}/volunteer/offers`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayVolunteerOffers(data.offers);
            loadVolunteerStats(data.offers);
        } else if (response.status === 401) {
            console.error('❌ Session expired');
            alert('Session expired. Please login again.');
            currentUser = null;
            navigateToSection('home');
        }
    } catch (error) {
        console.error('❌ Error loading volunteer dashboard:', error);
    }
}

function displayVolunteerOffers(offers) {
    const grid = document.getElementById('volunteer-offers-grid');
    
    if (offers.length === 0) {
        grid.innerHTML = '<p>You haven\'t offered help yet. <a href="#" onclick="navigateToSection(\'browse\')">Browse available requests</a></p>';
        return;
    }
    
    grid.innerHTML = offers.map(offer => createVolunteerOfferCard(offer)).join('');
}

function loadVolunteerStats(offers) {
    const activeCount = offers.filter(o => o.status === 'pending' || o.status === 'accepted').length;
    const acceptedCount = offers.filter(o => o.status === 'accepted').length;
    
    document.getElementById('volunteer-stats').innerHTML = `
        <div class="dashboard-card">
            <i class="fas fa-hand-holding-heart"></i>
            <h3>Active Offers</h3>
            <p>${activeCount} Pending</p>
        </div>
        <div class="dashboard-card">
            <i class="fas fa-check-circle"></i>
            <h3>Accepted Offers</h3>
            <p>${acceptedCount} Tasks</p>
        </div>
        <div class="dashboard-card">
            <i class="fas fa-star"></i>
            <h3>Your Rating</h3>
            <p>4.9/5 Stars</p>
        </div>
    `;
}

// ==================== HELPER FUNCTIONS ====================
function createRequestCard(request, showOfferButton) {
    const urgencyMap = { low: 'Low', medium: 'Moderate', high: 'Urgent' };
    
    // Calculate timer for urgent requests
    let timerHtml = '';
    if (request.urgency_level === 'high' && request.urgent_timer_start) {
        const startTime = new Date(request.urgent_timer_start).getTime();
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 3600000 - elapsed); // 1 hour in ms
        
        if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timerHtml = `<span class="urgent-timer" data-start="${request.urgent_timer_start}">
                <i class="fas fa-clock"></i> ${minutes}:${seconds.toString().padStart(2, '0')}
            </span>`;
        }
    }
    
    return `
        <div class="post-card">
            <div class="post-image">
                <i class="fas fa-${getCategoryIcon(request.category)} fa-3x"></i>
            </div>
            <div class="post-content">
                <h3 class="post-title">${request.title}</h3>
                <div class="post-details">
                    <span><i class="fas fa-user"></i> ${request.requester_name}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${request.location || 'N/A'}</span>
                </div>
                <p class="post-description">${request.description}</p>
                <span class="post-status status-${request.urgency_level === 'high' ? 'urgent' : 'open'}">
                    ${urgencyMap[request.urgency_level] || request.urgency_level}
                </span>
                ${timerHtml}
                ${showOfferButton && currentUser && currentUser.role === 'volunteer' ? `
                    <div class="card-actions">
                        <button class="btn btn-primary offer-help-btn" data-request-id="${request.request_id}">
                            Offer Help
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function createRequesterRequestCard(request) {
    const statusMap = { open: 'Open', help_offered: 'Help Offered', closed: 'Completed' };
    
    return `
        <div class="post-card">
            <div class="post-image">
                <i class="fas fa-${getCategoryIcon(request.category)} fa-3x"></i>
            </div>
            <div class="post-content">
                <h3 class="post-title">${request.title}</h3>
                <div class="post-details">
                    <span><i class="fas fa-map-marker-alt"></i> ${request.location || 'N/A'}</span>
                    <span><i class="fas fa-clock"></i> ${new Date(request.posted_date).toLocaleDateString()}</span>
                </div>
                <p class="post-description">${request.description}</p>
                <span class="post-status status-${request.status === 'open' ? 'open' : 'completed'}">
                    ${statusMap[request.status]} ${request.pending_offers > 0 ? `- ${request.pending_offers} Offers` : ''}
                </span>
            </div>
        </div>
    `;
}

function createVolunteerOfferCard(offer) {
    const statusMap = { pending: 'Pending', accepted: 'Accepted', declined: 'Declined' };
    
    return `
        <div class="post-card">
            <div class="post-image">
                <i class="fas fa-hand-holding-heart fa-3x"></i>
            </div>
            <div class="post-content">
                <h3 class="post-title">${offer.title}</h3>
                <div class="post-details">
                    <span><i class="fas fa-user"></i> ${offer.requester_name}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${offer.location || 'N/A'}</span>
                </div>
                <p class="post-description">${offer.description}</p>
                <span class="post-status status-${offer.status === 'accepted' ? 'completed' : 'pending'}">
                    ${statusMap[offer.status]}
                </span>
            </div>
        </div>
    `;
}

function getCategoryIcon(category) {
    const icons = {
        'Home Repair': 'tools',
        'Groceries': 'shopping-cart',
        'Transportation': 'car',
        'Technology': 'laptop',
        'Errand': 'running',
        'Other': 'hand-holding-heart'
    };
    return icons[category] || 'hand-holding-heart';
}

// ==================== SEARCH FUNCTIONALITY ====================
function handleHomeSearch() {
    const searchTerm = document.getElementById('home-search').value.trim().toLowerCase();
    
    if (!searchTerm) {
        displayHomeRequests(allRequests.slice(0, 6));
        return;
    }
    
    const filtered = allRequests.filter(request => {
        return request.title.toLowerCase().includes(searchTerm) ||
               request.description.toLowerCase().includes(searchTerm) ||
               (request.category && request.category.toLowerCase().includes(searchTerm)) ||
               (request.location && request.location.toLowerCase().includes(searchTerm));
    });
    
    displayHomeRequests(filtered.slice(0, 12));
}

// ==================== NOTIFICATION FUNCTIONS ====================
let notificationPollingInterval = null;

async function loadNotificationCount() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/notifications/unread-count`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const badge = document.getElementById('notification-badge');
            
            if (data.count > 0) {
                badge.textContent = data.count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.log('ℹ️  Could not load notification count');
    }
}

function startNotificationPolling() {
    // Check every 30 seconds
    if (notificationPollingInterval) clearInterval(notificationPollingInterval);
    notificationPollingInterval = setInterval(loadNotificationCount, 30000);
}

async function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        return;
    }
    
    dropdown.classList.add('active');
    await loadNotificationDropdown();
}

async function loadNotificationDropdown() {
    try {
        const response = await fetch(`${API_URL}/notifications`, {
            credentials: 'include'
        });
        
        const listContainer = document.getElementById('notification-list');
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.notifications && data.notifications.length > 0) {
                listContainer.innerHTML = data.notifications.map(notif => `
                    <div class="notification-item ${!notif.is_read ? 'unread' : ''}" data-id="${notif.notification_id}">
                        <p>${notif.message}</p>
                        <small>${new Date(notif.sent_date).toLocaleString()}</small>
                    </div>
                `).join('');
                
                // Add click handlers to mark as read
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.addEventListener('click', () => markNotificationRead(item.dataset.id));
                });
            } else {
                listContainer.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--gray);">No notifications</p>';
            }
            
            // Reload count after showing notifications
            setTimeout(loadNotificationCount, 500);
        }
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
    }
}

async function markNotificationRead(notificationId) {
    try {
        await fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'PATCH',
            credentials: 'include'
        });
        
        const item = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (item) item.classList.remove('unread');
        
        loadNotificationCount();
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
    }
}

// ==================== PROFILE IMAGE UPLOAD ====================
async function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Image = e.target.result;
        
        try {
            const response = await fetch(`${API_URL}/user/profile-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ profile_image: base64Image })
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser.profile_image = data.profile_image;
                
                // Update all avatar displays
                const avatarEl = document.getElementById('user-avatar');
                avatarEl.innerHTML = `<img src="${base64Image}" alt="Profile">`;
                
                const avatarLarge = document.getElementById('user-avatar-large');
                avatarLarge.innerHTML = `<img src="${base64Image}" alt="Profile">`;
                
                alert('Profile image updated successfully!');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update profile image');
            }
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        }
    };
    
    reader.readAsDataURL(file);
}

function openManageAccountModal() {
    // Update profile image preview
    const avatarLarge = document.getElementById('user-avatar-large');
    if (currentUser.profile_image) {
        avatarLarge.innerHTML = `<img src="${currentUser.profile_image}" alt="Profile">`;
    } else {
        const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        avatarLarge.textContent = initials.toUpperCase();
    }
    
    // Update role display
    const currentRole = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    const targetRole = currentUser.role === 'requester' ? 'Volunteer' : 'Requester';
    
    document.getElementById('current-role-display').textContent = currentRole;
    document.getElementById('switch-role-target').textContent = targetRole;
    
    // Check cooldown
    checkRoleSwitchCooldown();
}

async function checkRoleSwitchCooldown() {
    const switchBtn = document.getElementById('switch-role-btn');
    const cooldownMsg = document.getElementById('cooldown-message');
    const cooldownText = document.getElementById('cooldown-text');
    
    if (!currentUser.last_role_switch) {
        switchBtn.disabled = false;
        cooldownMsg.style.display = 'none';
        return;
    }
    
    const lastSwitch = new Date(currentUser.last_role_switch).getTime();
    const hoursSince = (Date.now() - lastSwitch) / (1000 * 60 * 60);
    
    if (hoursSince < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSince);
        switchBtn.disabled = true;
        cooldownMsg.style.display = 'flex';
        cooldownText.textContent = `You can switch roles again in ${hoursRemaining} hours`;
    } else {
        switchBtn.disabled = false;
        cooldownMsg.style.display = 'none';
    }
}

async function handleRoleSwitch() {
    if (!confirm('Are you sure you want to switch roles? You can only switch once every 24 hours.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/user/switch-role`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser.role = data.newRole;
            currentUser.last_role_switch = new Date().toISOString();
            
            alert('Role switched successfully! Refreshing...');
            document.getElementById('manage-account-modal').style.display = 'none';
            
            // Update UI
            updateUIAfterLogin();
            
            // Navigate based on new role
            if (data.newRole === 'requester') {
                navigateToSection('requester-dashboard');
                setTimeout(() => loadRequesterDashboard(), 200);
            } else {
                navigateToSection('browse');
                setTimeout(() => loadBrowseRequests(), 200);
            }
        } else {
            const data = await response.json();
            alert(data.message || data.error || 'Failed to switch role');
            
            if (data.hoursRemaining) {
                checkRoleSwitchCooldown();
            }
        }
    } catch (error) {
        console.error('❌ Error switching role:', error);
        alert('Failed to switch role. Please try again.');
    }
}

// ==================== URGENT TIMER UPDATE ====================
function startUrgentTimerUpdates() {
    setInterval(() => {
        document.querySelectorAll('.urgent-timer').forEach(timer => {
            const startTime = new Date(timer.dataset.start).getTime();
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 3600000 - elapsed); // 1 hour
            
            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                timer.innerHTML = `<i class="fas fa-clock"></i> ${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                timer.classList.add('expired');
                timer.innerHTML = '<i class="fas fa-clock"></i> Expired';
            }
        });
    }, 1000); // Update every second
}

// Start timer updates on page load
setTimeout(startUrgentTimerUpdates, 1000);

// Make filterRequesterRequests global
window.filterRequesterRequests = filterRequesterRequests;
window.navigateToSection = navigateToSection;