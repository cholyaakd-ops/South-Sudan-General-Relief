// Basic form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateForm(form) {
    const email = form.email ? form.email.value : '';
    const password = form.password ? form.password.value : '';
    const confirmPassword = form.confirm_password ? form.confirm_password.value : password;
    if (email && !validateEmail(email)) {
        alert('Invalid email');
        return false;
    }
    if (password && !validatePassword(password)) {
        alert('Password must be at least 6 characters');
        return false;
    }
    if (form.confirm_password && password !== confirmPassword) {
        alert('Passwords do not match');
        return false;
    }
    return true;
}

// Attach to forms if exist
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(form)) {
                e.preventDefault();
            }
        });
    });
});