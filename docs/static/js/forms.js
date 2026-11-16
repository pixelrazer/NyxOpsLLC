/**
 * NyxOps — static form submission
 *
 * NyxForms.submit(data, subject) -> Promise<{ via: 'endpoint' | 'email' }>
 *   - If NYXOPS_CONFIG.formEndpoint is set, POSTs JSON to it.
 *   - Otherwise opens a pre-filled email to NYXOPS_CONFIG.email.
 *
 * Also wires up the contact form (#contact-form) if present on the page.
 */
(function () {
    'use strict';

    var LABELS = {
        first_name: 'First name', last_name: 'Last name', contact_name: 'Name', email: 'Email',
        company: 'Company', company_name: 'Company', phone: 'Phone', company_website: 'Website',
        service: 'Service interest', message: 'Message', test_types: 'Services requested',
        asset_list: 'Assets in scope', environment_type: 'Environment', compliance_driver: 'Compliance driver',
        timeline_preference: 'Timeline', special_notes: 'Notes', authorization: 'Authorisation confirmed',
    };

    function config() {
        return window.NYXOPS_CONFIG || { formEndpoint: '', email: 'csectld@proton.me' };
    }

    function toText(data) {
        return Object.keys(data)
            .filter(function (k) { return k.charAt(0) !== '_' && data[k] !== '' && data[k] != null; })
            .map(function (k) {
                var v = Array.isArray(data[k]) ? data[k].join(', ') : String(data[k]);
                var label = LABELS[k] || k;
                return v.indexOf('\n') !== -1 ? label + ':\n' + v : label + ': ' + v;
            })
            .join('\n\n');
    }

    function submit(data, subject) {
        var cfg = config();
        if (data._gotcha) {
            // Bot filled the honeypot: pretend success, send nothing.
            return Promise.resolve({ via: 'endpoint' });
        }

        if (cfg.formEndpoint) {
            var payload = Object.assign({}, data, { _subject: subject });
            delete payload._gotcha;
            return fetch(cfg.formEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
            }).then(function (resp) {
                if (!resp.ok) throw new Error('Form service returned ' + resp.status);
                return { via: 'endpoint' };
            });
        }

        var href = 'mailto:' + cfg.email +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(toText(data));
        window.location.href = href;
        return Promise.resolve({ via: 'email' });
    }

    window.NyxForms = { submit: submit, toText: toText };

    // ── Contact form ─────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var form = document.getElementById('contact-form');
        if (!form) return;

        // Pre-select service from ?service=... (e.g. links from Cyber Essentials page)
        var params = new URLSearchParams(window.location.search);
        var preset = params.get('service');
        var select = form.querySelector('[name="service"]');
        if (preset && select && select.querySelector('option[value="' + CSS.escape(preset) + '"]')) {
            select.value = preset;
        }

        var success = document.getElementById('contact-success');
        var error = document.getElementById('contact-error');
        var button = document.getElementById('contact-submit');
        var label = button ? button.querySelector('[data-label]') : null;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            error.hidden = true;
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            var data = {};
            new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });
            if (select && select.selectedIndex > 0) data.service = select.options[select.selectedIndex].text;

            var name = (data.first_name + ' ' + (data.last_name || '')).trim();
            var subject = '[NyxOps Contact] ' + name + ' — ' + (data.service || 'General Inquiry');

            button.disabled = true;
            if (label) label.textContent = 'Sending…';

            submit(data, subject).then(function (res) {
                if (res.via === 'email') {
                    success.querySelector('[data-success-title]').textContent = 'Almost there!';
                    success.querySelector('[data-success-body]').textContent =
                        'Your email app should now be open with your message ready to go. Just press send. ' +
                        'If nothing opened, email us directly at ' + config().email + '.';
                } else {
                    form.reset();
                }
                success.hidden = false;
                success.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }).catch(function () {
                error.textContent = 'Something went wrong sending your message. Please try again or email us at ' +
                    config().email + '.';
                error.hidden = false;
            }).then(function () {
                button.disabled = false;
                if (label) label.textContent = 'Send Message';
            });
        });
    });
})();
