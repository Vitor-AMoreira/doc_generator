// js/ui.js
import { MEDICOS, CAMPOS_DINAMICOS_POR_SERVICO, FORM_ELEMENT_IDS } from './config.js';

const DOMElements = {
    selectMedico: document.getElementById(FORM_ELEMENT_IDS.selectMedico),
    selectServicoTipo: document.getElementById(FORM_ELEMENT_IDS.selectServicoTipo),
    containerCamposPersonalizados: document.getElementById(FORM_ELEMENT_IDS.containerCamposPersonalizados),
    statusMessages: document.getElementById(FORM_ELEMENT_IDS.statusMessages),
    outputLink: document.getElementById(FORM_ELEMENT_IDS.outputLink)
};

export function popularDropdownMedicos() {
    if (!DOMElements.selectMedico) return;
    DOMElements.selectMedico.innerHTML = '<option value="">Selecione um médico...</option>';
    MEDICOS.forEach(medico => {
        const option = document.createElement('option');
        option.value = medico.id; 
        option.textContent = medico.name;
        DOMElements.selectMedico.appendChild(option);
    });
}

export function carregarMedicoSelecionado(chaveStorage) {
    if (!DOMElements.selectMedico) return;
    const idSalvo = localStorage.getItem(chaveStorage);
    if (idSalvo) DOMElements.selectMedico.value = idSalvo;
}

export function salvarMedicoSelecionado(chaveStorage) {
    if (!DOMElements.selectMedico) return;
    localStorage.setItem(chaveStorage, DOMElements.selectMedico.value);
}

export function atualizarCamposPersonalizados() {
    if (!DOMElements.selectServicoTipo || !DOMElements.containerCamposPersonalizados) return;
    const tipoServicoSelecionado = DOMElements.selectServicoTipo.value;
    DOMElements.containerCamposPersonalizados.innerHTML = ''; 

    const camposParaServico = CAMPOS_DINAMICOS_POR_SERVICO[tipoServicoSelecionado];

    if (camposParaServico && camposParaServico.length > 0) {
        camposParaServico.forEach(campoConfig => {
            const divCampo = document.createElement('div');
            divCampo.className = 'form-group span-full'; 

            const label = document.createElement('label');
            label.setAttribute('for', campoConfig.id);
            label.textContent = campoConfig.label;
            divCampo.appendChild(label);

            let inputElement;
            if (campoConfig.tipo === "textarea") {
                inputElement = document.createElement('textarea');
                inputElement.rows = 3;
            } else if (campoConfig.tipo === "select") {
                inputElement = document.createElement('select');
                const defaultOption = document.createElement('option');
                defaultOption.value = "";
                let defaultText = "Selecione uma opção...";
                if (campoConfig.label.toLowerCase().includes("cirurgião")) {
                    defaultText = "Selecione o cirurgião...";
                } else if (campoConfig.label.toLowerCase().includes("cirurgia proposta")) {
                    defaultText = "Selecione a cirurgia...";
                }
                defaultOption.textContent = defaultText;
                inputElement.appendChild(defaultOption);

                const opcoes = campoConfig.opcoes_dropdown; 
                if (opcoes && opcoes.length > 0) {
                    opcoes.forEach(opcao => {
                        const optionEl = document.createElement('option');
                        optionEl.value = opcao.id; 
                        optionEl.textContent = opcao.name; 
                        inputElement.appendChild(optionEl);
                    });
                }
            } else { 
                inputElement = document.createElement('input');
                inputElement.type = campoConfig.tipo;
            }
            inputElement.id = campoConfig.id;
            inputElement.name = campoConfig.id; 
            
            divCampo.appendChild(inputElement);
            DOMElements.containerCamposPersonalizados.appendChild(divCampo);
        });
    }
}


export function coletarDadosDoFormulario() {
    const dados = {
        medico: {},
        paciente: {},
        servico: {},
        campos_dinamicos: {} 
    };

    const idMedicoSelecionado = DOMElements.selectMedico?.value;
    const medicoSelecionadoObj = MEDICOS.find(m => m.id.toString() === idMedicoSelecionado);
    dados.medico = medicoSelecionadoObj ? { ...medicoSelecionadoObj } : { name: "", crm: "", cpf: "" };

    dados.paciente.prontuario = document.getElementById(FORM_ELEMENT_IDS.pacProntuario)?.value || "";
    dados.paciente.nome_social = document.getElementById(FORM_ELEMENT_IDS.pacNomeSocial)?.value || "";
    dados.paciente.sexo = document.getElementById(FORM_ELEMENT_IDS.pacSexo)?.value || "";
    dados.paciente.nome_mae = document.getElementById(FORM_ELEMENT_IDS.pacNomeMae)?.value || "";
    dados.paciente.data_nascimento = document.getElementById(FORM_ELEMENT_IDS.pacDataNascimento)?.value || "";
    dados.paciente.cartao_sus = document.getElementById(FORM_ELEMENT_IDS.pacCartaoSUS)?.value || "";
    
    dados.servico.tipo = DOMElements.selectServicoTipo?.value || "";

    const tipoServicoSelecionado = dados.servico.tipo;
    const camposParaServico = CAMPOS_DINAMICOS_POR_SERVICO[tipoServicoSelecionado];
    if (camposParaServico && camposParaServico.length > 0) {
        camposParaServico.forEach(campoConfig => {
            const inputElement = document.getElementById(campoConfig.id);
            if (inputElement) {
                if (inputElement.tagName === 'SELECT' && campoConfig.label.toLowerCase().includes("cirurgia proposta")) {
                    // Para "Cirurgia Proposta", enviar o TEXTO da opção selecionada
                    dados.campos_dinamicos[campoConfig.id] = inputElement.options[inputElement.selectedIndex]?.text || "";
                } else {
                    // Para outros selects (como cirurgião), enviar o VALOR (ID)
                    // Para inputs e textareas, enviar o valor
                    dados.campos_dinamicos[campoConfig.id] = inputElement.value;
                }
            }
        });
    }
    return dados;
}

export function exibirMensagemStatus(mensagem, tipo = 'info') {
    if (!DOMElements.statusMessages) return;
    const p = document.createElement('p');
    p.textContent = mensagem;
    p.className = `status-${tipo}`; 
    DOMElements.statusMessages.innerHTML = ''; 
    DOMElements.statusMessages.appendChild(p);
}

export function exibirLinkDocumento(texto, link) {
    if (!DOMElements.outputLink) return;
    if (link) {
        const p = document.createElement('p');
        p.innerHTML = `${texto}: <a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>`;
        DOMElements.outputLink.appendChild(p);
    } else {
        const p = document.createElement('p');
        p.textContent = texto;
        DOMElements.outputLink.appendChild(p);
    }
}

export function limparResultado() {
    if (DOMElements.outputLink) DOMElements.outputLink.innerHTML = "";
    if (DOMElements.statusMessages) DOMElements.statusMessages.innerHTML = "<p>Preencha o formulário e clique em gerar.</p>";
}
