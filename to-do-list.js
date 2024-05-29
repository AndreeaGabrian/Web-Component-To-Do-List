class ToDoList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles.css">
            <div class="todo-box">
                <div class="todo-container">
                    <div class="todo-title">To-Do List</div>
                    <div class="toolbar">
                        <button id="boldBtn">Bold</button>
                        <button id="italicBtn">Italic</button>
                        <label for="colorPicker">Text Color:</label>
                            <input type="color" id="colorPicker" class="color-picker">
                        <button id="addBtn" class="add-btn">Add</button>
                    </div>
                    <div contenteditable="true" class="todo-input" id="todoInput">Type</div>
                    <ul class="todo-list" id="todoList"></ul>
                </div>
            </div>
        `;

        this.todoInput = this.shadowRoot.getElementById('todoInput');
        this.todoInput.addEventListener('click', () => this.clearPlaceholder());
        this.todoList = this.shadowRoot.getElementById('todoList');
        this.boldBtn = this.shadowRoot.getElementById('boldBtn');
        this.italicBtn = this.shadowRoot.getElementById('italicBtn');
        this.colorPicker = this.shadowRoot.getElementById('colorPicker');
        this.addBtn = this.shadowRoot.getElementById('addBtn');

        this.boldBtn.addEventListener('click', () => this.toggleFormat('bold'));
        this.italicBtn.addEventListener('click', () => this.toggleFormat('italic'));
        this.colorPicker.addEventListener('input', (e) => this.changeTextColor(e.target.value));
        this.addBtn.addEventListener('click', () => this.addTodoItem());
    }

    clearPlaceholder() {
        if (this.todoInput.textContent.trim() === 'Type') {
            this.todoInput.textContent = '';
        }
    }


    toggleFormat(command) {
        document.execCommand(command, false, null);
        this.updateButtonState(command);
    }

    updateButtonState(command) {
        const active = document.queryCommandState(command);
        const button = command === 'bold' ? this.boldBtn : this.italicBtn;
        if (active) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }

    changeTextColor(color) {
        document.execCommand('foreColor', false, color);
    }

    addTodoItem() {
        const text = this.todoInput.innerHTML.trim();
        if (text) {
            const li = document.createElement('li');
            li.classList.add('todo-item');
            li.innerHTML = `
                <span>${text}</span>
                <button class="delete-btn">Delete</button>
            `;
            li.querySelector('.delete-btn').addEventListener('click', () => li.remove());
            this.todoList.appendChild(li);
            this.todoInput.innerHTML = '';
        }
    }
}

customElements.define('to-do-list', ToDoList);
