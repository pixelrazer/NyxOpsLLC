/**
 * NyxOps Navigation — Dropdown hover logic
 * Initializes all [data-dropdown] nav items with smooth show/hide behavior.
 */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-dropdown]').forEach(function (trigger) {
        var panel = trigger.querySelector('.nav-dropdown');
        var arrow = trigger.querySelector('.nav-arrow');
        if (!panel) return;

        trigger.addEventListener('mouseenter', function () {
            panel.style.opacity = '1';
            panel.style.visibility = 'visible';
            panel.style.transform = 'translateX(-50%) translateY(0)';
            if (arrow) arrow.style.transform = 'rotate(180deg)';
        });

        trigger.addEventListener('mouseleave', function () {
            panel.style.opacity = '0';
            panel.style.visibility = 'hidden';
            panel.style.transform = 'translateX(-50%) translateY(8px)';
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        });
    });

    /* link hover highlights inside dropdowns */
    document.querySelectorAll('.nav-dropdown a').forEach(function (link) {
        link.addEventListener('mouseenter', function () {
            this.style.background = '#3292FF';
            this.style.color = '#fff';
        });
        link.addEventListener('mouseleave', function () {
            this.style.background = 'transparent';
            this.style.color = '#001f3f';
        });
    });

    /* mobile menu toggle */
    var mobileBtn = document.getElementById('mobile-menu-btn');
    var mobileMenu = document.getElementById('mobile-menu');
    var mobileIcon = document.getElementById('mobile-menu-icon');

    if (mobileBtn && mobileMenu && mobileIcon) {
        mobileBtn.addEventListener('click', function () {
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.classList.add('flex');
                mobileIcon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
            } else {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
                mobileIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            }
        });
    }
});
