/**
 * NyxOps — Intake Form Controller
 * Multi-step form navigation, client-side validation, and AJAX submission.
 */
(function () {
    'use strict';

    let currentStep = 1;
    const totalSteps = 3;

    // ── Step navigation ──────────────────────────────────────────────────────

    window.intakeNext = function () {
        if (!validateStep(currentStep)) return;
        if (currentStep < totalSteps) {
            setStep(currentStep + 1);
        }
    };

    window.intakePrev = function () {
        if (currentStep > 1) {
            setStep(currentStep - 1);
        }
    };

    function setStep(step) {
        document.querySelectorAll('.intake-step').forEach(el => el.classList.remove('active'));
        const target = document.querySelector(`.intake-step[data-step="${step}"]`);
        if (target) target.classList.add('active');

        // Update progress dots
        document.querySelectorAll('.step-dot').forEach(dot => {
            const s = parseInt(dot.dataset.step);
            dot.classList.remove('active', 'done');
            if (s < step) dot.classList.add('done');
            if (s === step) dot.classList.add('active');
        });

        // Update progress bar
        const fill = document.getElementById('progress-fill');
        if (fill) fill.style.width = ((step / totalSteps) * 100) + '%';

        // Update label
        const label = document.getElementById('step-label');
        if (label) label.textContent = `Step ${step} of ${totalSteps}`;

        currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Client-side validation ───────────────────────────────────────────────

    function validateStep(step) {
        clearErrors();
        let valid = true;

        if (step === 1) {
            if (!val('contact_name')) { showError('contact_name', 'Full name is required.'); valid = false; }
            if (!val('company_name')) { showError('company_name', 'Company name is required.'); valid = false; }
            const email = val('email');
            if (!email) { showError('email', 'Work email is required.'); valid = false; }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('email', 'Enter a valid email.'); valid = false; }
        }

        if (step === 2) {
            const checked = document.querySelectorAll('input[name="test_types"]:checked');
            if (checked.length === 0) { showError('test_types', 'Select at least one test type.'); valid = false; }
            if (!val('asset_list')) { showError('asset_list', 'Asset list is required.'); valid = false; }
        }

        return valid;
    }

    function val(name) {
        const el = document.querySelector(`[name="${name}"]`);
        return el ? el.value.trim() : '';
    }

    function showError(field, msg) {
        const el = document.querySelector(`.field-error[data-for="${field}"]`);
        if (el) el.textContent = msg;
    }

    function clearErrors() {
        document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    }

    // ── Authorization checkbox → enable submit ───────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        const authCb = document.getElementById('auth-checkbox');
        const submitBtn = document.getElementById('submit-btn');
        if (authCb && submitBtn) {
            authCb.addEventListener('change', function () {
                submitBtn.disabled = !this.checked;
            });
        }

        // ── Form submission ──────────────────────────────────────────────────
        const form = document.getElementById('intake-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (!validateStep(3)) return;

                const authCheck = document.getElementById('auth-checkbox');
                if (!authCheck || !authCheck.checked) {
                    showError('authorization', 'You must confirm authorization.');
                    return;
                }

                // Gather data
                const formData = new FormData(form);
                const data = {};
                formData.forEach((value, key) => {
                    if (key === 'test_types') {
                        if (!data.test_types) data.test_types = [];
                        data.test_types.push(value);
                    } else {
                        data[key] = value;
                    }
                });

                // Human-readable values for the email / form service
                document.querySelectorAll('#intake-form select').forEach(sel => {
                    if (sel.selectedIndex > 0) data[sel.name] = sel.options[sel.selectedIndex].text;
                });
                const radio = document.querySelector('input[name="environment_type"]:checked');
                if (radio) data.environment_type = radio.nextElementSibling.textContent.trim();
                data.test_types = Array.from(document.querySelectorAll('input[name="test_types"]:checked'))
                    .map(cb => cb.nextElementSibling.textContent.trim());
                data.authorization = 'Yes';

                // Submit (no backend: form service or pre-filled email)
                submitBtn.disabled = true;
                submitBtn.querySelector('span:first-child').textContent = 'Submitting…';

                const subject = `[NyxOps Intake] ${data.company_name} — ${data.test_types.join(', ')}`;

                window.NyxForms.submit(data, subject)
                    .then(res => {
                        form.style.display = 'none';
                        document.querySelector('.step-indicator').style.display = 'none';
                        document.getElementById('step-label').style.display = 'none';
                        document.querySelector('.progress-bar').style.display = 'none';
                        const success = document.getElementById('intake-success');
                        if (res.via === 'email') {
                            success.querySelector('[data-success-title]').textContent = 'One last step';
                            success.querySelector('[data-success-body]').textContent =
                                'Your email app should now be open with your request ready to go. Just press send. ' +
                                'If nothing opened, email us at ' + window.NYXOPS_CONFIG.email + '.';
                        }
                        success.style.display = 'block';
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    })
                    .catch(() => {
                        showError('authorization', 'Something went wrong. Please try again or email ' +
                            window.NYXOPS_CONFIG.email + '.');
                        submitBtn.disabled = false;
                        submitBtn.querySelector('span:first-child').textContent = 'Submit Request';
                    });
            });
        }

        // Inline validation on blur
        document.querySelectorAll('.intake-input, .intake-textarea, .intake-select').forEach(el => {
            el.addEventListener('blur', function () {
                const name = this.name;
                const errorEl = document.querySelector(`.field-error[data-for="${name}"]`);
                if (errorEl && this.required && !this.value.trim()) {
                    errorEl.textContent = `${this.previousElementSibling?.textContent?.replace(' *', '') || 'This field'} is required.`;
                } else if (errorEl) {
                    errorEl.textContent = '';
                }
            });
        });
    });
})();
