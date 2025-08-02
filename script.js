// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.currentFilters = {
            status: 'all',
            priority: 'all',
            search: ''
        };
        this.sortBy = 'date';
        this.draggedElement = null;
        
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.renderTasks();
        this.updateStats();
        this.loadTheme();
        
        // Show welcome message
        setTimeout(() => {
            this.showNotification('Welcome to Task Manager Pro! Start organizing your day.', 'info');
        }, 1000);
    }

    // LocalStorage Operations
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
        
        // Add default tasks if none exist
        if (this.tasks.length === 0) {
            this.addDefaultTasks();
        }
    }

    addDefaultTasks() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const defaultTasks = [
            {
                id: this.generateId(),
                title: 'Welcome to Task Manager Pro!',
                description: 'This is your first task. You can edit, delete, or mark it as complete.',
                completed: false,
                priority: 'high',
                dueDate: today.toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                order: 0
            },
            {
                id: this.generateId(),
                title: 'Add your first task',
                description: 'Create a new task with title, description, due date, and priority.',
                completed: false,
                priority: 'medium',
                dueDate: tomorrow.toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                order: 1
            }
        ];
        
        this.tasks = defaultTasks;
        this.saveTasks();
    }

    // Task CRUD Operations
    addTask(title, description, dueDate, priority) {
        const task = {
            id: this.generateId(),
            title: title.trim(),
            description: description.trim(),
            completed: false,
            priority: priority || 'medium',
            dueDate: dueDate || null,
            createdAt: new Date().toISOString(),
            order: this.tasks.length
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task added successfully!', 'success');
    }

    editTask(id, title, description, dueDate, priority) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                title: title.trim(),
                description: description.trim(),
                dueDate: dueDate || null,
                priority: priority || 'medium'
            };
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    deleteTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task && confirm(`Are you sure you want to delete "${task.title}"?`)) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    toggleTaskComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification(
                task.completed ? 'Task marked as completed!' : 'Task marked as pending!',
                'success'
            );
        }
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        if (!dateString) return 'No due date';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();
        const isOverdue = date < today && !isToday;
        
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        if (isOverdue) return `Overdue - ${formattedDate}`;
        if (isToday) return `Today - ${formattedDate}`;
        if (isTomorrow) return `Tomorrow - ${formattedDate}`;
        
        return formattedDate;
    }

    getTaskStatus(task) {
        if (task.completed) return 'completed';
        if (!task.dueDate) return 'pending';
        
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dueDate < today) return 'overdue';
        return 'pending';
    }

    // Filtering and Sorting
    filterTasks() {
        this.filteredTasks = this.tasks.filter(task => {
            const matchesStatus = this.currentFilters.status === 'all' || 
                                (this.currentFilters.status === 'completed' && task.completed) ||
                                (this.currentFilters.status === 'pending' && !task.completed);
            
            const matchesPriority = this.currentFilters.priority === 'all' || 
                                  task.priority === this.currentFilters.priority;
            
            const matchesSearch = this.currentFilters.search === '' || 
                                task.title.toLowerCase().includes(this.currentFilters.search.toLowerCase());
            
            return matchesStatus && matchesPriority && matchesSearch;
        });
        
        this.sortTasks();
    }

    sortTasks() {
        this.filteredTasks.sort((a, b) => {
            if (this.sortBy === 'date') {
                if (!a.dueDate && !b.dueDate) return b.order - a.order;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (this.sortBy === 'priority') {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                return priorityDiff !== 0 ? priorityDiff : b.order - a.order;
            }
            return b.order - a.order;
        });
    }

    // Rendering
    renderTasks() {
        this.filterTasks();
        const tasksList = document.getElementById('tasksList');
        const noTasksMessage = document.getElementById('noTasksMessage');
        
        if (this.filteredTasks.length === 0) {
            tasksList.innerHTML = '';
            noTasksMessage.style.display = 'block';
            return;
        }
        
        noTasksMessage.style.display = 'none';
        tasksList.innerHTML = this.filteredTasks.map(task => this.createTaskHTML(task)).join('');
        
        this.setupTaskEventListeners();
        this.setupDragAndDrop();
    }

    createTaskHTML(task) {
        const status = this.getTaskStatus(task);
        const statusClasses = [];
        
        if (task.completed) statusClasses.push('completed');
        if (status === 'overdue') statusClasses.push('overdue');
        if (status === 'due-today') statusClasses.push('due-today');
        if (status === 'due-tomorrow') statusClasses.push('due-tomorrow');
        
        return `
            <div class="task-item ${statusClasses.join(' ')}" data-id="${task.id}" draggable="true">
                <div class="task-header">
                    <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                    <div class="task-actions">
                        <button class="btn-complete" title="${task.completed ? 'Mark as pending' : 'Mark as complete'}">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                        <button class="btn-edit" title="Edit task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-description">
                    <p>${this.escapeHtml(task.description || 'No description')}</p>
                </div>
                <div class="task-meta">
                    <div class="task-due-date">
                        <i class="fas fa-calendar"></i>
                        ${this.formatDate(task.dueDate)}
                    </div>
                    <span class="task-priority priority-${task.priority}">
                        ${task.priority} priority
                    </span>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const overdueTasks = this.tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            return new Date(task.dueDate) < new Date();
        }).length;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('overdueTasks').textContent = overdueTasks;
    }

    // Event Listeners
    setupEventListeners() {
        // Add task form
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const dueDate = document.getElementById('taskDueDate').value;
            const priority = document.getElementById('taskPriority').value;
            
            this.addTask(title, description, dueDate, priority);
            e.target.reset();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.renderTasks();
            

        });

        // Filters
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.renderTasks();
        });

        document.getElementById('priorityFilter').addEventListener('change', (e) => {
            this.currentFilters.priority = e.target.value;
            this.renderTasks();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.currentFilters = { status: 'all', priority: 'all', search: '' };
            document.getElementById('searchInput').value = '';
            document.getElementById('statusFilter').value = 'all';
            document.getElementById('priorityFilter').value = 'all';
            this.renderTasks();

        });

        // Sorting
        document.getElementById('sortByDate').addEventListener('click', () => {
            this.sortBy = 'date';
                    this.renderTasks();
        this.showNotification('Sorted by due date', 'info');
        });

        document.getElementById('sortByPriority').addEventListener('click', () => {
            this.sortBy = 'priority';
                    this.renderTasks();
        this.showNotification('Sorted by priority', 'info');
        });

        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('editTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedTask();
        });

        // Close modal when clicking outside
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeModal();
            }
        });
    }

    setupTaskEventListeners() {
        // Complete toggle
        document.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                this.toggleTaskComplete(taskId);
            });
        });

        // Edit task
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                this.openEditModal(taskId);
            });
        });

        // Delete task
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                this.deleteTask(taskId);
            });
        });
    }

    // Modal Operations
    openEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskDueDate').value = task.dueDate || '';
        document.getElementById('editTaskPriority').value = task.priority;

        document.getElementById('editModal').classList.add('show');
    }

    closeModal() {
        document.getElementById('editModal').classList.remove('show');
        document.getElementById('editTaskForm').reset();
    }

    saveEditedTask() {
        const id = document.getElementById('editTaskId').value;
        const title = document.getElementById('editTaskTitle').value;
        const description = document.getElementById('editTaskDescription').value;
        const dueDate = document.getElementById('editTaskDueDate').value;
        const priority = document.getElementById('editTaskPriority').value;

        this.editTask(id, title, description, dueDate, priority);
        this.closeModal();
    }

    // Dark Mode
    toggleDarkMode() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = document.querySelector('#darkModeToggle i');
        icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        
        this.showNotification(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`, 'info');
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = document.querySelector('#darkModeToggle i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Drag and Drop
    setupDragAndDrop() {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedElement = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.outerHTML);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedElement = null;
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            item.addEventListener('dragenter', (e) => {
                e.preventDefault();
                if (item !== this.draggedElement) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                
                if (this.draggedElement && this.draggedElement !== item) {
                    this.reorderTasks(this.draggedElement.dataset.id, item.dataset.id);
                }
            });
        });
    }

    reorderTasks(draggedId, targetId) {
        const draggedIndex = this.tasks.findIndex(task => task.id === draggedId);
        const targetIndex = this.tasks.findIndex(task => task.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedTask] = this.tasks.splice(draggedIndex, 1);
            this.tasks.splice(targetIndex, 0, draggedTask);
            
            // Update order property
            this.tasks.forEach((task, index) => {
                task.order = index;
            });
            
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task reordered successfully!', 'success');
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    


    // Due Date Reminders
    checkDueDateReminders() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dueToday = this.tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate.toDateString() === today.toDateString();
        });
        
        const dueTomorrow = this.tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate.toDateString() === tomorrow.toDateString();
        });
        
        const overdue = this.tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate < today && dueDate.toDateString() !== today.toDateString();
        });
        
        if (dueToday.length > 0) {
            this.showNotification(`${dueToday.length} task(s) due today!`, 'warning');
        }
        
        if (dueTomorrow.length > 0) {
            this.showNotification(`${dueTomorrow.length} task(s) due tomorrow!`, 'info');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    
    // Check for due date reminders on page load
    setTimeout(() => {
        taskManager.checkDueDateReminders();
    }, 1000);
    
    // Check for reminders every hour
    setInterval(() => {
        taskManager.checkDueDateReminders();
    }, 3600000); // 1 hour
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to focus on new task input
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('taskTitle').focus();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('editModal');
        if (modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    }
    
    // Ctrl/Cmd + F to focus on search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});

// Service Worker for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 