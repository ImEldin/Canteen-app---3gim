document.addEventListener('DOMContentLoaded', function () {
    function createCustomDropdown(selectId, optionsId, inputId) {
        const selectEl = document.getElementById(selectId);
        const optionsEl = document.getElementById(optionsId);
        const inputEl = document.getElementById(inputId);
        const selectedTextEl = selectEl.querySelector('.selected-text');

        if (!selectEl || !optionsEl || !inputEl) return;

        document.body.appendChild(optionsEl);

        const initialValue = inputEl.value;
        optionsEl.querySelectorAll('.custom-option').forEach(opt => {
            if (opt.dataset.value === initialValue) {
                opt.classList.add('selected');
            }
        });

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

                selectEl.classList.remove('open');
                optionsEl.classList.remove('open');
            });
        });

        window.addEventListener('resize', () => {
            if (optionsEl.classList.contains('open')) positionOptions();
        });
        window.addEventListener('scroll', () => {
            if (optionsEl.classList.contains('open')) positionOptions();
        }, true);
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper') && !e.target.closest('.custom-options')) {
            document.querySelectorAll('.custom-select.open').forEach(el => el.classList.remove('open'));
            document.querySelectorAll('.custom-options.open').forEach(el => el.classList.remove('open'));
        }
    });

    createCustomDropdown('roleSelect', 'roleOptions', 'roleInput');
});
