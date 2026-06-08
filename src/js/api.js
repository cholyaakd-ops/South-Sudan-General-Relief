/**
 * API Communication Module
 * Handles all backend API communication
 */

class API {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.timeout = 5000;
        this.headers = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Set authorization token
     */
    setToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }

    /**
     * Make GET request
     */
    async get(endpoint) {
        return this._request('GET', endpoint);
    }

    /**
     * Make POST request
     */
    async post(endpoint, data = {}) {
        return this._request('POST', endpoint, data);
    }

    /**
     * Make PUT request
     */
    async put(endpoint, data = {}) {
        return this._request('PUT', endpoint, data);
    }

    /**
     * Make DELETE request
     */
    async delete(endpoint) {
        return this._request('DELETE', endpoint);
    }

    /**
     * Internal request handler
     */
    async _request(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: this.headers,
            timeout: this.timeout,
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return response;
        } catch (error) {
            Logger.error(`API ${method} ${endpoint}`, error);
            throw error;
        }
    }
}

// Create global API instance
const api = new API(process.env.REACT_APP_API_URL || '/api');

// Donation API methods
const DonationAPI = {
    /**
     * Submit donation
     */
    async submitDonation(donationData) {
        return api.post('/donations', donationData);
    },

    /**
     * Get user donations
     */
    async getUserDonations(userId) {
        return api.get(`/donations/user/${userId}`);
    },

    /**
     * Get donation details
     */
    async getDonation(donationId) {
        return api.get(`/donations/${donationId}`);
    },

    /**
     * Update donation
     */
    async updateDonation(donationId, data) {
        return api.put(`/donations/${donationId}`, data);
    },
};

// Authentication API methods
const AuthAPI = {
    /**
     * Register new user
     */
    async register(userData) {
        const response = await api.post('/auth/register', userData);
        if (response.token) {
            api.setToken(response.token);
            Storage.set('auth_token', response.token);
        }
        return response;
    },

    /**
     * Login user
     */
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        if (response.token) {
            api.setToken(response.token);
            Storage.set('auth_token', response.token);
        }
        return response;
    },

    /**
     * Logout user
     */
    async logout() {
        api.setToken(null);
        Storage.remove('auth_token');
        return api.post('/auth/logout');
    },

    /**
     * Get current user
     */
    async getCurrentUser() {
        return api.get('/auth/me');
    },

    /**
     * Refresh token
     */
    async refreshToken() {
        const response = await api.post('/auth/refresh');
        if (response.token) {
            api.setToken(response.token);
            Storage.set('auth_token', response.token);
        }
        return response;
    },

    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        return api.post('/auth/password-reset', { email });
    },

    /**
     * Confirm password reset
     */
    async confirmPasswordReset(token, newPassword) {
        return api.post('/auth/password-reset/confirm', { token, newPassword });
    },
};

// Initialize API with stored token on page load
document.addEventListener('DOMContentLoaded', function() {
    const token = Storage.get('auth_token');
    if (token) {
        api.setToken(token);
    }
});

// Export API modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, api, DonationAPI, AuthAPI };
}
