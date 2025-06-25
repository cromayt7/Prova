document.addEventListener('DOMContentLoaded', () => {
    const calendario = document.getElementById('calendarDays');
    const btnDiaAnterior = document.getElementById('prevDayBtn');
    const btnProximoDia = document.getElementById('nextDayBtn');
    const mostraDataAtual = document.getElementById('currentDateDisplay');

    const modalItem = document.getElementById('itemModal');
    const tituloModal = document.getElementById('modalTitle');
    const formularioItem = document.getElementById('itemForm');
    const inputDescricao = document.getElementById('itemDescription');
    const inputValor = document.getElementById('itemValue');
    const secaoTipoGasto = document.getElementById('gastoTypeSection');

    const btnFinalizarDia = document.getElementById('finalizeDayBtn');

    const totalReceitasDisplay = document.getElementById('salarioTotalDisplay');
    const totalGastosDisplay = document.getElementById('totalGastosDisplay');
    const totalInvestimentosDisplay = document.getElementById('totalInvestimentosDisplay');
    const saldoFinalDisplay = document.getElementById('saldoFinalDisplay');

    const listaReceitas = document.getElementById('receitasList');
    const listaGastos = document.getElementById('gastosList');
    const listaInvestimentos = document.getElementById('investimentosList');

    const modalGastosFixos = document.getElementById('welcomeFixedExpenseModal');
    const listaGastosFixos = document.getElementById('initialFixedExpensesList');
    const formularioGastoFixo = document.getElementById('fixedExpenseForm');
    const inputDescricaoGastoFixo = document.getElementById('fixedExpenseDescription');
    const inputValorGastoFixo = document.getElementById('fixedExpenseValue');
    const btnProntoGastosFixos = document.getElementById('finishFixedExpensesSetupBtn');

    let dataAtualSelecionada = new Date();
    dataAtualSelecionada.setHours(0, 0, 0, 0); 
    let tipoDoModal = ''; 

    
    function formatarDataParaChave(data) {
        return data.toISOString().split('T')[0]; 
    }

    function formatarDataParaMostrar(data) {
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    function carregarDadosDoDia(chaveData) {
        const dadosSalvos = localStorage.getItem(chaveData);
        return dadosSalvos ? JSON.parse(dadosSalvos) : {
            receitas: [],
            gastos: [],
            investimentos: [],
            finalizado: false,
            gastosFixosAplicados: false
        };
    }

    function salvarDadosDoDia(chaveData, dados) {
        localStorage.setItem(chaveData, JSON.stringify(dados));
    }

    function carregarGastosFixos() {
        const fixosSalvos = localStorage.getItem('gastosFixos');
        return fixosSalvos ? JSON.parse(fixosSalvos) : [];
    }

    function salvarGastosFixos(gastos) {
        localStorage.setItem('gastosFixos', JSON.stringify(gastos));
    }

    function aplicarGastosFixosNoDia(chaveData) {
        const dadosDoDia = carregarDadosDoDia(chaveData);
        const gastosFixos = carregarGastosFixos();

        if (!dadosDoDia.finalizado && !dadosDoDia.gastosFixosAplicados && gastosFixos.length > 0) {
            gastosFixos.forEach(gastoFixo => {
                const jaExiste = dadosDoDia.gastos.some(g =>
                    g.descricao === gastoFixo.descricao &&
                    g.valor === gastoFixo.valor &&
                    g.tipo === 'Fixo' &&
                    g.ehFixoPadrao === true
                );

                if (!jaExiste) {
                    dadosDoDia.gastos.push({
                        descricao: gastoFixo.descricao,
                        valor: gastoFixo.valor,
                        tipo: 'Fixo',
                        ehFixoPadrao: true 
                    });
                }
            });
            dadosDoDia.gastosFixosAplicados = true;
            salvarDadosDoDia(chaveData, dadosDoDia);
        }
    }

    function mostrarListaGastosFixosNoModal() {
        listaGastosFixos.innerHTML = '';
        const gastosFixos = carregarGastosFixos();

        if (gastosFixos.length === 0) {
            listaGastosFixos.innerHTML = '<p class="no-items">Nenhum gasto fixo cadastrado.</p>';
            return;
        }

        gastosFixos.forEach((gasto, index) => {
            const itemCard = document.createElement('div');
            itemCard.classList.add('card-item');
            itemCard.innerHTML = `
                <span>${gasto.descricao} - R$ ${gasto.valor.toFixed(2)}</span>
                <button class="delete-btn" data-index="${index}" data-type="gastoFixo">Excluir</button>
            `;
            itemCard.querySelector('.delete-btn').addEventListener('click', apagarGastoFixo);
            listaGastosFixos.appendChild(itemCard);
        });
    }

    
    function mostrarDiasDoCalendario() {
        calendario.innerHTML = '';
        const dataInicio = new Date(dataAtualSelecionada);
        dataInicio.setDate(dataAtualSelecionada.getDate() - 3); 

        for (let i = 0; i < 7; i++) {
            const dataParaMostrar = new Date(dataInicio);
            dataParaMostrar.setDate(dataInicio.getDate() + i);
            dataParaMostrar.setHours(0, 0, 0, 0);

            const chaveData = formatarDataParaChave(dataParaMostrar);
            aplicarGastosFixosNoDia(chaveData); 

            const dadosDoDia = carregarDadosDoDia(chaveData);

            const caixaDia = document.createElement('div');
            caixaDia.classList.add('day-box');
            caixaDia.textContent = dataParaMostrar.getDate();

            if (formatarDataParaChave(dataParaMostrar) === formatarDataParaChave(dataAtualSelecionada)) {
                caixaDia.classList.add('selected'); 
            }
            if (dadosDoDia.finalizado) {
                caixaDia.classList.add('finalized'); 
                caixaDia.title = "Dia finalizado!";
            }

            caixaDia.addEventListener('click', () => {
                if (formatarDataParaChave(dataParaMostrar) !== formatarDataParaChave(dataAtualSelecionada)) {
                    dataAtualSelecionada = dataParaMostrar;
                    dataAtualSelecionada.setHours(0, 0, 0, 0);
                    mostrarDiasDoCalendario(); 
                    atualizarTelaDoDia(); 
                }
            });
            calendario.appendChild(caixaDia);
        }
    }

    function atualizarTelaDoDia() {
        const chaveData = formatarDataParaChave(dataAtualSelecionada);
        const dadosDoDia = carregarDadosDoDia(chaveData);

        mostraDataAtual.textContent = formatarDataParaMostrar(dataAtualSelecionada);

        mostrarLista(listaReceitas, dadosDoDia.receitas, 'receita', dadosDoDia.finalizado);
        mostrarLista(listaGastos, dadosDoDia.gastos, 'gasto', dadosDoDia.finalizado);
        mostrarLista(listaInvestimentos, dadosDoDia.investimentos, 'investimento', dadosDoDia.finalizado);

        
        const totalReceitas = dadosDoDia.receitas.reduce((soma, item) => soma + item.valor, 0);
        const totalGastos = dadosDoDia.gastos.reduce((soma, item) => soma + item.valor, 0);
        const totalInvestimentos = dadosDoDia.investimentos.reduce((soma, item) => soma + item.valor, 0);
        const saldoFinal = totalReceitas - totalGastos - totalInvestimentos;

        totalReceitasDisplay.textContent = `R$ ${totalReceitas.toFixed(2)}`;
        totalGastosDisplay.textContent = `R$ ${totalGastos.toFixed(2)}`;
        totalInvestimentosDisplay.textContent = `R$ ${totalInvestimentos.toFixed(2)}`;
        saldoFinalDisplay.textContent = `R$ ${saldoFinal.toFixed(2)}`;

      
        const botoesAdicionar = document.querySelectorAll('.add-card-btn');
        const btnEditarFixos = document.querySelector('.edit-fixed-btn');

        if (dadosDoDia.finalizado) {
            botoesAdicionar.forEach(btn => btn.disabled = true);
            btnFinalizarDia.disabled = true;
            btnEditarFixos.disabled = false;
        } else {
            botoesAdicionar.forEach(btn => btn.disabled = false);
            btnFinalizarDia.disabled = false;
            btnEditarFixos.disabled = false;
        }
    }

    function mostrarLista(elementoLista, itens, tipo, estaFinalizado) {
        elementoLista.innerHTML = '';

        if (itens.length === 0) {
            elementoLista.innerHTML = `<p class="no-items">Nenhum ${tipo} aqui.</p>`;
            return;
        }

        itens.forEach((item, index) => {
            const itemCard = document.createElement('div');
            itemCard.classList.add('card-item');

            let textoItem = `${item.descricao} - R$ ${item.valor.toFixed(2)}`;
            if (tipo === 'gasto') {
                textoItem += ` (${item.tipo})`;
                if (item.ehFixoPadrao) {
                    textoItem += ' (Fixo Mensal)';
                }
            }

            itemCard.innerHTML = `
                <span>${textoItem}</span>
                <button class="delete-btn" data-index="${index}" data-type="${tipo}">Excluir</button>
            `;

            const btnExcluir = itemCard.querySelector('.delete-btn');
            if (estaFinalizado || (tipo === 'gasto' && item.ehFixoPadrao)) {
                btnExcluir.disabled = true;
                btnExcluir.style.opacity = '0.5';
                btnExcluir.style.cursor = 'not-allowed';
                if (item.ehFixoPadrao) {
                    btnExcluir.title = "Gasto fixo não pode ser excluído aqui. Use 'Gastos Fixos'.";
                } else if (estaFinalizado) {
                    btnExcluir.title = "Dia fechado. Não pode excluir.";
                }
            } else {
                btnExcluir.addEventListener('click', apagarItem);
            }
            elementoLista.appendChild(itemCard);
        });
    }

   
    window.openModal = (tipo) => {
        const chaveData = formatarDataParaChave(dataAtualSelecionada);
        const dadosDoDia = carregarDadosDoDia(chaveData);

        if (dadosDoDia.finalizado) {
            alert('Não pode adicionar coisas em um dia fechado.');
            return;
        }

        tipoDoModal = tipo;
        tituloModal.textContent = `Adicionar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
        secaoTipoGasto.style.display = (tipo === 'gasto') ? 'block' : 'none';
        formularioItem.reset(); 
        modalItem.style.display = 'flex';
    };

    window.closeModal = () => {
        modalItem.style.display = 'none';
    };

    formularioItem.addEventListener('submit', (e) => {
        e.preventDefault();
        const descricao = inputDescricao.value.trim();
        const valor = parseFloat(inputValor.value);

        if (!descricao) {
            alert('Faltou a descrição.');
            return;
        }
        if (isNaN(valor) || valor <= 0) {
            alert('Valor inválido ou menor que zero.');
            return;
        }

        const chaveData = formatarDataParaChave(dataAtualSelecionada);
        const dadosDoDia = carregarDadosDoDia(chaveData);

        const novoItem = {
            descricao: descricao,
            valor: valor
        };

        if (tipoDoModal === 'gasto') {
            const tipoGasto = document.querySelector('input[name="gastoType"]:checked').value;
            novoItem.tipo = tipoGasto;
            novoItem.ehFixoPadrao = false;
            dadosDoDia.gastos.push(novoItem);
        } else if (tipoDoModal === 'receita') {
            dadosDoDia.receitas.push(novoItem);
        } else if (tipoDoModal === 'investimento') {
            dadosDoDia.investimentos.push(novoItem);
        }

        salvarDadosDoDia(chaveData, dadosDoDia);
        atualizarTelaDoDia();
        closeModal();
    });

    function apagarItem(evento) {
        const botao = evento.target;
        const index = parseInt(botao.dataset.index);
        const tipo = botao.dataset.type;

        const chaveData = formatarDataParaChave(dataAtualSelecionada);
        const dadosDoDia = carregarDadosDoDia(chaveData);

        if (dadosDoDia.finalizado) {
            alert('Não pode excluir itens de um dia fechado.');
            return;
        }

        if (tipo === 'receita') {
            dadosDoDia.receitas.splice(index, 1);
        } else if (tipo === 'gasto') {
            if (dadosDoDia.gastos[index] && dadosDoDia.gastos[index].ehFixoPadrao) {
                alert('Este é um gasto fixo. Use o botão "Gastos Fixos" para apagar.');
                return;
            }
            dadosDoDia.gastos.splice(index, 1);
        } else if (tipo === 'investimento') {
            dadosDoDia.investimentos.splice(index, 1);
        }

        salvarDadosDoDia(chaveData, dadosDoDia);
        atualizarTelaDoDia();
    }

    // --- Eventos de Botões ---
    btnDiaAnterior.addEventListener('click', () => {
        dataAtualSelecionada.setDate(dataAtualSelecionada.getDate() - 1);
        dataAtualSelecionada.setHours(0, 0, 0, 0);
        mostrarDiasDoCalendario();
        atualizarTelaDoDia();
    });

    btnProximoDia.addEventListener('click', () => {
        dataAtualSelecionada.setDate(dataAtualSelecionada.getDate() + 1);
        dataAtualSelecionada.setHours(0, 0, 0, 0);
        mostrarDiasDoCalendario();
        atualizarTelaDoDia();
    });

    btnFinalizarDia.addEventListener('click', () => {
        const chaveData = formatarDataParaChave(dataAtualSelecionada);
        const dadosDoDia = carregarDadosDoDia(chaveData);

        if (dadosDoDia.finalizado) {
            alert('Este dia já foi fechado!');
            return;
        }

        if (confirm('Tem certeza que quer FECHAR este dia? Depois não poderá mais mudar as informações.')) {
            dadosDoDia.finalizado = true;
            salvarDadosDoDia(chaveData, dadosDoDia);

            alert('Dia fechado com sucesso!');
            mostrarDiasDoCalendario();
            atualizarTelaDoDia();
        }
    });

    window.openFixedExpenseModal = () => {
        mostrarListaGastosFixosNoModal();
        formularioGastoFixo.reset();
        modalGastosFixos.style.display = 'flex';
    };

    window.closeFixedExpenseModal = () => {
        modalGastosFixos.style.display = 'none';
        mostrarDiasDoCalendario();
        atualizarTelaDoDia();
    };

    formularioGastoFixo.addEventListener('submit', (e) => {
        e.preventDefault();
        const descricao = inputDescricaoGastoFixo.value.trim();
        const valor = parseFloat(inputValorGastoFixo.value);

        if (!descricao) {
            alert('Faltou a descrição do gasto fixo.');
            return;
        }
        if (isNaN(valor) || valor <= 0) {
            alert('Valor inválido para o gasto fixo.');
            return;
        }

        const gastosFixos = carregarGastosFixos();
        gastosFixos.push({
            descricao: descricao,
            valor: valor
        });
        salvarGastosFixos(gastosFixos);
        mostrarListaGastosFixosNoModal();
        formularioGastoFixo.reset();
    });

    function apagarGastoFixo(evento) {
        const index = parseInt(evento.target.dataset.index);
        const gastosFixos = carregarGastosFixos();
        gastosFixos.splice(index, 1);
        salvarGastosFixos(gastosFixos);
        mostrarListaGastosFixosNoModal();
    }

    btnProntoGastosFixos.addEventListener('click', () => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const chaveHoje = formatarDataParaChave(hoje);

        
        for (let i = 0; i < 365; i++) {
            const dataFutura = new Date(hoje);
            dataFutura.setDate(hoje.getDate() + i);
            dataFutura.setHours(0, 0, 0, 0);
            const chaveDataFutura = formatarDataParaChave(dataFutura);

            if (chaveDataFutura >= chaveHoje) {
                const dadosDoDia = carregarDadosDoDia(chaveDataFutura);
                if (!dadosDoDia.finalizado) {
                    dadosDoDia.gastosFixosAplicados = false; 
                    salvarDadosDoDia(chaveDataFutura, dadosDoDia);
                }
            }
        }
        alert('Gastos fixos salvos! Eles serão adicionados aos seus dias. Pode mudar eles quando quiser.');
        closeFixedExpenseModal();
    });

    
    mostrarDiasDoCalendario();
    atualizarTelaDoDia();
});
