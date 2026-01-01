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
        this.expenses = expenses; // [{ amount: 100, description: 'Gas', pagata: false }]
        this.notes = notes;
    }
}

class App {
    constructor() {
        this.projects = [];
        this.events = [];
        this.userType = 'individual'; // or 'business'
        this.isPrivacyMode = true;
        this.selectedEventIds = new Set();
        this.selectedProjectIds = new Set();
        this.projectFilterIds = new Set();
        this.currentScreen = 'dashboard-screen';
        this.init();
    }

    saveData() {
        const data = {
            projects: this.projects,
            events: this.events.map(event => ({
                ...event,
                date: event.date.toISOString(),
            })),
            userType: this.userType,
            isPrivacyMode: this.isPrivacyMode,
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            projectFilterIds: Array.from(this.projectFilterIds)
        };
        localStorage.setItem('myMoneyData', JSON.stringify(data));
    }

    loadData() {
        const dataString = localStorage.getItem('myMoneyData');
        if (dataString) {
            const data = JSON.parse(dataString);
            this.projects = data.projects.map(p => new Project(p.id, p.name, p.icon, p.description));
            this.events = data.events.map(e => {
                const expenses = (e.expenses || []).map(exp => ({
                    ...exp,
                    pagata: exp.pagata || false
                }));
                return new Event(
                    e.id, e.projectId, new Date(e.date), e.location, e.compensation,
                    e.compensationPaid, e.compensationInvoiced, expenses, e.notes
                );
            });
            this.userType = data.userType || 'individual';
            this.isPrivacyMode = typeof data.isPrivacyMode === 'boolean' ? data.isPrivacyMode : true;
            this.projectFilterIds = new Set(data.projectFilterIds || []);

            if (data.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            const icon = document.querySelector('#theme-toggle span');
            icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';

            return true;
        }
        return false;
    }

    init() {
        if (!this.loadData()) {
            this.loadSampleData();
        }
        this.setupEventListeners();
        this.renderProjectFilterCheckboxes();
        this.updateDashboard();
        this.renderEventsList();
        this.renderProjectsList();
        document.getElementById('user-type').value = this.userType;
    }

    loadSampleData() {
        this.projects = [
            new Project(1, 'Concerti Live', '🎤', 'Esibizioni musicali dal vivo'),
            new Project(2, 'Mix & Master', '🎧', 'Servizi di mixaggio e mastering audio'),
            new Project(3, 'Tour', '🚌', 'In viaggio con le band')
        ];

        this.events = [
            new Event(1, 1, new Date('2024-05-10'), 'New York', 1500, true, true, [{ amount: 200, description: 'Viaggio', pagata: true }]),
            new Event(2, 1, new Date('2024-05-15'), 'Londra', 2000, false, false, [{ amount: 300, description: 'Hotel', pagata: false }]),
            new Event(3, 2, new Date('2024-05-20'), 'Online', 500, true, true, []),
            new Event(4, 3, new Date('2024-04-01'), 'US Tour', 10000, true, true, [{ amount: 5000, description: 'Noleggio bus', pagata: true }]),
        ];
    }

    setupEventListeners() {
        document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme.bind(this));
        document.getElementById('privacy-toggle').addEventListener('click', this.togglePrivacyMode.bind(this));
        document.getElementById('period-filter').addEventListener('change', this.updateDashboard.bind(this));

        // Project Filter Checkboxes (delegated)
        document.getElementById('project-filter-container').addEventListener('change', this.handleProjectFilterChange.bind(this));
        document.getElementById('events-project-filter-container').addEventListener('change', this.handleProjectFilterChange.bind(this));

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

        // Dashboard links
        document.getElementById('dashboard-screen').addEventListener('click', this.handleDashboardLink.bind(this));

        // Profile screen
        document.getElementById('user-type').addEventListener('change', this.handleUserTypeChange.bind(this));
    }

    handleDashboardLink(event) {
        const link = event.target.closest('.dashboard-link');
        if (link && link.dataset.eventId) {
            const eventId = parseInt(link.dataset.eventId);
            this.openEventForm(eventId);
        }
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
        this.saveData();
    }

    togglePrivacyMode() {
        this.isPrivacyMode = !this.isPrivacyMode;
        this.updateDashboard();
        this.saveData();
    }

    renderProjectFilterCheckboxes() {
        const containers = [
            document.getElementById('project-filter-container'),
            document.getElementById('events-project-filter-container')
        ];

        containers.forEach(container => {
            if (!container) return;
            container.innerHTML = ''; // Clear existing content

            this.projects.forEach(project => {
                const label = document.createElement('label');
                label.className = 'flex items-center space-x-2 text-sm';
                const isChecked = this.projectFilterIds.has(project.id);

                label.innerHTML = `
                    <input type="checkbox"
                           class="project-filter-checkbox h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                           data-project-id="${project.id}"
                           ${isChecked ? 'checked' : ''}>
                    <span>${project.icon} ${project.name}</span>
                `;
                container.appendChild(label);
            });
        });
    }

    getFilteredEvents() {
        const selectedPeriod = document.getElementById('period-filter').value;
        const now = new Date();

        // If no project is selected, return no events.
        if (this.projectFilterIds.size === 0) {
            return [];
        }

        let filteredEvents = this.events.filter(event => this.projectFilterIds.has(event.projectId));

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
        const totalExpenses = this.events.reduce((sum, event) => sum + event.expenses.filter(ex => ex.pagata).reduce((s, exp) => s + exp.amount, 0), 0);
        const totalBalance = totalIncome - totalExpenses;

        const filteredIncome = filteredEvents.filter(e => e.compensationPaid).reduce((sum, event) => sum + event.compensation, 0);
        const filteredExpenses = filteredEvents.reduce((sum, event) => sum + event.expenses.filter(ex => ex.pagata).reduce((s, exp) => s + exp.amount, 0), 0);
        const filteredBalance = filteredIncome - filteredExpenses;

        if (this.isPrivacyMode) {
            totalBalanceEl.textContent = '*****';
            filteredBalanceEl.textContent = '*****';
            incomeExpenseWrapper.classList.add('hidden');
            privacyIcon.textContent = 'visibility_off';
        } else {
            totalBalanceEl.textContent = `€${totalBalance.toFixed(2)}`;
            filteredBalanceEl.textContent = `€${filteredBalance.toFixed(2)}`;
            totalIncomeEl.textContent = `€${totalIncome.toFixed(2)}`;
            totalExpensesEl.textContent = `€${totalExpenses.toFixed(2)}`;
            incomeExpenseWrapper.classList.remove('hidden');
            privacyIcon.textContent = 'visibility';
        }

        this.renderUnpaidExpenses();
        this.renderUnpaidEvents();
        this.renderEventsList();
    }

    renderUnpaidEvents() {
        const unpaidListEl = document.getElementById('unpaid-events-list');
        unpaidListEl.innerHTML = '';

        const unpaidEvents = this.events.filter(event => !event.compensationPaid);

        if (unpaidEvents.length === 0) {
            unpaidListEl.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400">Nessun evento da pagare.</p>`;
            return;
        }

        unpaidEvents.forEach(event => {
            const project = this.projects.find(p => p.id === event.projectId);
            const eventEl = document.createElement('div');
            eventEl.className = 'dashboard-link cursor-pointer bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex justify-between items-center';
            eventEl.dataset.eventId = event.id;
            eventEl.innerHTML = `
                <div>
                    <p class="font-semibold">${project.icon} ${project.name} - ${event.location}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${event.date.toLocaleDateString('it-IT')}</p>
                </div>
                <div class="text-orange-500 font-bold">€${event.compensation.toFixed(2)}</div>
            `;
            unpaidListEl.appendChild(eventEl);
        });
    }

    renderUnpaidExpenses() {
        const unpaidListEl = document.getElementById('unpaid-expenses-list');
        unpaidListEl.innerHTML = '';

        const unpaidExpenses = [];
        this.events.forEach(event => {
            event.expenses.forEach(expense => {
                if (!expense.pagata) {
                    unpaidExpenses.push({ ...expense, event });
                }
            });
        });

        if (unpaidExpenses.length === 0) {
            unpaidListEl.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400">Nessuna spesa da pagare.</p>`;
            return;
        }

        unpaidExpenses.forEach(item => {
            const project = this.projects.find(p => p.id === item.event.projectId);
            const expenseEl = document.createElement('div');
            expenseEl.className = 'dashboard-link cursor-pointer bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex justify-between items-center';
            expenseEl.dataset.eventId = item.event.id;
            expenseEl.innerHTML = `
                <div>
                    <p class="font-semibold">${item.description}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${project.icon} ${project.name} - ${item.event.location} - ${item.event.date.toLocaleDateString('it-IT')}</p>
                </div>
                <div class="text-red-500 font-bold">€${item.amount.toFixed(2)}</div>
            `;
            unpaidListEl.appendChild(expenseEl);
        });
    }


    handleEventClick(event) {
        const editButton = event.target.closest('.edit-event-btn');
        const deleteButton = event.target.closest('.delete-event-btn');
        const selectCheckbox = event.target.closest('.event-select-checkbox');

        if (editButton) {
            const eventId = parseInt(editButton.dataset.eventId);
            this.openEventForm(eventId);
            return;
        }

        if (deleteButton) {
            const eventId = parseInt(deleteButton.dataset.eventId);
            this.deleteEvent(eventId);
            return;
        }

        if (selectCheckbox) {
            const eventId = parseInt(selectCheckbox.dataset.eventId);
            if (selectCheckbox.checked) {
                this.selectedEventIds.add(eventId);
            } else {
                this.selectedEventIds.delete(eventId);
            }
            this.updateSelectedTotal();
            this.renderEventsList(); // Rerender to show selection style
        }
    }

    updateSelectedTotal() {
        const selectedTotalEl = document.getElementById('selected-total');
        const total = Array.from(this.selectedEventIds).reduce((sum, eventId) => {
            const event = this.events.find(e => e.id === eventId);
            const eventExpenses = event.expenses.filter(e => e.pagata).reduce((s, exp) => s + exp.amount, 0);
            const eventBalance = event.compensation - eventExpenses;
            return sum + eventBalance;
        }, 0);
        selectedTotalEl.textContent = `€${total.toFixed(2)}`;
    }

    renderEventsList() {
        const eventsListEl = document.getElementById('events-list');
        eventsListEl.innerHTML = ''; // Clear existing list

        this.getFilteredEvents().forEach(event => {
            const project = this.projects.find(p => p.id === event.projectId);
            const eventExpenses = event.expenses.filter(e => e.pagata).reduce((s, exp) => s + exp.amount, 0);
            const eventBalance = event.compensation - eventExpenses;
            const isPaid = event.compensationPaid;

            const eventItem = document.createElement('div');
            eventItem.dataset.eventId = event.id;
            const isSelected = this.selectedEventIds.has(event.id);
            eventItem.className = `event-item p-4 rounded-lg shadow-md border-l-4 ${isPaid ? 'border-green-500' : 'border-red-500'} ${isSelected ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-white dark:bg-gray-800'}`;

            eventItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${event.date.toLocaleDateString('it-IT')}</p>
                        <p class="font-bold">${project.icon} ${project.name} - ${event.location}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-semibold ${eventBalance >= 0 ? 'text-green-500' : 'text-red-500'}">€${eventBalance.toFixed(2)}</p>
                        <p class="text-xs ${isPaid ? 'text-green-600' : 'text-red-600'}">${isPaid ? 'Pagato' : 'Non Pagato'}</p>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" class="event-select-checkbox h-5 w-5 rounded" data-event-id="${event.id}" ${isSelected ? 'checked' : ''}>
                            <span class="text-sm">Seleziona</span>
                        </label>
                    </div>
                    <div class="space-x-2">
                        <button class="edit-event-btn text-sm py-1 px-3 rounded bg-blue-500 text-white" data-event-id="${event.id}">Modifica</button>
                        <button class="delete-event-btn text-sm py-1 px-3 rounded bg-red-500 text-white" data-event-id="${event.id}">Elimina</button>
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

    addExpenseInput(expense = { description: '', amount: '', pagata: false }) {
        const expensesList = document.getElementById('expenses-list');
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center';
        expenseItem.innerHTML = `
            <input type="text" value="${expense.description}" class="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Descrizione">
            <input type="number" value="${expense.amount}" class="w-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="0.00">
            <label class="flex items-center space-x-1 text-sm">
                <input type="checkbox" class="h-4 w-4 rounded" ${expense.pagata ? 'checked' : ''}>
                <span>Pagata</span>
            </label>
            <button type="button" class="text-red-500 remove-expense-btn text-xl font-bold">&times;</button>
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
        document.querySelectorAll('#expenses-list .expense-item').forEach(item => {
            const description = item.querySelector('input[type="text"]').value;
            const amount = parseFloat(item.querySelector('input[type="number"]').value);
            const pagata = item.querySelector('input[type="checkbox"]').checked;
            if (description && !isNaN(amount)) {
                expenses.push({ description, amount, pagata });
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
        document.getElementById('period-filter').value = 'all';
        this.projectFilterIds.clear();

        this.saveData();
        this.updateDashboard();
        this.navigateTo('events-list-screen');
    }

    deleteEvent(eventId) {
        if (confirm('Sei sicuro di voler eliminare questo evento?')) {
            this.events = this.events.filter(event => event.id !== eventId);
            this.saveData();
            this.updateDashboard();
        }
    }

    renderProjectsList() {
        const projectsListEl = document.getElementById('projects-list');
        projectsListEl.innerHTML = '';

        this.projects.forEach(project => {
            const projectEvents = this.events.filter(e => e.projectId === project.id);
            const income = projectEvents.filter(e => e.compensationPaid).reduce((sum, e) => sum + e.compensation, 0);
            const expenses = projectEvents.reduce((sum, e) => sum + e.expenses.filter(ex => ex.pagata).reduce((s, exp) => s + exp.amount, 0), 0);
            const balance = income - expenses;
            const isSelected = this.selectedProjectIds.has(project.id);

            const projectItem = document.createElement('div');
            projectItem.dataset.projectId = project.id;
            projectItem.className = `project-item p-4 rounded-lg shadow-md ${isSelected ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-white dark:bg-gray-800'}`;

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
                 <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" class="project-select-checkbox h-5 w-5 rounded" data-project-id="${project.id}" ${isSelected ? 'checked' : ''}>
                            <span class="text-sm">Seleziona</span>
                        </label>
                    </div>
                    <div class="space-x-2">
                        <button class="edit-project-btn text-sm py-1 px-3 rounded bg-blue-500 text-white" data-project-id="${project.id}">Modifica</button>
                        <button class="delete-project-btn text-sm py-1 px-3 rounded bg-red-500 text-white" data-project-id="${project.id}">Elimina</button>
                    </div>
                </div>
            `;
            projectsListEl.appendChild(projectItem);
        });
    }

    deleteProject(projectId) {
        const projectName = this.projects.find(p => p.id === projectId)?.name || 'questo progetto';
        const associatedEvents = this.events.filter(e => e.projectId === projectId);

        let confirmationMessage = `Sei sicuro di voler eliminare "${projectName}"?`;
        if (associatedEvents.length > 0) {
            confirmationMessage += ` Verranno eliminati anche ${associatedEvents.length} eventi associati.`;
        }

        if (confirm(confirmationMessage)) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.events = this.events.filter(e => e.projectId !== projectId);
            this.selectedProjectIds.delete(projectId);

            this.saveData();
            this.renderProjectsList();
            this.renderProjectFilterCheckboxes();
            this.updateDashboard();
        }
    }

    handleProjectClick(event) {
        const editButton = event.target.closest('.edit-project-btn');
        const deleteButton = event.target.closest('.delete-project-btn');
        const selectCheckbox = event.target.closest('.project-select-checkbox');

        if (editButton) {
            const projectId = parseInt(editButton.dataset.projectId);
            this.openProjectForm(projectId);
            return;
        }

        if (deleteButton) {
            const projectId = parseInt(deleteButton.dataset.projectId);
            this.deleteProject(projectId);
            return;
        }

        if (selectCheckbox) {
            const projectId = parseInt(selectCheckbox.dataset.projectId);
            if (selectCheckbox.checked) {
                this.selectedProjectIds.add(projectId);
            } else {
                this.selectedProjectIds.delete(projectId);
            }
            this.updateSelectedProjectsTotal();
            this.renderProjectsList(); // Rerender to show selection style
        }
    }

    updateSelectedProjectsTotal() {
        const selectedTotalEl = document.getElementById('selected-projects-total');
        const total = Array.from(this.selectedProjectIds).reduce((sum, projectId) => {
             const projectEvents = this.events.filter(e => e.projectId === projectId);
             const income = projectEvents.filter(e => e.compensationPaid).reduce((s, e) => s + e.compensation, 0);
             const expenses = projectEvents.reduce((s, e) => s + e.expenses.filter(ex => ex.pagata).reduce((expSum, exp) => expSum + exp.amount, 0), 0);
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

        this.saveData();
        this.renderProjectsList();
        this.renderProjectFilterCheckboxes();
        this.updateDashboard();
        this.navigateTo('projects-screen');
    }

    handleProjectFilterChange(event) {
        if (event.target.classList.contains('project-filter-checkbox')) {
            const projectId = parseInt(event.target.dataset.projectId);
            if (event.target.checked) {
                this.projectFilterIds.add(projectId);
            } else {
                this.projectFilterIds.delete(projectId);
            }
            this.saveData();
            this.renderProjectFilterCheckboxes(); // Keep both filter sections in sync
            this.updateDashboard();
        }
    }

    handleUserTypeChange(event) {
        this.userType = event.target.value;
        this.saveData();
        console.log(`Tipo utente cambiato in: ${this.userType}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
