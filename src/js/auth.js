/**
 * Authentication Module
 * Handles user authentication state and logic
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    /**
     * Initialize auth manager
     */
    init() {
        this.checkAuth();
        this.setupEventListeners();
    }

    /**
     * Check if user is authenticated
     */
    checkAuth() {
        const token = Storage.get('auth_token');
        const user = Storage.get('current_user');
        
        if (token && user) {
            this.currentUser = user;
            this.isAuthenticated = true;
            api.setToken(token);
        }
    }

    /**
     * Setup authentication event listeners
     */
    setupEventListeners() {
        // Handle donation form submission
        const donationForm = DOM.query('#donationForm');
        if (donationForm) {
            donationForm.addEventListener('submit', (e) => this.handleDonation(e));
        }

        // Handle registration form submission
        const registrationForm = DOM.query('#registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }

        // Handle signin form submission
        const signinForm = DOM.query('#signinForm');
        if (signinForm) {
            signinForm.addEventListener('submit', (e) => this.handleSignin(e));
        }

        // Handle admin login form submission
        const adminLoginForm = DOM.query('#adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }
    }

    /**
     * Handle user registration
     */
    async handleRegistration(event) {
        event.preventDefault();
        
        const form = event.target;
        if (!validateForm(form)) {
            return;
        }

        const formData = new FormData(form);
        const userData = {
            fullname: formData.get('fullname'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            country: formData.get('country'),
            password: formData.get('password'),
            donation_preference: formData.get('donation_preference'),
            newsletter: formData.get('newsletter') === 'on',
        };

        try {
            Logger.info('Registering user...');
            const response = await AuthAPI.register(userData);
            
            if (response.user) {
                this.currentUser = response.user;
                this.isAuthenticated = true;
                Storage.set('current_user', response.user);
                
                Logger.info('Registration successful');
                this.showSuccessMessage('Registration successful! Redirecting...');
                
                setTimeout(() => {
                    window.location.href = 'donor_signin.html';
                }, 2000);
            }
        } catch (error) {
            Logger.error('Registration failed', error);
            this.showErrorMessage('Registration failed: ' + error.message);
        }
    }

    /**
     * Handle user signin
     */
    async handleSignin(event) {
        event.preventDefault();

        const form = event.target;
        if (!validateForm(form)) {
            return;
        }

        const email = form.querySelector('input[name="email"]').value;
        const password = form.querySelector('input[name="password"]').value;
        const remember = form.querySelector('input[name="remember"]').checked;

        try {
            Logger.info('Signing in user...');
            const response = await AuthAPI.login(email, password);

            if (response.user) {
                this.currentUser = response.user;
                this.isAuthenticated = true;
                Storage.set('current_user', response.user);

                if (remember) {
                    Storage.set('remember_email', email);
                }

                Logger.info('Signin successful');
                this.showSuccessMessage('Sign in successful! Redirecting...');

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        } catch (error) {
            Logger.error('Signin failed', error);
            this.showErrorMessage('Sign in failed: ' + error.message);
        }
    }

    /**
     * Handle admin login
     */
    async handleAdminLogin(event) {
        event.preventDefault();

        const form = event.target;
        const username = form.querySelector('input[name="username"]').value;
        const password = form.querySelector('input[name="password"]').value;
        const twofa = form.querySelector('input[name="twofa"]').value || null;

        try {
            Logger.info('Admin login attempt...');
            const response = await api.post('/auth/admin-login', {
                username,
                password,
                twofa,
            });

            if (response.user && response.token) {
                this.currentUser = response.user;
                this.isAuthenticated = true;
                Storage.set('current_user', response.user);
                api.setToken(response.token);

                Logger.info('Admin login successful');
                this.showSuccessMessage('Admin login successful! Redirecting...');

                setTimeout(() => {
                    window.location.href = 'admin/dashboard.html';
                }, 2000);
            }
        } catch (error) {
            Logger.error('Admin login failed', error);
            this.showErrorMessage('Admin login failed: ' + error.message);
        }
    }

    /**
     * Handle donation submission
     */
    async handleDonation(event) {
        event.preventDefault();

        const form = event.target;
        if (!validateForm(form)) {
            return;
        }

        const formData = new FormData(form);
        const donationData = {
            donor_name: formData.get('donor_name'),
            email: formData.get('email'),
            donation_type: formData.get('donation_type'),
            amount: parseFloat(formData.get('amount')),
            payment_method: formData.get('payment_method'),
            location: formData.get('location'),
            anonymous: formData.get('anonymous') === 'on',
            recurring: formData.get('recurring') === 'on',
            receipt: formData.get('receipt') === 'on',
        };

        try {
            Logger.info('Processing donation...');
            const response = await DonationAPI.submitDonation(donationData);

            if (response.success) {
                Logger.info('Donation submitted successfully');
                this.showSuccessMessage('Thank you for your donation! Redirecting to payment...');

                // Redirect to payment processor
                setTimeout(() => {
                    window.location.href = `/payment?donation_id=${response.donation_id}`;
                }, 2000);
            }
        } catch (error) {
            Logger.error('Donation submission failed', error);
            this.showErrorMessage('Donation submission failed: ' + error.message);
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await AuthAPI.logout();
            this.currentUser = null;
            this.isAuthenticated = false;
            window.location.href = 'index.html';
        } catch (error) {
            Logger.error('Logout failed', error);
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        const messageDiv = DOM.create('div', `message message-${type}`);
        messageDiv.role = 'alert';
        DOM.setText(messageDiv, message);
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#00b894' : type === 'error' ? '#d63031' : '#0984e3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
    }
}

// Initialize auth manager on page load
document.addEventListener('DOMContentLoaded', function() {
    window.auth = new AuthManager();
});

// Export auth manager
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager };
}
