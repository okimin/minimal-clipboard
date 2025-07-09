document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('itemInput');
    const aliasInput = document.getElementById('aliasInput');
    const addItemBtn = document.getElementById('addItemBtn');
    const itemList = document.getElementById('itemList');

    let items = []; // Array to hold our list items

    // Function to save items to Chrome storage
    const saveItems = () => {
        chrome.storage.sync.set({ quickClipItems: items }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving items:", chrome.runtime.lastError);
            } else {
                console.log('Items saved.');
            }
        });
    };

    // Function to load items from Chrome storage
    const loadItems = () => {
        chrome.storage.sync.get(['quickClipItems'], (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error loading items:", chrome.runtime.lastError);
                items = []; // Initialize empty if error
            } else {
                items = result.quickClipItems || [];
                renderItems();
                console.log('Items loaded:', items);
            }
        });
    };

    // Function to render items in the UI
    const renderItems = () => {
        itemList.innerHTML = ''; // Clear current list
        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'list-item';
            li.setAttribute('draggable', 'true'); // Make items draggable
            li.dataset.index = index; // Store original index for drag-drop

            const itemContent = document.createElement('div');
            itemContent.className = 'item-content';

            if (item.alias) {
                const aliasSpan = document.createElement('span');
                aliasSpan.className = 'item-alias';
                aliasSpan.textContent = item.alias;
                itemContent.appendChild(aliasSpan);
            }

            const valueSpan = document.createElement('span');
            valueSpan.className = 'item-value';
            valueSpan.textContent = item.value;
            itemContent.appendChild(valueSpan);

            li.appendChild(itemContent);

            const itemActions = document.createElement('div');
            itemActions.className = 'item-actions';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent drag-start on click
                copyToClipboard(item.value, copyBtn); // Pass the button element
            });
            itemActions.appendChild(copyBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent drag-start on click
                deleteItem(index);
            });
            itemActions.appendChild(deleteBtn);

            li.appendChild(itemActions);
            itemList.appendChild(li);
        });
        addDragAndDropListeners(); // Add listeners after rendering
    };

    // Function to add a new item
    const addItem = () => {
        const itemValue = itemInput.value.trim();
        const itemAlias = aliasInput.value.trim();

        if (itemValue) {
            if (itemAlias.length > 20) {
                alert("Alias cannot be longer than 20 characters.");
                return;
            }

            items.push({ value: itemValue, alias: itemAlias || null });
            itemInput.value = '';
            aliasInput.value = '';
            saveItems();
            renderItems();
        }
    };

    // Function to copy text to clipboard and provide visual feedback
    const copyToClipboard = (text, button) => {
        navigator.clipboard.writeText(text).then(() => {
            // Change button to checkmark
            button.textContent = 'Copied!'; // Unicode checkmark
            button.classList.add('copied'); // Add class for styling if needed

            setTimeout(() => {
                button.textContent = 'Copy'; // Revert text
                button.classList.remove('copied'); // Remove class
            }, 1500); // Revert after 1.5 seconds
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy item to clipboard.'); // Keep alert for actual errors
        });
    };

    // Function to delete an item
    const deleteItem = (index) => {
        items.splice(index, 1); // Remove item at index
        saveItems();
        renderItems();
    };

    // --- Drag and Drop Functionality ---
    let dragStartIndex;

    const addDragAndDropListeners = () => {
        const listItems = document.querySelectorAll('.list-item');
        listItems.forEach(item => {
            item.addEventListener('dragstart', dragStart);
            item.addEventListener('dragover', dragOver);
            item.addEventListener('dragleave', dragLeave);
            item.addEventListener('drop', drop);
            item.addEventListener('dragend', dragEnd);
        });
    };

    function dragStart(e) {
        dragStartIndex = +this.dataset.index; // Convert string to number
        setTimeout(() => this.classList.add('dragging'), 0); // Add class after a tiny delay
    }

    function dragOver(e) {
        e.preventDefault(); // Necessary to allow drop
    }

    function dragLeave() {
        this.classList.remove('dragging-over'); // Remove highlight if leaving
    }

    function drop(e) {
        e.preventDefault();
        const dragEndIndex = +this.dataset.index;

        if (dragStartIndex !== dragEndIndex) {
            swapItems(dragStartIndex, dragEndIndex);
            saveItems();
            renderItems(); // Re-render to update indices and order
        }
        this.classList.remove('dragging-over');
    }

    function dragEnd() {
        const listItems = document.querySelectorAll('.list-item');
        listItems.forEach(item => {
            item.classList.remove('dragging', 'dragging-over');
        });
    }

    function swapItems(fromIndex, toIndex) {
        const itemOne = items[fromIndex];
        items.splice(fromIndex, 1); // Remove item from original position
        items.splice(toIndex, 0, itemOne); // Insert item at new position
    }

    // Event Listeners
    addItemBtn.addEventListener('click', addItem);
    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addItem();
        }
    });
    aliasInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addItem();
        }
    });


    // Initial load of items when the popup opens
    loadItems();
});