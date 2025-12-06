const select = document.getElementById('roleSelect');
const options = document.getElementById('roleOptions');
const input = document.getElementById('roleInput');
const selectedText = select.querySelector('.selected-text');

document.body.appendChild(options);
options.style.position = 'fixed';
options.style.width = select.offsetWidth + 'px';

function positionOptions() {
    const rect = select.getBoundingClientRect();
    options.style.top = (rect.bottom + 8) + 'px';
    options.style.left = rect.left + 'px';
    options.style.width = rect.width + 'px';
}

select.addEventListener('click', () => {
    positionOptions();
    select.classList.toggle('open');
    options.classList.toggle('open');
});

options.querySelectorAll('.custom-option').forEach(option => {
    option.addEventListener('click', () => {
        options.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectedText.textContent = option.textContent;
        input.value = option.dataset.value;
        select.classList.remove('open');
        options.classList.remove('open');
    });
});

document.addEventListener('click', (e) => {
    if (!select.contains(e.target) && !options.contains(e.target)) {
        select.classList.remove('open');
        options.classList.remove('open');
    }
});

window.addEventListener('resize', () => {
    if (options.classList.contains('open')) {
        positionOptions();
    }
});

window.addEventListener('scroll', () => {
    if (options.classList.contains('open')) {
        positionOptions();
    }
}, true);

document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.querySelector('a[href="/admin/export-temp-passwords"]');

    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            const btn = this;
            const originalHTML = btn.innerHTML;

            btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Downloading...';
            btn.style.pointerEvents = 'none';

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const createForm = document.querySelector('form[action="/admin/create-user"]');

    if (createForm) {
        createForm.addEventListener('submit', function() {
            const btn = this.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Creating User...';
            btn.disabled = true;

            window.addEventListener('beforeunload', () => {
                // page is leaving, nothing more to do
            });
        });
    }
});