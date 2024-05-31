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
                        <button class="textBtn" id="boldBtn">Bold</button>
                        <button class="textBtn" id="italicBtn">Italic</button>
                        <label for="colorPicker">Text Color:</label>
                        <input type="color" id="colorPicker" class="color-picker">
                        <button id="addBtn" class="add-btn">Add</button>
                        <button id="clearAllBtn" class="clear-all-btn">Clear All</button>
                        <button id="savePdfBtn" class="save-pdf-btn">Save as PDF</button>
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
        this.clearAllBtn = this.shadowRoot.getElementById('clearAllBtn');
        this.savePdfBtn = this.shadowRoot.getElementById('savePdfBtn');

        this.boldBtn.addEventListener('click', () => this.toggleFormat('bold'));
        this.italicBtn.addEventListener('click', () => this.toggleFormat('italic'));
        this.colorPicker.addEventListener('input', (e) => this.changeTextColor(e.target.value));
        this.addBtn.addEventListener('click', () => this.addTodoItem());
        this.clearAllBtn.addEventListener('click', () => this.clearAllTodos());
        this.savePdfBtn.addEventListener('click', () => this.saveAsPdf());

        this.draggedItem = null;
        this.todoList.addEventListener('dragstart', (e) => this.dragStart(e));
        this.todoList.addEventListener('dragover', (e) => this.dragOver(e));
        this.todoList.addEventListener('drop', (e) => this.drop(e));

        this.loadTodos();
        this.color = 'black';
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
        this.color = color;
    }

    addTodoItem() {
        const text = this.todoInput.innerHTML.trim();
        if (text) {
            const todo = { text: text, dueDate: 'No due date', priority: 'Priority: High', color:this.color};
            this.addTodoFromStorage(todo);
            this.saveTodos();
        }
    }

    addTodoFromStorage(todo) {
        const li = document.createElement('li');
        li.classList.add('todo-item');
        li.draggable = true;
        li.innerHTML = `
            <span class="display-text-item" data-color=${todo.color} style="color:${todo.color};">${todo.text}</span>
            <span class="display-due-date">${ todo.dueDate === 'Due:' ? 'No due date' : todo.dueDate}</span>
            <span class="display-priority">${todo.priority}</span>
            <input type="date" class="due-date" value="${todo.dueDate}" hidden>
            <select class="priority" hidden>
                <option value="High" ${todo.priority === 'High' ? 'selected' : ''}>High</option>
                <option value="Medium" ${todo.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                <option value="Low" ${todo.priority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
            <button class="mark-completed-btn" hidden><i>Mark as completed</i></button>
            <button class="delete-btn" hidden><i>Delete</i></button>
        `;
        if (todo.completed) {
            li.querySelector('.display-text-item').classList.add('completed');
            li.querySelector('.mark-completed-btn').textContent = "Mark as incomplete";
        }
        li.addEventListener('click', (e) => this.toggleButtons(e, li));
        li.querySelector('.mark-completed-btn').addEventListener('click', () => this.markAsCompleted(li));
        li.querySelector('.delete-btn').addEventListener('click', () => {
            li.remove();
            this.saveTodos();
        });
        li.querySelector('.due-date').addEventListener('change', () => this.updateDueDate(li));
        li.querySelector('.priority').addEventListener('change', () => this.updatePriority(li));
        this.todoList.appendChild(li);
        this.todoInput.innerHTML = '';
    }

    updateDueDate(listItem) {
        const dueDateSpan = listItem.querySelector('.display-due-date');
        const dueDateInput = listItem.querySelector('.due-date');
        dueDateSpan.textContent = 'Due:' + dueDateInput.value || 'No due date';
        this.saveTodos();
    }

    updatePriority(listItem) {
        const prioritySpan = listItem.querySelector('.display-priority');
        const prioritySelect = listItem.querySelector('.priority');
        prioritySpan.textContent = 'Priority: ' + prioritySelect.value;
        this.saveTodos();
    }

    toggleButtons(event, listItem) {
        event.stopPropagation(); // Prevent the click event from bubbling up
        const markCompletedButton = listItem.querySelector('.mark-completed-btn');
        const deleteButton = listItem.querySelector('.delete-btn');
        const dueDateInput = listItem.querySelector('.due-date');
        const prioritySelect = listItem.querySelector('.priority');
        const dueDateSpan = listItem.querySelector('.display-due-date');
        const prioritySpan = listItem.querySelector('.display-priority');
        const isVisible = !deleteButton.hidden;

        markCompletedButton.hidden = deleteButton.hidden = dueDateInput.hidden = prioritySelect.hidden = isVisible;
        dueDateSpan.hidden = prioritySpan.hidden = !isVisible;

        // Hide other buttons and remove focused class if any
        this.todoList.querySelectorAll('.todo-item').forEach(item => {
            if (item !== listItem) {
                item.querySelector('.mark-completed-btn').hidden = true;
                item.querySelector('.delete-btn').hidden = true;
                item.querySelector('.due-date').hidden = true;
                item.querySelector('.priority').hidden = true;
                item.querySelector('.display-priority').hidden = false;
                item.querySelector('.display-due-date').hidden = false;
                item.classList.remove('focused');
            }
        });

        // Toggle the focused class
        listItem.classList.toggle('focused', !isVisible);
    }

    dragStart(event) {
        this.draggedItem = event.target;
        event.dataTransfer.effectAllowed = 'move';
    }

    dragOver(event) {
        event.preventDefault();
    }

    drop(event) {
        event.preventDefault();
        if (this.draggedItem && event.target.tagName === 'LI') {
            this.todoList.insertBefore(this.draggedItem, event.target.nextSibling);
            this.draggedItem = null;
            this.saveTodos();
        }
    }

    saveTodos() {
        const todos = [];
        this.todoList.querySelectorAll('.todo-item').forEach(item => {
            todos.push({
                text: item.querySelector('.display-text-item').textContent,
                dueDate: item.querySelector('.display-due-date').textContent,
                priority: item.querySelector('.display-priority').textContent,
                completed: item.querySelector('.display-text-item').classList.contains('completed'),
                color: item.querySelector('.display-text-item').getAttribute('data-color')
            });
        });
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    loadTodos() {
        const todos = JSON.parse(localStorage.getItem('todos') || '[]');
        todos.forEach(todo => this.addTodoFromStorage(todo));
    }

    clearAllTodos() {
        while (this.todoList.firstChild) {
            this.todoList.removeChild(this.todoList.firstChild);
        }
        localStorage.removeItem('todos');
    }

    markAsCompleted(listItem) {
        const markCompletedButton = listItem.querySelector('.mark-completed-btn');
        listItem.querySelector('.display-text-item').classList.toggle('completed');
        markCompletedButton.textContent = listItem.querySelector('.display-text-item').classList.contains('completed') ? 'Mark as incomplete' : 'Mark as completed';
        if(markCompletedButton.textContent === 'Mark as incomplete'){
            listItem.querySelector('.display-text-item').classList.add('completed');
        }else{
            listItem.querySelector('.display-text-item').classList.remove('completed');
        }
        this.saveTodos();
    }

    saveAsPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('To-Do List', 10, 10);

        // Add each to-do item to the PDF
        const items = this.todoList.querySelectorAll('.todo-item');
        let yPosition = 20;
        items.forEach((item, index) => {
            const text = item.querySelector('span').textContent;
            const dueDate = item.querySelector('.display-due-date').textContent;
            const priority = item.querySelector('.display-priority').textContent;
            const completed = item.querySelector('.display-text-item').classList.contains('completed') ? ' (Completed)' : ' (Incomplete)';
            const color = item.querySelector('.display-text-item').getAttribute('data-color');

            doc.setFontSize(12);
            doc.setTextColor(color);
            doc.text(`${index + 1}. ${text}${completed}`, 10, yPosition);
            doc.setFontSize(10);
            doc.setTextColor('#000000');
            doc.text(`${dueDate}`, 10, yPosition + 5);
            doc.text(`${priority}`, 10, yPosition + 10);

            yPosition += 20; // Move down for the next item
        });

        // Save the PDF
        doc.save('todo-list.pdf');
    }

}

customElements.define('to-do-list', ToDoList);



