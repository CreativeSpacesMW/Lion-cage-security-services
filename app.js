/**
 * Lion Cage Security Services - Main Application JavaScript
 * Vanilla JS Implementation
 */

// Data storage
let guardRates = {};
let admins = [];
let isAdmin = false;

// DOM Elements cache
const DOM = {
    // Calculator elements
    quoteForm: document.getElementById('quoteForm'),
    quoteResult: document.getElementById('quoteResult'),
    guardsCount: document.getElementById('guardsCount'),
    costPerGuard: document.getElementById('costPerGuard'),
    dailyCost: document.getElementById('dailyCost'),
    monthlyCost: document.getElementById('monthlyCost'),
    totalCost: document.getElementById('totalCost'),
    
    // Report form
    reportForm: document.getElementById('reportForm'),
    
    // WhatsApp form
    whatsappForm: document.getElementById('whatsappForm'),
    
    // Admin elements
    adminLoginForm: document.getElementById('adminLoginForm'),
    loginScreen: document.getElementById('loginScreen'),
    adminContent: document.getElementById('adminContent'),
    logoutBtn: document.getElementById('logoutBtn'),
    clearLocalStorage: document.getElementById('clearLocalStorage')
};

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Main initialization function
 */
async function initializeApp() {
    // Load guard rates
    await loadGuardRates();
    
    // Load admins data
    await loadAdmins();
    
    // Initialize page-specific functionality
    initializePage();
    
    // Setup mobile navigation
    setupMobileNav();
    
    // Check admin authentication
    checkAdminAuth();
}

/**
 * Load guard rates from data.json
 */
async function loadGuardRates() {
    try {
        const response = await fetch('data.json');
        guardRates = await response.json();
        console.log('Guard rates loaded:', guardRates);
    } catch (error) {
        console.error('Error loading guard rates:', error);
        // Fallback rates
        guardRates = {
            standard: { rate: 150, coverage: 2000 },
            armed: { rate: 250, coverage: 1500 },
            k9: { rate: 350, coverage: 1000 }
        };
    }
}

/**
 * Load admin credentials from admins.json
 */
async function loadAdmins() {
    try {
        const response = await fetch('admins.json');
        admins = await response.json();
        console.log('Admins loaded');
    } catch (error) {
        console.error('Error loading admins:', error);
        // Fallback admin
        admins = [
            { username: 'admin', password: 'lioncage123' },
            { username: 'security', password: 'secure2024' }
        ];
    }
}

/**
 * Initialize page-specific functionality
 */
function initializePage() {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'index.html':
        case '':
            initializeCalculator();
            initializeReportForm();
            break;
            
        case 'about.html':
            // Additional about page initialization if needed
            break;
            
        case 'contact.html':
            initializeWhatsAppForm();
            break;
            
        case 'admin.html':
            initializeAdminPage();
            break;
    }
}

/**
 * Initialize the cost calculator
 */
function initializeCalculator() {
    if (!DOM.quoteForm) return;
    
    DOM.quoteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateQuote();
    });
    
    // Calculate on form changes
    DOM.quoteForm.addEventListener('change', calculateQuote);
    DOM.quoteForm.addEventListener('input', calculateQuote);
    
    // Initial calculation
    calculateQuote();
}

/**
 * Calculate security quote based on form inputs
 */
function calculateQuote() {
    if (!DOM.quoteForm) return;
    
    try {
        // Get form values
        const areaSize = parseInt(document.getElementById('areaSize').value) || 1000;
        const shiftType = document.getElementById('shiftType').value;
        const guardType = document.querySelector('input[name="guardType"]:checked').value;
        const duration = parseInt(document.getElementById('duration').value) || 30;
        
        // Get rates for selected guard type
        const rates = guardRates[guardType];
        if (!rates) {
            throw new Error(`No rates found for guard type: ${guardType}`);
        }
        
        // Calculate guards needed
        const guardsNeeded = Math.ceil(areaSize / rates.coverage);
        
        // Calculate shift multiplier
        let shiftMultiplier = 1;
        switch(shiftType) {
            case 'night':
                shiftMultiplier = 1.5; // 50% more for night shift
                break;
            case '24h':
                shiftMultiplier = 3; // Triple for 24-hour coverage
                break;
        }
        
        // Calculate costs
        const costPerGuard = rates.rate * shiftMultiplier;
        const dailyCost = costPerGuard * guardsNeeded;
        const monthlyCost = dailyCost * 30;
        const totalCost = dailyCost * duration;
        
        // Update UI
        DOM.guardsCount.textContent = guardsNeeded;
        DOM.costPerGuard.textContent = costPerGuard.toFixed(2);
        DOM.dailyCost.textContent = dailyCost.toFixed(2);
        DOM.monthlyCost.textContent = monthlyCost.toFixed(2);
        DOM.totalCost.textContent = totalCost.toFixed(2);
        
        // Store calculation in localStorage for analytics
        storeCalculationAnalytics({
            areaSize,
            shiftType,
            guardType,
            duration,
            guardsNeeded,
            totalCost,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error calculating quote:', error);
        DOM.quoteResult.innerHTML = `<p class="error">Error calculating quote. Please try again.</p>`;
    }
}

/**
 * Store calculation analytics in localStorage
 */
function storeCalculationAnalytics(data) {
    try {
        let analytics = JSON.parse(localStorage.getItem('quoteAnalytics')) || [];
        analytics.push(data);
        localStorage.setItem('quoteAnalytics', JSON.stringify(analytics.slice(-50))); // Keep last 50
    } catch (error) {
        console.error('Error storing analytics:', error);
    }
}

/**
 * Initialize the no-show report form
 */
function initializeReportForm() {
    if (!DOM.reportForm) return;
    
    DOM.reportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const guardId = document.getElementById('guardId').value;
        const shiftTime = document.getElementById('shiftTime').value;
        const location = document.getElementById('location').value;
        const notes = document.getElementById('notes').value;
        
        // Create report object
        const report = {
            guardId,
            shiftTime,
            location,
            notes,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        // Log to console (simulated backend)
        console.log('No-Show Report Submitted:', report);
        
        // Store in localStorage for admin viewing
        storeNoShowReport(report);
        
        // Show success message
        alert('Report submitted successfully. Our team will investigate immediately.');
        
        // Reset form
        DOM.reportForm.reset();
        document.getElementById('shiftTime').value = new Date().toISOString().slice(0, 16);
    });
    
    // Set default shift time to current time
    if (document.getElementById('shiftTime')) {
        document.getElementById('shiftTime').value = new Date().toISOString().slice(0, 16);
    }
}

/**
 * Store no-show report in localStorage
 */
function storeNoShowReport(report) {
    try {
        let reports = JSON.parse(localStorage.getItem('noShowReports')) || [];
        reports.push(report);
        localStorage.setItem('noShowReports', JSON.stringify(reports.slice(-100))); // Keep last 100
    } catch (error) {
        console.error('Error storing report:', error);
    }
}

/**
 * Initialize WhatsApp contact form
 */
function initializeWhatsAppForm() {
    if (!DOM.whatsappForm) return;
    
    DOM.whatsappForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('contactName').value;
        const phone = document.getElementById('contactPhone').value;
        const service = document.getElementById('serviceType').value;
        const message = document.getElementById('message').value;
        const urgency = document.getElementById('urgency').value;
        
        // Validate phone number (basic validation)
        if (!phone.startsWith('+')) {
            alert('Please enter phone number with country code (e.g., +1234567890)');
            return;
        }
        
        // Format WhatsApp message
        const whatsappMessage = encodeURIComponent(
            `*New Contact Request - Lion Cage Security*\n\n` +
            `*Name:* ${name}\n` +
            `*Service Interest:* ${service}\n` +
            `*Urgency:* ${urgency}\n\n` +
            `*Message:*\n${message}\n\n` +
            `*Contact:* ${phone}`
        );
        
        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/1234567890?text=${whatsappMessage}`;
        
        // Store contact request
        storeContactRequest({
            name,
            phone,
            service,
            message,
            urgency,
            timestamp: new Date().toISOString()
        });
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Reset form
        DOM.whatsappForm.reset();
    });
}

/**
 * Store contact request in localStorage
 */
function storeContactRequest(request) {
    try {
        let contacts = JSON.parse(localStorage.getItem('contactRequests')) || [];
        contacts.push(request);
        localStorage.setItem('contactRequests', JSON.stringify(contacts.slice(-50)));
    } catch (error) {
        console.error('Error storing contact request:', error);
    }
}

/**
 * Initialize admin page
 */
function initializeAdminPage() {
    if (!DOM.adminLoginForm) return;
    
    // Setup login form
    DOM.adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        authenticateAdmin(username, password);
    });
    
    // Setup logout button
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', logoutAdmin);
    }
    
    // Setup clear localStorage button
    if (DOM.clearLocalStorage) {
        DOM.clearLocalStorage.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all session data?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
    
    // Load admin dashboard data
    if (isAdmin) {
        loadAdminDashboard();
    }
}

/**
 * Check admin authentication status
 */
function checkAdminAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'admin.html') {
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession);
                if (session.expires > Date.now()) {
                    isAdmin = true;
                    showAdminContent();
                } else {
                    localStorage.removeItem('adminSession');
                    showLoginScreen();
                }
            } catch (error) {
                localStorage.removeItem('adminSession');
                showLoginScreen();
            }
        }
    }
}

/**
 * Authenticate admin user
 */
function authenticateAdmin(username, password) {
    const admin = admins.find(a => 
        a.username === username && a.password === password
    );
    
    if (admin) {
        // Create session
        const session = {
            username: admin.username,
            expires: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
        };
        
        localStorage.setItem('adminSession', JSON.stringify(session));
        isAdmin = true;
        showAdminContent();
        loadAdminDashboard();
    } else {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = 'Invalid username or password';
        }
    }
}

/**
 * Show admin content (after successful login)
 */
function showAdminContent() {
    if (DOM.loginScreen) DOM.loginScreen.classList.add('hidden');
    if (DOM.adminContent) DOM.adminContent.classList.remove('hidden');
}

/**
 * Show login screen
 */
function showLoginScreen() {
    if (DOM.loginScreen) DOM.loginScreen.classList.remove('hidden');
    if (DOM.adminContent) DOM.adminContent.classList.add('hidden');
}

/**
 * Logout admin user
 */
function logoutAdmin() {
    localStorage.removeItem('adminSession');
    isAdmin = false;
    showLoginScreen();
}

/**
 * Load admin dashboard data
 */
function loadAdminDashboard() {
    // Load analytics data
    const analytics = JSON.parse(localStorage.getItem('quoteAnalytics')) || [];
    const reports = JSON.parse(localStorage.getItem('noShowReports')) || [];
    const contacts = JSON.parse(localStorage.getItem('contactRequests')) || [];
    
    // Update dashboard stats
    updateElementText('totalQuotes', analytics.length);
    updateElementText('totalReports', reports.length);
    updateElementText('totalContacts', contacts.length);
    
    // Update admin info
    const session = JSON.parse(localStorage.getItem('adminSession') || '{}');
    updateElementText('adminInfo', `Logged in as: ${session.username || 'Admin'}`);
    
    // Load recent activity
    loadRecentActivity([...analytics, ...reports, ...contacts]);
}

/**
 * Update element text content
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = text;
}

/**
 * Load recent activity for admin dashboard
 */
function loadRecentActivity(activities) {
    const activityLog = document.getElementById('activityLog');
    if (!activityLog) return;
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Take 10 most recent
    const recent = activities.slice(0, 10);
    
    if (recent.length === 0) {
        activityLog.innerHTML = '<p>No recent activity</p>';
        return;
    }
    
    const html = recent.map(activity => {
        const type = activity.guardId ? 'No-Show Report' : 
                    activity.areaSize ? 'Quote' : 
                    activity.name ? 'Contact' : 'Activity';
        
        const date = new Date(activity.timestamp).toLocaleString();
        
        return `
            <div class="activity-item">
                <strong>${type}</strong> - ${date}
                ${activity.guardId ? `(Guard ID: ${activity.guardId})` : ''}
            </div>
        `;
    }).join('');
    
    activityLog.innerHTML = html;
}

/**
 * Setup mobile navigation toggle
 */
function setupMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.navbar')) {
                navMenu.classList.remove('active');
            }
        });
    }
}