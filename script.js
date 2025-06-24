document.addEventListener('DOMContentLoaded', () => {
    const calendarDaysDiv = document.getElementById('calendarDays');
    const prevDayBtn = document.getElementById('prevDayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');
    const currentDateDisplay = document.getElementById('currentDateDisplay');

    const itemModal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('modalTitle');
    const itemForm = document.getElementById('itemForm');
    const itemDescriptionInput = document.getElementById('itemDescription');
    const itemValueInput = document.getElementById('itemValue');
    const gastoTypeSection = document.getElementById('gastoTypeSection');

    const finalizeDayBtn = document.getElementById('finalizeDayBtn');

    const salarioTotalDisplay = document.getElementById('salarioTotalDisplay');
    const totalGastosDisplay = document.getElementById('totalGastosDisplay');
    const totalInvestimentosDisplay = document.getElementById('totalInvestimentosDisplay');
    const saldoFinalDisplay = document.getElementById('saldoFinalDisplay');

    const receitasList = document.getElementById('receitasList');
    const gastosList = document.getElementById('gastosList');
    const investimentosList = document.getElementById('investimentosList');

    const welcomeFixedExpenseModal = document.getElementById('welcomeFixedExpenseModal');
    const initialFixedExpensesList = document.getElementById('initialFixedExpensesList');
    const fixedExpenseForm = document.getElementById('fixedExpenseForm');
    const fixedExpenseDescriptionInput = document.getElementById('fixedExpenseDescription');
    const fixedExpenseValueInput = document.getElementById('fixedExpenseValue');
    const finishFixedExpensesSetupBtn = document.getElementById('finishFixedExpensesSetupBtn');

    const authModal = document.getElementById('authModal');
    const authModalTitle = document.getElementById('authModalTitle');
    const authForm = document.getElementById('authForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const loggedInUsernameDisplay = document.getElementById('loggedInUsername');
    const userInfoDiv = document.querySelector('.user-info');

    let currentSelectedDate = new Date();
    currentSelectedDate.setHours(0, 0, 0, 0);
    let modalType = '';

    let currentAuthMode = 'login';
    let currentLoggedInUser = null;

    function formatDateToKey(date) {
        return date.toISOString().split('T')[0];
    }

    function formatDisplayDate(date) {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function loadDataForDate(dateKey) {
        const userPrefix = currentLoggedInUser ? `${currentLoggedInUser}_` : '';
        const data = localStorage.getItem(userPrefix + dateKey);
        return data ? JSON.parse(data) : {
            receitas: [],
            gastos: [],
            investimentos: [],
            finalizado: false,
            fixedExpensesApplied: false
        };
    }

    function saveDataForDate(dateKey, data) {
        const userPrefix = currentLoggedInUser ? `${currentLoggedInUser}_` : '';
        localStorage.setItem(userPrefix + dateKey, JSON.stringify(data));
    }

    function loadFixedExpenses() {
        const userPrefix = currentLoggedInUser ? `${currentLoggedInUser}_` : '';
        const fixedExpenses = localStorage.getItem(userPrefix + 'fixedExpenses');
        return fixedExpenses ? JSON.parse(fixedExpenses) : [];
    }

    function saveFixedExpenses(expenses) {
        const userPrefix = currentLoggedInUser ? `${currentLoggedInUser}_` : '';
        localStorage.setItem(userPrefix + 'fixedExpenses', JSON.stringify(expenses));
    }

    function applyFixedExpensesToDay(dateKey) {
        if (!currentLoggedInUser) return;
        const dayData = loadDataForDate(dateKey);
        const fixedExpenses = loadFixedExpenses();

        if (!dayData.finalizado && !dayData.fixedExpensesApplied && fixedExpenses.length > 0) {
            fixedExpenses.forEach(fixedExp => {
                const exists = dayData.gastos.some(g =>
                    g.descricao === fixedExp.descricao &&
                    g.valor === fixedExp.valor &&
                    g.tipo === 'Fixo' &&
                    g.isFixedDefault === true
                );

                if (!exists) {
                    dayData.gastos.push({
                        descricao: fixedExp.descricao,
                        valor: fixedExp.valor,
                        tipo: 'Fixo',
                        isFixedDefault: true
                    });
                }
            });
            dayData.fixedExpensesApplied = true;
            saveDataForDate(dateKey, dayData);
            console.log(`Gastos fixos aplicados para o dia: ${dateKey} para o usuário: ${currentLoggedInUser}`);
        }
    }

    function renderFixedExpensesListInModal() {
        if (!currentLoggedInUser) {
            initialFixedExpensesList.innerHTML = '<p class="no-items">Nenhum gasto fixo cadastrado para este usuário.</p>';
            return;
        }
        initialFixedExpensesList.innerHTML = '';
        const fixedExpenses = loadFixedExpenses();

        if (fixedExpenses.length === 0) {
            initialFixedExpensesList.innerHTML = '<p class="no-items">Nenhum gasto fixo cadastrado.</p>';
            return;
        }

        fixedExpenses.forEach((exp, index) => {
            const cardItem = document.createElement('div');
            cardItem.classList.add('card-item');
            cardItem.innerHTML = `
                <span>${exp.descricao} - R$ ${exp.valor.toFixed(2)}</span>
                <button class="delete-btn" data-index="${index}" data-type="fixedExpense">Excluir</button>
            `;
            cardItem.querySelector('.delete-btn').addEventListener('click', handleDeleteFixedExpense);
            initialFixedExpensesList.appendChild(cardItem);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === '/') {
            event.preventDefault();
            const confirmDelete = confirm("Você tem certeza que deseja apagar TODOS os dados salvos (localStorage), incluindo todas as contas simuladas? Esta ação não pode ser desfeita!");
            if (confirmDelete) {
                localStorage.clear();
                alert("LocalStorage apagado com sucesso! A página será recarregada.");
                location.reload();
            } else {
                alert("Operação de apagar o localStorage cancelada.");
            }
        }
    });

    function renderCalendarDays() {
        if (!currentLoggedInUser) return;
        calendarDaysDiv.innerHTML = '';
        const startDate = new Date(currentSelectedDate);
        startDate.setDate(currentSelectedDate.getDate() - 3);

        for (let i = 0; i < 7; i++) {
            const displayDate = new Date(startDate);
            displayDate.setDate(startDate.getDate() + i);
            displayDate.setHours(0, 0, 0, 0);

            const dateKey = formatDateToKey(displayDate);
            applyFixedExpensesToDay(dateKey);

            const dayData = loadDataForDate(dateKey);

            const dayBox = document.createElement('div');
            dayBox.classList.add('day-box');
            dayBox.textContent = displayDate.getDate();

            if (formatDateToKey(displayDate) === formatDateToKey(currentSelectedDate)) {
                dayBox.classList.add('selected');
            }
            if (dayData.finalizado) {
                dayBox.classList.add('finalized');
                dayBox.title = "Dia finalizado!";
            }

            dayBox.addEventListener('click', () => {
                if (formatDateToKey(displayDate) !== formatDateToKey(currentSelectedDate)) {
                    currentSelectedDate = displayDate;
                    currentSelectedDate.setHours(0, 0, 0, 0);
                    renderCalendarDays();
                    updateUIForSelectedDate();
                }
            });
            calendarDaysDiv.appendChild(dayBox);
        }
    }

    function updateUIForSelectedDate() {
        if (!currentLoggedInUser) return;
        const dateKey = formatDateToKey(currentSelectedDate);
        const dayData = loadDataForDate(dateKey);

        currentDateDisplay.textContent = formatDisplayDate(currentSelectedDate);

        renderList(receitasList, dayData.receitas, 'receita', dayData.finalizado);
        renderList(gastosList, dayData.gastos, 'gasto', dayData.finalizado);
        renderList(investimentosList, dayData.investimentos, 'investimento', dayData.finalizado);

        const totalReceitas = dayData.receitas.reduce((sum, item) => sum + item.valor, 0);
        const totalGastos = dayData.gastos.reduce((sum, item) => sum + item.valor, 0);
        const totalInvestimentos = dayData.investimentos.reduce((sum, item) => sum + item.valor, 0);
        const saldoFinal = totalReceitas - totalGastos - totalInvestimentos;

        salarioTotalDisplay.textContent = `R$ ${totalReceitas.toFixed(2)}`;
        totalGastosDisplay.textContent = `R$ ${totalGastos.toFixed(2)}`;
        totalInvestimentosDisplay.textContent = `R$ ${totalInvestimentos.toFixed(2)}`;
        saldoFinalDisplay.textContent = `R$ ${saldoFinal.toFixed(2)}`;

        const addButtons = document.querySelectorAll('.add-card-btn');
        const editFixedBtn = document.querySelector('.edit-fixed-btn');

        if (dayData.finalizado) {
            addButtons.forEach(btn => btn.disabled = true);
            finalizeDayBtn.disabled = true;
            editFixedBtn.disabled = false;
        } else {
            addButtons.forEach(btn => btn.disabled = false);
            finalizeDayBtn.disabled = false;
            editFixedBtn.disabled = false;
        }
    }

    function renderList(listElement, items, type, isFinalized) {
        listElement.innerHTML = '';

        if (items.length === 0) {
            listElement.innerHTML = `<p class="no-items">Nenhum ${type} cadastrado.</p>`;
            return;
        }

        items.forEach((item, index) => {
            const cardItem = document.createElement('div');
            cardItem.classList.add('card-item');

            let itemText = `${item.descricao} - R$ ${item.valor.toFixed(2)}`;
            if (type === 'gasto') {
                itemText += ` (${item.tipo})`;
                if (item.isFixedDefault) {
                    itemText += ' (Fixo Mensal)';
                }
            }

            cardItem.innerHTML = `
                <span>${itemText}</span>
                <button class="delete-btn" data-index="${index}" data-type="${type}">Excluir</button>
            `;

            const deleteBtn = cardItem.querySelector('.delete-btn');
            if (isFinalized || (type === 'gasto' && item.isFixedDefault)) {
                deleteBtn.disabled = true;
                deleteBtn.style.opacity = '0.5';
                deleteBtn.style.cursor = 'not-allowed';
                if (item.isFixedDefault) {
                    deleteBtn.title = "Gasto fixo automático não pode ser excluído por aqui. Use 'Editar Gastos Fixos'.";
                } else if (isFinalized) {
                    deleteBtn.title = "Dia finalizado. Itens não podem ser excluídos.";
                }
            } else {
                deleteBtn.addEventListener('click', handleDeleteItem);
            }
            listElement.appendChild(cardItem);
        });
    }

    window.openModal = (type) => {
        if (!currentLoggedInUser) {
            alert('Por favor, faça login para adicionar itens.');
            return;
        }
        const dateKey = formatDateToKey(currentSelectedDate);
        const dayData = loadDataForDate(dateKey);

        if (dayData.finalizado) {
            alert('Não é possível adicionar itens a um dia finalizado.');
            return;
        }

        modalType = type;
        modalTitle.textContent = `Adicionar ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        gastoTypeSection.style.display = (type === 'gasto') ? 'block' : 'none';
        itemForm.reset();
        itemModal.style.display = 'flex';
    };

    window.closeModal = () => {
        itemModal.style.display = 'none';
    };

    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const description = itemDescriptionInput.value.trim();
        const value = parseFloat(itemValueInput.value);

        if (!description) {
            alert('Por favor, insira uma descrição.');
            return;
        }
        if (isNaN(value) || value <= 0) {
            alert('Por favor, insira um valor numérico válido e positivo.');
            return;
        }

        const dateKey = formatDateToKey(currentSelectedDate);
        const dayData = loadDataForDate(dateKey);

        const newItem = {
            descricao: description,
            valor: value
        };

        if (modalType === 'gasto') {
            const gastoType = document.querySelector('input[name="gastoType"]:checked').value;
            newItem.tipo = gastoType;
            newItem.isFixedDefault = false;
            dayData.gastos.push(newItem);
        } else if (modalType === 'receita') {
            dayData.receitas.push(newItem);
        } else if (modalType === 'investimento') {
            dayData.investimentos.push(newItem);
        }

        saveDataForDate(dateKey, dayData);
        updateUIForSelectedDate();
        closeModal();
    });

    function handleDeleteItem(event) {
        if (!currentLoggedInUser) {
            alert('Por favor, faça login para excluir itens.');
            return;
        }
        const button = event.target;
        const index = parseInt(button.dataset.index);
        const type = button.dataset.type;

        const dateKey = formatDateToKey(currentSelectedDate);
        const dayData = loadDataForDate(dateKey);

        if (dayData.finalizado) {
            alert('Não é possível excluir itens de um dia finalizado.');
            return;
        }

        if (type === 'receita') {
            dayData.receitas.splice(index, 1);
        } else if (type === 'gasto') {
            if (dayData.gastos[index] && dayData.gastos[index].isFixedDefault) {
                alert('Este é um gasto fixo automático e não pode ser excluído por aqui. Use o botão "Editar Gastos Fixos" para alterá-lo.');
                return;
            }
            dayData.gastos.splice(index, 1);
        } else if (type === 'investimento') {
            dayData.investimentos.splice(index, 1);
        }

        saveDataForDate(dateKey, dayData);
        updateUIForSelectedDate();
    }

    prevDayBtn.addEventListener('click', () => {
        if (!currentLoggedInUser) return;
        currentSelectedDate.setDate(currentSelectedDate.getDate() - 1);
        currentSelectedDate.setHours(0, 0, 0, 0);
        renderCalendarDays();
        updateUIForSelectedDate();
    });

    nextDayBtn.addEventListener('click', () => {
        if (!currentLoggedInUser) return;
        currentSelectedDate.setDate(currentSelectedDate.getDate() + 1);
        currentSelectedDate.setHours(0, 0, 0, 0);
        renderCalendarDays();
        updateUIForSelectedDate();
    });

    finalizeDayBtn.addEventListener('click', () => {
        if (!currentLoggedInUser) {
            alert('Por favor, faça login para finalizar o dia.');
            return;
        }
        const dateKey = formatDateToKey(currentSelectedDate);
        const dayData = loadDataForDate(dateKey);

        if (dayData.finalizado) {
            alert('Este dia já foi finalizado!');
            return;
        }

        if (confirm('Tem certeza que deseja FINALIZAR este dia? Após a finalização, você NÃO poderá mais modificar as informações.')) {
            dayData.finalizado = true;
            saveDataForDate(dateKey, dayData);

            alert('Dia finalizado com sucesso! As informações foram salvas e bloqueadas.');
            renderCalendarDays();
            updateUIForSelectedDate();
        }
    });

    window.openFixedExpenseModal = () => {
        if (!currentLoggedInUser) {
            alert('Por favor, faça login para editar gastos fixos.');
            return;
        }
        renderFixedExpensesListInModal();
        fixedExpenseForm.reset();
        welcomeFixedExpenseModal.style.display = 'flex';
    };

    window.closeFixedExpenseModal = () => {
        welcomeFixedExpenseModal.style.display = 'none';
        renderCalendarDays();
        updateUIForSelectedDate();
    };

    fixedExpenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const description = fixedExpenseDescriptionInput.value.trim();
        const value = parseFloat(fixedExpenseValueInput.value);

        if (!description) {
            alert('Por favor, insira uma descrição para o gasto fixo.');
            return;
        }
        if (isNaN(value) || value <= 0) {
            alert('Por favor, insira um valor numérico válido e positivo para o gasto fixo.');
            return;
        }

        const fixedExpenses = loadFixedExpenses();
        fixedExpenses.push({
            descricao: description,
            valor: value
        });
        saveFixedExpenses(fixedExpenses);
        renderFixedExpensesListInModal();
        fixedExpenseForm.reset();
    });

    function handleDeleteFixedExpense(event) {
        if (!currentLoggedInUser) return;
        const index = parseInt(event.target.dataset.index);
        const fixedExpenses = loadFixedExpenses();
        fixedExpenses.splice(index, 1);
        saveFixedExpenses(fixedExpenses);
        renderFixedExpensesListInModal();
    }

    finishFixedExpensesSetupBtn.addEventListener('click', () => {
        if (!currentLoggedInUser) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = formatDateToKey(today);

        for (let i = 0; i < 365; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            futureDate.setHours(0, 0, 0, 0);
            const futureDateKey = formatDateToKey(futureDate);

            if (futureDateKey >= todayKey) {
                const dayData = loadDataForDate(futureDateKey);
                if (!dayData.finalizado) {
                    dayData.fixedExpensesApplied = false;
                    saveDataForDate(futureDateKey, dayData);
                }
            }
        }
        alert('Gastos fixos salvos e serão aplicados aos seus dias! Você pode editá-los a qualquer momento clicando no botão "Editar Gastos Fixos".');
        closeFixedExpenseModal();
    });

    window.openAuthModal = (mode) => {
        currentAuthMode = mode;
        if (mode === 'login') {
            authModalTitle.textContent = 'Entrar na Conta';
            authSubmitBtn.textContent = 'Entrar';
            toggleAuthMode.innerHTML = 'Não tem uma conta? <a href="#">Crie uma aqui.</a>';
        } else {
            authModalTitle.textContent = 'Criar Nova Conta';
            authSubmitBtn.textContent = 'Registrar';
            toggleAuthMode.innerHTML = 'Já tem uma conta? <a href="#">Faça login aqui.</a>';
        }
        authForm.reset();
        authModal.style.display = 'flex';
    };

    window.closeAuthModal = () => {
        authModal.style.display = 'none';
    };

    toggleAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal(currentAuthMode === 'login' ? 'register' : 'login');
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            alert('Por favor, preencha usuário e senha.');
            return;
        }

        const userAccounts = JSON.parse(localStorage.getItem('userAccounts_local_simulation') || '{}');

        if (currentAuthMode === 'register') {
            if (userAccounts[username]) {
                alert('Usuário já existe. Por favor, escolha outro nome de usuário.');
                return;
            }
            userAccounts[username] = {
                password: password
            };
            localStorage.setItem('userAccounts_local_simulation', JSON.stringify(userAccounts));
            alert('Conta criada com sucesso! Faça login.');
            openAuthModal('login');
        } else {
            if (!userAccounts[username] || userAccounts[username].password !== password) {
                alert('Usuário ou senha inválidos.');
                return;
            }
            currentLoggedInUser = username;
            localStorage.setItem('loggedInUser_local_simulation', username);

            loggedInUsernameDisplay.textContent = username;
            userInfoDiv.style.display = 'flex';

            closeAuthModal();

            const userFixedExpensesInitialized = localStorage.getItem(`${username}_fixedExpensesFirstTimeInitialized`);

            if (!userFixedExpensesInitialized) {
                localStorage.setItem(`${username}_fixedExpensesFirstTimeInitialized`, 'true');
                openFixedExpenseModal();
            } else {
                renderCalendarDays();
                updateUIForSelectedDate();
            }
            alert(`Bem-vindo(a) de volta, ${username}!`);
        }
    });

    window.logout = () => {
        if (confirm('Tem certeza que deseja sair?')) {
            localStorage.removeItem('loggedInUser_local_simulation');
            currentLoggedInUser = null;
            userInfoDiv.style.display = 'none';

            location.reload();
        }
    };

    const storedLoggedInUser = localStorage.getItem('loggedInUser_local_simulation');

    if (storedLoggedInUser) {
        currentLoggedInUser = storedLoggedInUser;
        loggedInUsernameDisplay.textContent = currentLoggedInUser;
        userInfoDiv.style.display = 'flex';

        renderCalendarDays();
        updateUIForSelectedDate();
    } else {
        userInfoDiv.style.display = 'none';
        openAuthModal('login');
    }
});