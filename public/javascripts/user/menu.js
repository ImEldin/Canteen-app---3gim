document.addEventListener('DOMContentLoaded', function () {
    function createCustomDropdown(selectId, optionsId, inputId) {
        const selectEl = document.getElementById(selectId);
        const optionsEl = document.getElementById(optionsId);
        const inputEl = document.getElementById(inputId);
        const selectedTextEl = selectEl.querySelector('.selected-text');

        if (!selectEl || !optionsEl || !inputEl || !selectedTextEl) return;

        document.body.appendChild(optionsEl);

        const initialValue = inputEl.value;
        let initialTextFound = false;
        optionsEl.querySelectorAll('.custom-option').forEach(opt => {
            if (opt.dataset.value === initialValue) {
                selectedTextEl.textContent = opt.textContent;
                opt.classList.add('selected');
                initialTextFound = true;
            }
        });
        if (!initialTextFound && initialValue === "") {
            const defaultOption = optionsEl.querySelector('.custom-option[data-value=""]');
            if(defaultOption) selectedTextEl.textContent = defaultOption.textContent;
        }


        const positionOptions = () => {
            if (!selectEl.classList.contains('open')) return;
            const rect = selectEl.getBoundingClientRect();
            optionsEl.style.left = `${rect.left}px`;
            optionsEl.style.top = `${rect.bottom + 4}px`;
            optionsEl.style.width = `${rect.width}px`;
        };

        selectEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = selectEl.classList.toggle('open');
            optionsEl.classList.toggle('open', isOpen);
            if (isOpen) {
                positionOptions();
            }
        });

        optionsEl.querySelectorAll('.custom-option').forEach(option => {
            option.addEventListener('click', () => {
                inputEl.value = option.dataset.value;
                selectedTextEl.textContent = option.textContent;
                selectEl.classList.remove('open');
                optionsEl.classList.remove('open');
                optionsEl.querySelector('.selected')?.classList.remove('selected');
                option.classList.add('selected');
            });
        });

        ['resize', 'scroll'].forEach(evt => window.addEventListener(evt, positionOptions, true));
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper, .custom-options')) {
            document.querySelectorAll('.custom-select.open, .custom-options.open').forEach(el => {
                el.classList.remove('open');
            });
        }
    });

    createCustomDropdown('tagSelect', 'tagOptions', 'tagInput');
    createCustomDropdown('orderSelect', 'orderOptions', 'orderInput');
    createCustomDropdown('breakSlotSelect', 'breakSlotOptions', 'break_slot');

    if (document.getElementById('pickup_break')?.checked) {
        enableBreak();
    } else if (document.getElementById('pickup_time_radio')?.checked) {
        enableTime();
    }
});

function enableBreak() {
    const breakWrapper = document.getElementById('break_select_wrapper');
    const timeInput = document.getElementById('pickup_time');
    if (breakWrapper) breakWrapper.style.display = 'block';
    if (timeInput) {
        timeInput.style.display = 'none';
        timeInput.value = "";
    }
}

function enableTime() {
    const breakWrapper = document.getElementById('break_select_wrapper');
    const timeInput = document.getElementById('pickup_time');
    const breakInput = document.getElementById('break_slot');
    if (breakWrapper) breakWrapper.style.display = 'none';
    if (timeInput) timeInput.style.display = 'block';
    if (breakInput) breakInput.value = "";

    const breakSelectText = document.querySelector('#breakSlotSelect .selected-text');
    if (breakSelectText) breakSelectText.textContent = 'Select break';
    document.querySelector('#breakSlotOptions .selected')?.classList.remove('selected');
}
