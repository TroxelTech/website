const form = document.getElementById('contact-form');
const formContainer = document.getElementById('form-container');
const successContainer = document.getElementById('success-container');
const errorContainer = document.getElementById('error-container');
const submitBtn = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic client validation
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
        showError('Please fill out name, email, and message.');
        return;
    }

    // Get Turnstile token (if widget rendered)
    const turnstileResponse = form.querySelector('[name="cf-turnstile-response"]');
    const token = turnstileResponse ? turnstileResponse.value : null;

    if (!token) {
        showError('Please complete the security check.');
        return;
    }

    // UI: disable + loading
    submitBtn.disabled = true;
    submitText.textContent = 'Sending...';
    hideError();

    try {
        const formData = new FormData(form);

        const response = await fetch('/api/contact', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Success
            formContainer.classList.add('hidden');
            successContainer.classList.remove('hidden');
            // Scroll to top of success area
            successContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            const msg = result.error || 'Something went wrong on our end.';
            showError(msg + ' You can also reach us at hello@troxel.tech.');
            submitBtn.disabled = false;
            submitText.textContent = 'Send message';
        }
    } catch (err) {
        console.error(err);
        showError('Network error. Please check your connection and try again, or email hello@troxel.tech directly.');
        submitBtn.disabled = false;
        submitText.textContent = 'Send message';
    }
});

function showError(message) {
    errorContainer.querySelector('#error-text').innerHTML = message;
    errorContainer.classList.remove('hidden');
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    errorContainer.classList.add('hidden');
}
