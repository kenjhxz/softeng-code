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
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const closeLogin = document.getElementById('close-login');
    const closeRegister = document.getElementById('close-register');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const requestForm = document.getElementById('request-form');
    
    // Profile dropdown elements
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownViewProfile = document.getElementById('dropdown-view-profile');
    const dropdownManageAccount = document.getElementById('dropdown-manage-account');
    const dropdownLogout = document.getElementById('dropdown-logout');
    
    // Profile and Account forms
    const updateProfileForm = document.getElementById('update-profile-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const goToManageAccount = document.getElementById('go-to-manage-account');

    loginBtn.addEventListener('click', () => loginModal.style.display = 'flex');
    registerBtn.addEventListener('click', () => registerModal.style.display = 'flex');
    closeLogin.addEventListener('click', () => loginModal.style.display = 'none');
    closeRegister.addEventListener('click', () => registerModal.style.display = 'none');
    
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

    // Profile dropdown toggle
    profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
        document.getElementById('user-profile').classList.toggle('dropdown-open');
    });
    
    // Dropdown menu items
    dropdownViewProfile.addEventListener('click', (e) => {
        e.preventDefault();
        profileDropdown.classList.remove('show');
        document.getElementById('user-profile').classList.remove('dropdown-open');
        navigateToSection('view-profile');
        loadViewProfile();
    });
    
    dropdownManageAccount.addEventListener('click', (e) => {
        e.preventDefault();
        profileDropdown.classList.remove('show');
        document.getElementById('user-profile').classList.remove('dropdown-open');
        navigateToSection('manage-account');
        loadManageAccount();
    });
    
    dropdownLogout.addEventListener('click', (e) => {
        e.preventDefault();
        profileDropdown.classList.remove('show');
        document.getElementById('user-profile').classList.remove('dropdown-open');
        handleLogout();
    });
    
    // Go to Manage Account from View Profile
    goToManageAccount.addEventListener('click', () => {
        navigateToSection('manage-account');
        loadManageAccount();
    });
    
    // Profile and password update forms
    updateProfileForm.addEventListener('submit', handleUpdateProfile);
    changePasswordForm.addEventListener('submit', handleChangePassword);

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

    // Click outside to close dropdown and modals
    window.addEventListener('click', function(e) {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === registerModal) registerModal.style.display = 'none';
        
        // Close profile dropdown when clicking outside
        if (!e.target.closest('.user-profile')) {
            profileDropdown.classList.remove('show');
            document.getElementById('user-profile').classList.remove('dropdown-open');
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
    
    const initials = currentUser.name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2);
    document.getElementById('user-avatar').textContent = initials.toUpperCase();
    
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
async function loadRequesterDashboard() {
    if (!currentUser || currentUser.role !== 'requester') return;
    
    console.log('📊 Loading requester dashboard...');
    
    try {
        const response = await fetch(`${API_URL}/requester/requests`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayRequesterRequests(data.requests);
            loadRequesterStats(data.requests);
        } else if (response.status === 401) {
            console.error('❌ Session expired');
            alert('Session expired. Please login again.');
            currentUser = null;
            navigateToSection('home');
        }
    } catch (error) {
        console.error('❌ Error loading requester dashboard:', error);
    }
    
    // Load notifications without blocking
    loadNotifications('requester-notifications');
}

function displayRequesterRequests(requests) {
    const grid = document.getElementById('requester-requests-grid');
    
    if (requests.length === 0) {
        grid.innerHTML = '<p>You haven\'t created any requests yet. <a href="#" onclick="navigateToSection(\'create\')">Create your first request</a></p>';
        return;
    }
    
    grid.innerHTML = requests.map(request => createRequesterRequestCard(request)).join('');
}

function loadRequesterStats(requests) {
    const activeCount = requests.filter(r => r.status === 'open').length;
    const completedCount = requests.filter(r => r.status === 'closed').length;
    const pendingOffers = requests.reduce((sum, r) => sum + (r.pending_offers || 0), 0);
    
    document.getElementById('requester-stats').innerHTML = `
        <div class="dashboard-card">
            <i class="fas fa-list-alt"></i>
            <h3>Active Requests</h3>
            <p>${activeCount} Open</p>
        </div>
        <div class="dashboard-card">
            <i class="fas fa-users"></i>
            <h3>Pending Offers</h3>
            <p>${pendingOffers} Offers</p>
        </div>
        <div class="dashboard-card">
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
    
    loadNotifications('volunteer-notifications');
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

// FIXED: Don't fail if notifications return empty
async function loadNotifications(containerId) {
    try {
        const response = await fetch(`${API_URL}/notifications`, {
            credentials: 'include'
        });
        
        const container = document.getElementById(containerId);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.notifications && data.notifications.length > 0) {
                container.innerHTML = data.notifications.map(notif => `
                    <div class="notification">
                        <h4><i class="fas fa-bell"></i> Notification</h4>
                        <p>${notif.message}</p>
                        <small>${new Date(notif.sent_date).toLocaleString()}</small>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No notifications yet.</p>';
            }
        } else {
            // Don't show error for notifications
            container.innerHTML = '<p>No notifications available.</p>';
        }
    } catch (error) {
        console.log('ℹ️  Could not load notifications (non-critical)');
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<p>No notifications available.</p>';
        }
    }
}

// ==================== HELPER FUNCTIONS ====================
function createRequestCard(request, showOfferButton) {
    const urgencyMap = { low: 'Low', medium: 'Moderate', high: 'Urgent' };
    
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

// ==================== PROFILE & ACCOUNT FUNCTIONS ====================
function loadViewProfile() {
    if (!currentUser) return;
    
    console.log('👤 Loading view profile...');
    
    // Set avatar initials
    const initials = currentUser.name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2);
    document.getElementById('profile-avatar-large').textContent = initials.toUpperCase();
    
    // Set header info
    document.getElementById('profile-display-name').textContent = currentUser.name;
    const roleDisplay = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    document.getElementById('profile-display-role').textContent = roleDisplay;
    
    // Set detail values
    document.getElementById('profile-name-value').textContent = currentUser.name;
    document.getElementById('profile-email-value').textContent = currentUser.email;
    document.getElementById('profile-role-value').textContent = roleDisplay;
    document.getElementById('profile-location-value').textContent = currentUser.location || 'Not specified';
    
    // Set verification status
    const verifiedEl = document.getElementById('profile-verified-value');
    if (currentUser.verified) {
        verifiedEl.innerHTML = '<span class="status-badge status-verified">Verified</span>';
    } else {
        verifiedEl.innerHTML = '<span class="status-badge status-pending">Pending Verification</span>';
    }
}

function loadManageAccount() {
    if (!currentUser) return;
    
    console.log('⚙️ Loading manage account...');
    
    // Pre-fill the update profile form
    document.getElementById('update-name').value = currentUser.name;
    document.getElementById('update-location').value = currentUser.location || '';
    
    // Clear password fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-new-password').value = '';
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login to update your profile.');
        return;
    }
    
    const name = document.getElementById('update-name').value.trim();
    const location = document.getElementById('update-location').value.trim();
    
    if (!name) {
        alert('Name is required.');
        return;
    }
    
    console.log('📤 Updating profile...');
    
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, location })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Profile updated successfully');
            currentUser = data.user;
            updateUIAfterLogin();
            alert('Profile updated successfully!');
        } else {
            console.error('❌ Profile update failed:', data);
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                currentUser = null;
                navigateToSection('home');
            } else {
                alert(data.error || 'Failed to update profile.');
            }
        }
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        alert('Connection error. Please try again.');
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login to change your password.');
        return;
    }
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('All password fields are required.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert("New passwords don't match!");
        return;
    }
    
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
    }
    
    console.log('🔐 Changing password...');
    
    try {
        const response = await fetch(`${API_URL}/auth/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Password changed successfully');
            alert('Password changed successfully!');
            // Clear password fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-new-password').value = '';
        } else {
            console.error('❌ Password change failed:', data);
            if (response.status === 401 && data.error === 'Current password is incorrect') {
                alert('Current password is incorrect. Please try again.');
            } else if (response.status === 401) {
                alert('Session expired. Please login again.');
                currentUser = null;
                navigateToSection('home');
            } else {
                alert(data.error || 'Failed to change password.');
            }
        }
    } catch (error) {
        console.error('❌ Error changing password:', error);
        alert('Connection error. Please try again.');
    }
}

window.navigateToSection = navigateToSection;