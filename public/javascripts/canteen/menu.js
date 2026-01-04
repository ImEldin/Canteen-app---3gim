document.addEventListener('DOMContentLoaded', () => {
    const menuDisplayContainer = document.getElementById("menuDisplayContainer");
    const menuFormContainer = document.getElementById("menuFormContainer");
    const editBtn = document.getElementById("editMenuBtn");
    const createBtn = document.getElementById("createMenuBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const addMenuItemBtn = document.getElementById("addMenuItemBtn");
    const menuForm = document.getElementById("menuForm");

    const { tags, menu } = window.canteenMenuData || { tags: [], menu: [] };
    let itemIndex = 0;

    function showForm() {
        menuDisplayContainer.style.display = "none";
        menuFormContainer.style.display = "block";
    }

    function showDisplay() {
        menuDisplayContainer.style.display = "block";
        menuFormContainer.style.display = "none";
        document.getElementById("menuItemsContainer").innerHTML = "";
        itemIndex = 0;
    }

    function prefillForm() {
        if (menu && menu.length > 0) {
            menu.forEach(item => {
                addMenuItem(
                    item.name,
                    item.description,
                    item.price,
                    item.image_url,
                    item.Tags.map(t => t.id)
                );
            });
        }
    }

    function addMenuItem(name = "", description = "", price = "", imageUrl = "", existingTags = []) {
        const container = document.getElementById("menuItemsContainer");
        const currentIndex = itemIndex++;

        const itemHtml = `
            <div class="menu-item-form" data-index="${currentIndex}">
                <div class="menu-item-form-header">
                    <h3>Stavka #${currentIndex + 1}</h3>
                    <button type="button" class="remove-item-btn" onclick="removeMenuItem(this)"><i class="bi bi-trash"></i> Obriši</button>
                </div>
                <div class="form-group">
                    <label for="name-${currentIndex}" class="form-label">Naziv</label>
                    <input id="name-${currentIndex}" class="form-control" name="items[${currentIndex}][name]" value="${name}" required>
                </div>
                <div class="form-group">
                    <label for="desc-${currentIndex}" class="form-label">Opis</label>
                    <input id="desc-${currentIndex}" class="form-control" name="items[${currentIndex}][description]" value="${description}" required>
                </div>
                <div class="form-group">
                    <label for="price-${currentIndex}" class="form-label">Cijena (KM)</label>
                    <input id="price-${currentIndex}" class="form-control" name="items[${currentIndex}][price]" type="number" min = "0" step="0.01" value="${price}" required>
                </div>
                <input type="hidden" name="items[${currentIndex}][image]" value="${imageUrl || ''}">
                <div class="form-group">
                    <label class="form-label">Slika</label>
                    <div class="image-upload-container">
                        <div class="image-preview-wrapper">
                            <img src="${imageUrl || '/images/default-food.png'}" class="item-image-preview" id="preview-${currentIndex}">
                        </div>
                        <div class="image-upload-details">
                            <label for="img-${currentIndex}" class="custom-file-upload">
                                <i class="bi bi-upload"></i> Izaberi sliku
                            </label>
                            <input id="img-${currentIndex}" type="file" name="images[${currentIndex}]" accept="image/*" onchange="updateImagePreview(this)">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Tagovi</label>
                    <div class="tag-selection">
                        <div class="custom-select" id="tag-select-container-${currentIndex}">
                            <div class="selected-text">Izaberi tag</div>
                            <i class="bi bi-chevron-down"></i>
                        </div>
                        <button type="button" class="btn-secondary add-tag-btn">Dodaj</button>
                    </div>
                    <div class="tag-list" id="tag-list-${currentIndex}"></div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", itemHtml);

        const tagList = document.getElementById(`tag-list-${currentIndex}`);
        existingTags.forEach(tagId => {
            const tagObj = tags.find(t => t.id === tagId);
            if (tagObj) {
                appendTagElement(tagList, currentIndex, tagObj.id, tagObj.name);
            }
        });
    }

    window.updateImagePreview = (input) => {
        const index = input.id.split('-').pop();
        const preview = document.getElementById(`preview-${index}`);
        const fileNameDisplay = document.getElementById(`file-name-${index}`);
        const file = input.files[0];

        if (file) {
            preview.src = URL.createObjectURL(file);
            fileNameDisplay.textContent = file.name;
        } else {
            const existingImageUrl = input.closest('.menu-item-form').querySelector('input[type="hidden"][name*="[image]"]').value;
            preview.src = existingImageUrl || '/images/default-food.png';
            fileNameDisplay.textContent = existingImageUrl ? existingImageUrl.split('/').pop() : 'Nijedna slika nije izabrana.';
        }
    };

    function appendTagElement(list, index, tagId, tagName) {
        const tagExists = list.querySelector(`input[value="${tagId}"]`);
        if (tagExists) return;

        list.insertAdjacentHTML("beforeend", `
            <span class="tag">
                ${tagName}
                <button type="button" class="remove-tag-btn" onclick="this.parentElement.remove()">&times;</button>
                <input type="hidden" name="items[${index}][tags][]" value="${tagId}">
            </span>
        `);
    }

    window.removeMenuItem = (button) => {
        button.closest('.menu-item-form').remove();
    };

    function createTagDropdown(select, index) {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-options';
        optionsContainer.id = `tag-options-${index}`;
        let optionsHtml = '';
        tags.forEach(tag => {
            optionsHtml += `<div class="custom-option" data-value="${tag.id}">${tag.name}</div>`;
        });
        optionsContainer.innerHTML = optionsHtml;
        document.body.appendChild(optionsContainer);
        return optionsContainer;
    }

    function positionOptions(select, options) {
        const rect = select.getBoundingClientRect();
        options.style.top = `${rect.bottom + 4}px`;
        options.style.left = `${rect.left}px`;
        options.style.width = `${rect.width}px`;
    }

    document.body.addEventListener('click', (e) => {
        const select = e.target.closest('.custom-select');
        if (select) {
            const index = select.id.split('-').pop();
            let options = document.getElementById(`tag-options-${index}`);
            if (!options) {
                options = createTagDropdown(select, index);
            }

            const isOpen = options.classList.contains('open');
            document.querySelectorAll('.custom-options.open').forEach(opt => {
                opt.classList.remove('open');
                const optIndex = opt.id.split('-').pop();
                document.getElementById(`tag-select-container-${optIndex}`).classList.remove('open');
            });

            if (!isOpen) {
                positionOptions(select, options);
                options.classList.add('open');
                select.classList.add('open');
            }
            return;
        }

        const option = e.target.closest('.custom-option');
        if (option) {
            const optionsContainer = option.parentElement;
            const index = optionsContainer.id.split('-').pop();
            const selectContainer = document.getElementById(`tag-select-container-${index}`);

            selectContainer.querySelector('.selected-text').textContent = option.textContent;
            selectContainer.dataset.selectedValue = option.dataset.value;
            selectContainer.dataset.selectedText = option.textContent;

            optionsContainer.classList.remove('open');
            selectContainer.classList.remove('open');
            return;
        }

        const addTagBtn = e.target.closest('.add-tag-btn');
        if (addTagBtn) {
            const formItem = addTagBtn.closest('.menu-item-form');
            const index = formItem.dataset.index;
            const selectContainer = document.getElementById(`tag-select-container-${index}`);
            const tagList = document.getElementById(`tag-list-${index}`);

            const tagId = selectContainer.dataset.selectedValue;
            const tagName = selectContainer.dataset.selectedText;

            if (tagId && tagName) {
                appendTagElement(tagList, index, tagId, tagName);
            }
            return;
        }

        if (!e.target.closest('.custom-select') && !e.target.closest('.custom-options')) {
            document.querySelectorAll('.custom-options.open').forEach(opt => opt.classList.remove('open'));
            document.querySelectorAll('.custom-select.open').forEach(sel => sel.classList.remove('open'));
        }
    });

    const re_position = () => {
        document.querySelectorAll('.custom-options.open').forEach(options => {
            const index = options.id.split('-').pop();
            const select = document.getElementById(`tag-select-container-${index}`);
            if (select) {
                positionOptions(select, options);
            }
        });
    };
    window.addEventListener('resize', re_position);
    window.addEventListener('scroll', re_position, true);

    if (editBtn) {
        editBtn.addEventListener("click", () => {
            showForm();
            prefillForm();
        });
    }

    if (createBtn) {
        createBtn.addEventListener("click", () => {
            showForm();
            addMenuItem();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", showDisplay);
    }

    if (addMenuItemBtn) {
        addMenuItemBtn.addEventListener("click", () => addMenuItem());
    }

    if (menuForm) {
        menuForm.addEventListener('submit', function() {
            const btn = this.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Spremanje...';
            btn.disabled = true;
        });
    }

    document.getElementById('loading-overlay').classList.add('hidden');
});
