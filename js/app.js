// My Money app

class Project {
    constructor(id, name, icon, description = '') {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.description = description;
    }
}

class Event {
    constructor(id, projectId, date, location, compensation, compensationPaid, compensationInvoiced, expenses = [], notes = '') {
        this.id = id;
        this.projectId = projectId;
        this.date = date; // Expecting a Date object
        this.location = location;
        this.compensation = compensation;
        this.compensationPaid = compensationPaid;
        this.compensationInvoiced = compensationInvoiced;
        this.expenses = expenses; // [{ amount: 100, description: 'Gas' }]
        this.notes = notes;
    }
}

class App {
    constructor() {
        this.projects = [];
        this.events = [];
        this.userType = 'individual'; // or 'business'
        this.isPrivacyMode = false;
        this.selectedEventIds = new Set();
        this.selectedProjectIds = new Set();
        this.currentScreen = 'dashboard-screen';
        this.init();
    }

    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.updateDashboard();
        this.populateProjectFilter();
        this.renderEventsList();
        this.renderProjectsList();
    }

    loadSampleData() {
        this.projects = [
            new Project(1, 'Concerti Live', '🎤', 'Esibizioni musicali dal vivo'),
            new Project(2, 'Mix & Master', '🎧', 'Servizi di mixaggio e mastering audio'),
            new Project(3, 'Tour', '🚌', 'In viaggio con le band')
        ];

        this.events = [
            new Event(1, 1, new Date('2024-05-10'), 'New York', 1500, true, true, [{ amount: 200, description: 'Viaggio' }]),
            new Event(2, 1, new Date('2024-05-15'), 'Londra', 2000, false, false, [{ amount: 300, description: 'Hotel' }]),
            new Event(3, 2, new Date('2024-05-20'), 'Online', 500, true, true),
            new Event(4, 3, new Date('2024-04-01'), 'US Tour', 10000, true, true, [{ amount: 5000, description: 'Noleggio bus' }]),
        ];
    }

    setupEventListeners() {
        document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme.bind(this));
        document.getElementById('privacy-toggle').addEventListener('click', this.togglePrivacyMode.bind(this));
        document.getElementById('project-filter').addEventListener('change', this.updateDashboard.bind(this));
        document.getElementById('period-filter').addEventListener('change', this.updateDashboard.bind(this));

        // Navigation
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', () => this.navigateTo(button.dataset.screen));
        });

        // Event list selection
        document.getElementById('events-list').addEventListener('click', this.handleEventClick.bind(this));

        // Event detail screen
        document.getElementById('new-event-btn').addEventListener('click', () => this.openEventForm());
        document.getElementById('event-form').addEventListener('submit', this.saveEvent.bind(this));
        document.getElementById('cancel-event-btn').addEventListener('click', () => this.navigateTo('events-list-screen'));
        document.getElementById('back-to-events-btn').addEventListener('click', () => this.navigateTo('events-list-screen'));
        document.getElementById('add-expense-btn').addEventListener('click', () => this.addExpenseInput());

        // Project screen
        document.getElementById('projects-list').addEventListener('click', this.handleProjectClick.bind(this));
        document.getElementById('new-project-btn').addEventListener('click', () => this.openProjectForm());
        document.getElementById('project-form').addEventListener('submit', this.saveProject.bind(this));
        document.getElementById('cancel-project-btn').addEventListener('click', () => this.navigateTo('projects-screen'));
        document.getElementById('back-to-projects-btn').addEventListener('click', () => this.navigateTo('projects-screen'));

        // Profile screen
        document.getElementById('user-type').addEventListener('change', this.handleUserTypeChange.bind(this));
    }

    navigateTo(screenId) {
        document.querySelectorAll('main').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
        this.currentScreen = screenId;

        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('active', 'text-blue-500');
            if (button.dataset.screen === screenId) {
                button.classList.add('active', 'text-blue-500');
            }
        });
    }

    toggleTheme() {
        const html = document.documentElement;
        html.classList.toggle('dark');
        const icon = document.querySelector('#theme-toggle span');
        icon.textContent = html.classList.contains('dark') ? 'light_mode' : 'dark_mode';
    }

    togglePrivacyMode() {
        this.isPrivacyMode = !this.isPrivacyMode;
        this.updateDashboard();
    }

    populateProjectFilter() {
        const projectFilter = document.getElementById('project-filter');
        projectFilter.innerHTML = '<option value="all">Tutti i Progetti</option>';
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });
    }

    getFilteredEvents() {
        const selectedProjectId = document.getElementById('project-filter').value;
        const selectedPeriod = document.getElementById('period-filter').value;
        const now = new Date();

        let filteredEvents = this.events;

        // Filter by project
        if (selectedProjectId !== 'all') {
            filteredEvents = filteredEvents.filter(event => event.projectId == selectedProjectId);
        }

        // Filter by period
        switch (selectedPeriod) {
            case 'this-month':
                filteredEvents = filteredEvents.filter(event =>
                    event.date.getMonth() === now.getMonth() && event.date.getFullYear() === now.getFullYear()
                );
                break;
            case 'last-month':
                 const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                 filteredEvents = filteredEvents.filter(event =>
                    event.date.getMonth() === lastMonth.getMonth() && event.date.getFullYear() === lastMonth.getFullYear()
                );
                break;
            case 'this-year':
                filteredEvents = filteredEvents.filter(event => event.date.getFullYear() === now.getFullYear());
                break;
        }

        return filteredEvents;
    }

    updateDashboard() {
        const totalBalanceEl = document.getElementById('total-balance');
        const totalIncomeEl = document.getElementById('total-income');
        const totalExpensesEl = document.getElementById('total-expenses');
        const incomeExpenseWrapper = document.getElementById('income-expense-wrapper');
        const privacyIcon = document.querySelector('#privacy-toggle span');
        const filteredBalanceEl = document.getElementById('filtered-balance');

        const filteredEvents = this.getFilteredEvents();

        const totalIncome = this.events.filter(e => e.compensationPaid).reduce((sum, event) => sum + event.compensation, 0);
        const totalExpenses = this.events.reduce((sum, event) => sum + event.expenses.reduce((s, exp) => s + exp.amount, 0), 0);
        const totalBalance = totalIncome - totalExpenses;

        const filteredIncome = filteredEvents.filter(e => e.compensationPaid).reduce((sum, event) => sum + event.compensation, 0);
        const filteredExpenses = filteredEvents.reduce((sum, event) => sum + event.expenses.reduce((s, exp) => s + exp.amount, 0), 0);
        const filteredBalance = filteredIncome - filteredExpenses;

        if (this.isPrivacyMode) {
            totalBalanceEl.textContent = '*****';
            incomeExpenseWrapper.classList.add('hidden');
            privacyIcon.textContent = 'visibility_off';
        } else {
            totalBalanceEl.textContent = `€${totalBalance.toFixed(2)}`;
            totalIncomeEl.textContent = `€${totalIncome.toFixed(2)}`;
            totalExpensesEl.textContent = `€${totalExpenses.toFixed(2)}`;
            incomeExpenseWrapper.classList.remove('hidden');
            privacyIcon.textContent = 'visibility';
        }

        filteredBalanceEl.textContent = `€${filteredBalance.toFixed(2)}`;

        this.renderEventsList();
    }


    handleEventClick(event) {
        const eventItem = event.target.closest('.event-item');
        if (!eventItem) return;

        if (event.detail === 1) {
            this.handleEventSelection(event);
        } else if (event.detail === 2) {
             const eventId = parseInt(eventItem.dataset.eventId);
             this.openEventForm(eventId);
        }
    }

    handleEventSelection(event) {
        const eventItem = event.target.closest('.event-item');
        if (!eventItem) return;

        const eventId = parseInt(eventItem.dataset.eventId);
        if (this.selectedEventIds.has(eventId)) {
            this.selectedEventIds.delete(eventId);
            eventItem.classList.remove('bg-blue-100', 'dark:bg-blue-900/50');
        } else {
            this.selectedEventIds.add(eventId);
            eventItem.classList.add('bg-blue-100', 'dark:bg-blue-900/50');
        }

        this.updateSelectedTotal();
    }

    updateSelectedTotal() {
        const selectedTotalEl = document.getElementById('selected-total');
        const total = Array.from(this.selectedEventIds).reduce((sum, eventId) => {
            const event = this.events.find(e => e.id === eventId);
            const eventBalance = event.compensation - event.expenses.reduce((s, exp) => s + exp.amount, 0);
            return sum + eventBalance;
        }, 0);
        selectedTotalEl.textContent = `€${total.toFixed(2)}`;
    }

    renderEventsList() {
        const eventsListEl = document.getElementById('events-list');
        eventsListEl.innerHTML = ''; // Clear existing list

        this.getFilteredEvents().forEach(event => {
            const project = this.projects.find(p => p.id === event.projectId);
            const eventBalance = event.compensation - event.expenses.reduce((s, exp) => s + exp.amount, 0);
            const isPaid = event.compensationPaid;

            const eventItem = document.createElement('div');
            eventItem.dataset.eventId = event.id;
            eventItem.className = `event-item p-4 rounded-lg shadow-md cursor-pointer border-l-4 ${isPaid ? 'border-green-500' : 'border-red-500'} bg-white dark:bg-gray-800`;

            eventItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${event.date.toLocaleDateString('it-IT')}</p>
                        <p class="font-bold">${project.icon} ${project.name}</p>
                    </div>
                    <div class.text-right">
                        <p class="text-lg font-semibold ${eventBalance >= 0 ? 'text-green-500' : 'text-red-500'}">€${eventBalance.toFixed(2)}</p>
                        <p class="text-xs ${isPaid ? 'text-green-600' : 'text-red-600'}">${isPaid ? 'Pagato' : 'Non Pagato'}</p>
                    </div>
                </div>
            `;
            eventsListEl.appendChild(eventItem);
        });
    }

    openEventForm(eventId = null) {
        const form = document.getElementById('event-form');
        form.reset();
        document.getElementById('expenses-list').innerHTML = '';

        const projectSelect = document.getElementById('event-project');
        projectSelect.innerHTML = '';
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });

        if (eventId) {
            document.getElementById('event-form-title').textContent = 'Modifica Evento';
            const event = this.events.find(e => e.id === eventId);
            document.getElementById('event-id').value = event.id;
            projectSelect.value = event.projectId;
            document.getElementById('event-date').value = event.date.toISOString().split('T')[0];
            document.getElementById('event-location').value = event.location;
            document.getElementById('event-compensation').value = event.compensation;
            document.getElementById('event-paid').checked = event.compensationPaid;
            document.getElementById('event-invoiced').checked = event.compensationInvoiced;
            document.getElementById('event-notes').value = event.notes;
            event.expenses.forEach(expense => this.addExpenseInput(expense));
        } else {
            document.getElementById('event-form-title').textContent = 'Nuovo Evento';
            document.getElementById('event-id').value = '';
            this.addExpenseInput();
        }

        this.navigateTo('event-detail-screen');
    }

    addExpenseInput(expense = { description: '', amount: '' }) {
        const expensesList = document.getElementById('expenses-list');
        const expenseItem = document.createElement('div');
        expenseItem.className = 'flex items-center space-x-2';
        expenseItem.innerHTML = `
            <input type="text" value="${expense.description}" class="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Descrizione">
            <input type="number" value="${expense.amount}" class="w-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="0.00">
            <button type="button" class="text-red-500 remove-expense-btn">&times;</button>
        `;
        expensesList.appendChild(expenseItem);

        expenseItem.querySelector('.remove-expense-btn').addEventListener('click', () => {
            expenseItem.remove();
        });
    }

    saveEvent(e) {
        e.preventDefault();
        const eventId = document.getElementById('event-id').value;
        const expenses = [];
        document.querySelectorAll('#expenses-list .flex').forEach(item => {
            const description = item.querySelector('input[type="text"]').value;
            const amount = parseFloat(item.querySelector('input[type="number"]').value);
            if (description && !isNaN(amount)) {
                expenses.push({ description, amount });
            }
        });

        const eventData = {
            id: eventId ? parseInt(eventId) : new Date().getTime(),
            projectId: parseInt(document.getElementById('event-project').value),
            date: new Date(document.getElementById('event-date').value + 'T00:00:00'),
            location: document.getElementById('event-location').value,
            compensation: parseFloat(document.getElementById('event-compensation').value),
            compensationPaid: document.getElementById('event-paid').checked,
            compensationInvoiced: document.getElementById('event-invoiced').checked,
            expenses: expenses,
            notes: document.getElementById('event-notes').value
        };

        if (eventId) {
            const index = this.events.findIndex(e => e.id === eventData.id);
            this.events[index] = new Event(eventData.id, eventData.projectId, eventData.date, eventData.location, eventData.compensation, eventData.compensationPaid, eventData.compensationInvoiced, eventData.expenses, eventData.notes);
        } else {
            this.events.push(new Event(eventData.id, eventData.projectId, eventData.date, eventData.location, eventData.compensation, eventData.compensationPaid, eventData.compensationInvoiced, eventData.expenses, eventData.notes));
        }

        // Reset filters to ensure the new/edited event is visible
        document.getElementById('project-filter').value = 'all';
        document.getElementById('period-filter').value = 'all';

        this.updateDashboard();
        this.navigateTo('events-list-screen');
    }

    renderProjectsList() {
        const projectsListEl = document.getElementById('projects-list');
        projectsListEl.innerHTML = '';

        this.projects.forEach(project => {
            const projectEvents = this.events.filter(e => e.projectId === project.id);
            const income = projectEvents.filter(e => e.compensationPaid).reduce((sum, e) => sum + e.compensation, 0);
            const expenses = projectEvents.reduce((sum, e) => sum + e.expenses.reduce((s, exp) => s + exp.amount, 0), 0);
            const balance = income - expenses;

            const projectItem = document.createElement('div');
            projectItem.dataset.projectId = project.id;
            projectItem.className = 'project-item p-4 rounded-lg shadow-md cursor-pointer bg-white dark:bg-gray-800';

            projectItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-xl font-bold">${project.icon} ${project.name}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${project.description}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-semibold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}">€${balance.toFixed(2)}</p>
                        <span class="text-xs text-gray-500">Saldo</span>
                    </div>
                </div>
            `;
            projectsListEl.appendChild(projectItem);
        });
    }

    handleProjectClick(event) {
        const projectItem = event.target.closest('.project-item');
        if (!projectItem) return;

        if (event.detail === 2) {
            const projectId = parseInt(projectItem.dataset.projectId);
            this.openProjectForm(projectId);
        } else {
            const projectId = parseInt(projectItem.dataset.projectId);
            if (this.selectedProjectIds.has(projectId)) {
                this.selectedProjectIds.delete(projectId);
                projectItem.classList.remove('bg-blue-100', 'dark:bg-blue-900/50');
            } else {
                this.selectedProjectIds.add(projectId);
                projectItem.classList.add('bg-blue-100', 'dark:bg-blue-900/50');
            }
            this.updateSelectedProjectsTotal();
        }
    }

    updateSelectedProjectsTotal() {
        const selectedTotalEl = document.getElementById('selected-projects-total');
        const total = Array.from(this.selectedProjectIds).reduce((sum, projectId) => {
             const projectEvents = this.events.filter(e => e.projectId === projectId);
             const income = projectEvents.filter(e => e.compensationPaid).reduce((s, e) => s + e.compensation, 0);
             const expenses = projectEvents.reduce((s, e) => s + e.expenses.reduce((expSum, exp) => expSum + exp.amount, 0), 0);
             return sum + (income - expenses);
        }, 0);
        selectedTotalEl.textContent = `€${total.toFixed(2)}`;
    }

    openProjectForm(projectId = null) {
        const form = document.getElementById('project-form');
        form.reset();

        if (projectId) {
            document.getElementById('project-form-title').textContent = 'Modifica Progetto';
            const project = this.projects.find(p => p.id === projectId);
            document.getElementById('project-id').value = project.id;
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-icon').value = project.icon;
            document.getElementById('project-description').value = project.description;
        } else {
            document.getElementById('project-form-title').textContent = 'Nuovo Progetto';
            document.getElementById('project-id').value = '';
        }

        this.navigateTo('project-detail-screen');
    }

    saveProject(e) {
        e.preventDefault();
        const projectId = document.getElementById('project-id').value;
        const projectData = {
            id: projectId ? parseInt(projectId) : new Date().getTime(),
            name: document.getElementById('project-name').value,
            icon: document.getElementById('project-icon').value,
            description: document.getElementById('project-description').value,
        };

        if (projectId) {
            const index = this.projects.findIndex(p => p.id === projectData.id);
            this.projects[index] = new Project(...Object.values(projectData));
        } else {
            this.projects.push(new Project(...Object.values(projectData)));
        }

        this.renderProjectsList();
        this.populateProjectFilter();
        this.updateDashboard();
        this.navigateTo('projects-screen');
    }

    handleUserTypeChange(event) {
        this.userType = event.target.value;
        console.log(`Tipo utente cambiato in: ${this.userType}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
