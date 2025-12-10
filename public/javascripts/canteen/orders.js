document.addEventListener('DOMContentLoaded', function () {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        window.addEventListener('load', function() {
            loadingOverlay.classList.add('hidden');
        });
    }

    function createCustomDropdown(selectId, optionsId, inputId, saveKey = null, submitOnChange = false) {
        const selectEl = document.getElementById(selectId);
        const optionsEl = document.getElementById(optionsId);
        const inputEl = document.getElementById(inputId);
        const selectedTextEl = selectEl ? selectEl.querySelector('.selected-text') : null;
        const form = inputEl ? inputEl.form : null;

        if (!selectEl || !optionsEl || !inputEl || !selectedTextEl) return;

        document.body.appendChild(optionsEl);

        if (saveKey) {
            const savedValue = localStorage.getItem(saveKey);
            if (savedValue) inputEl.value = savedValue;
        }

        const initialValue = inputEl.value;
        const initialOption = optionsEl.querySelector(`.custom-option[data-value="${initialValue}"]`) || optionsEl.querySelector('.custom-option');
        if (initialOption) {
            selectedTextEl.textContent = initialOption.textContent;
            optionsEl.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            initialOption.classList.add('selected');
        }

        const positionOptions = () => {
            const rect = selectEl.getBoundingClientRect();
            optionsEl.style.top = `${rect.bottom + 8}px`;
            optionsEl.style.left = `${rect.left}px`;
            optionsEl.style.width = `${rect.width}px`;
        };

        selectEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = selectEl.classList.contains('open');
            document.querySelectorAll('.custom-select.open').forEach(el => el.classList.remove('open'));
            document.querySelectorAll('.custom-options.open').forEach(el => el.classList.remove('open'));

            if (!isOpen) {
                positionOptions();
                selectEl.classList.add('open');
                optionsEl.classList.add('open');
            }
        });

        optionsEl.querySelectorAll('.custom-option').forEach(option => {
            option.addEventListener('click', () => {
                optionsEl.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                selectedTextEl.textContent = option.textContent;
                inputEl.value = option.dataset.value;

                if (saveKey) localStorage.setItem(saveKey, inputEl.value);

                selectEl.classList.remove('open');
                optionsEl.classList.remove('open');

                if (submitOnChange && form) form.submit();
            });
        });

        window.addEventListener('resize', () => { if (optionsEl.classList.contains('open')) positionOptions(); });
        window.addEventListener('scroll', () => { if (optionsEl.classList.contains('open')) positionOptions(); }, true);
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper') && !e.target.closest('.custom-options')) {
            document.querySelectorAll('.custom-select.open').forEach(el => el.classList.remove('open'));
            document.querySelectorAll('.custom-options.open').forEach(el => el.classList.remove('open'));
        }
    });

    createCustomDropdown('roleSelect', 'roleOptions', 'roleInput');
    createCustomDropdown('breakSelect', 'breakOptions', 'breakInput');
    createCustomDropdown('sortSelect', 'sortOptions', 'sortInput');
    createCustomDropdown('pageSizeSelect', 'pageSizeOptions', 'pageSizeInput', 'pageSize', true);

    const completedToggle = document.getElementById('showCompleted');
    if (completedToggle) {
        const savedShowCompleted = localStorage.getItem('showCompleted');
        if (savedShowCompleted !== null) {
            completedToggle.checked = savedShowCompleted === 'true';
            const urlParams = new URLSearchParams(window.location.search);
            if (completedToggle.checked && !urlParams.has('showCompleted')) {
                completedToggle.form.submit();
            }
        }

        completedToggle.addEventListener('change', function () {
            localStorage.setItem('showCompleted', this.checked);
            if (this.form) this.form.submit();
        });
    }

    const clearBtn = document.querySelector('.clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function (e) {
            // Reset localStorage values
            localStorage.removeItem('showCompleted');
            localStorage.removeItem('pageSize');
        });
    }
});
