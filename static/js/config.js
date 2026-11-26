/**
 * NyxOps — site configuration
 *
 * The site is fully static (GitHub Pages), so form submissions go to a
 * third-party form service instead of a backend.
 *
 * formEndpoint:
 *   Paste the endpoint URL from a form service that accepts JSON POSTs,
 *   e.g. Formspree:  "https://formspree.io/f/xxxxxxx"
 *   Leave it empty ("") and forms fall back to opening the visitor's email
 *   client with a pre-filled message to `email` below.
 */
window.NYXOPS_CONFIG = {
    formEndpoint: '',
    email: 'nyxops.security@gmail.com',
};
