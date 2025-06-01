// js/ui.js
import {
    MEDICOS,
    CAMPOS_DINAMICOS_POR_SERVICO,
    FORM_ELEMENT_IDS,
    OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA,
    OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO,
    CIRURGIOES_AUXILIARES,
    CID_CSV_PATH,
    CIDS_PER_PAGE
} from './config.js';

let cidDataGlobal = []; 
let currentCIDPage = 1; 
let currentCIDSearchTerm = ""; 

const DOMElements = {
    selectMedico: document.getElementById(FORM_ELEMENT_IDS.selectMedico),
    selectServicoTipo: document.getElementById(FORM_ELEMENT_IDS.selectServicoTipo),
    containerCamposPersonalizados: document.getElementById(FORM_ELEMENT_IDS.containerCamposPersonalizados),
    statusMessages: document.getElementById(FORM_ELEMENT_IDS.statusMessages),
    outputLink: document.getElementById(FORM_ELEMENT_IDS.outputLink)
};

export async function carregarDadosCID() {
    try {
        const response = await fetch(CID_CSV_PATH);
        if (!response.ok) {
            console.error(`Erro ao buscar o arquivo CID: ${response.statusText}`);
            exibirMensagemStatus(`Falha ao carregar dados de CID.`, 'erro');
            return;
        }
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        cidDataGlobal = lines.slice(1).map(line => {
            const parts = line.split(';');
            if (parts.length >= 2) {
                return { code: parts[0].trim(), description: parts[1].trim() };
            }
            return null;
        }).filter(cid => cid !== null && cid.code && cid.description);

        console.log("Dados de CID carregados:", cidDataGlobal.length);
        if (cidDataGlobal.length === 0 && lines.length > 1) {
             exibirMensagemStatus(`Dados de CID parecem vazios ou malformatados.`, 'aviso');
        }
    } catch (error) {
        console.error("Erro ao carregar ou processar o arquivo CID:", error);
        exibirMensagemStatus(`Erro crítico ao carregar dados de CID: ${error.message}`, 'erro');
        cidDataGlobal = [];
    }
}

function criarCampoCIDCustomizado(container, campoConfig) {
    const baseId = campoConfig.id;

    const divCampo = document.createElement('div');
    divCampo.className = 'form-group span-full custom-cid-dropdown';

    const label = document.createElement('label');
    label.setAttribute('for', baseId + FORM_ELEMENT_IDS.cidCustomTriggerSuffix);
    label.textContent = campoConfig.label;
    divCampo.appendChild(label);

    const triggerInput = document.createElement('input');
    triggerInput.type = 'text';
    triggerInput.id = baseId + FORM_ELEMENT_IDS.cidCustomTriggerSuffix;
    triggerInput.placeholder = 'Selecione o CID...';
    triggerInput.readOnly = true; 
    triggerInput.className = 'custom-cid-trigger';
    divCampo.appendChild(triggerInput);

    const hiddenCodeInput = document.createElement('input');
    hiddenCodeInput.type = 'hidden';
    hiddenCodeInput.id = baseId + FORM_ELEMENT_IDS.cidCustomHiddenCodeSuffix;
    hiddenCodeInput.name = campoConfig.placeholder_template_codigo; 
    divCampo.appendChild(hiddenCodeInput);

    const hiddenDescriptionInput = document.createElement('input');
    hiddenDescriptionInput.type = 'hidden';
    hiddenDescriptionInput.id = baseId + FORM_ELEMENT_IDS.cidCustomHiddenDescriptionSuffix;
    hiddenDescriptionInput.name = campoConfig.placeholder_template_descricao; 
    divCampo.appendChild(hiddenDescriptionInput);

    const panel = document.createElement('div');
    panel.id = baseId + FORM_ELEMENT_IDS.cidCustomPanelSuffix;
    panel.className = 'custom-cid-panel';
    panel.style.display = 'none'; 

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = baseId + FORM_ELEMENT_IDS.cidCustomSearchSuffix;
    searchInput.placeholder = 'Pesquisar CID...';
    searchInput.className = 'custom-cid-search';
    panel.appendChild(searchInput);

    const listElement = document.createElement('ul');
    listElement.id = baseId + FORM_ELEMENT_IDS.cidCustomListSuffix;
    listElement.className = 'custom-cid-list';
    panel.appendChild(listElement);

    const loadMoreButton = document.createElement('button');
    loadMoreButton.type = 'button'; 
    loadMoreButton.id = baseId + FORM_ELEMENT_IDS.cidCustomLoadMoreSuffix;
    loadMoreButton.textContent = 'Carregar mais CIDs';
    loadMoreButton.className = 'custom-cid-load-more';
    panel.appendChild(loadMoreButton);
    
    divCampo.appendChild(panel);
    container.appendChild(divCampo);

    const renderCIDItems = (resetList = true) => {
        if (resetList) {
            listElement.innerHTML = '';
            currentCIDPage = 1;
        }

        const searchTermLowerCase = currentCIDSearchTerm.toLowerCase();
        const filteredCIDs = cidDataGlobal.filter(cid => 
            cid.description.toLowerCase().includes(searchTermLowerCase) || 
            cid.code.toLowerCase().includes(searchTermLowerCase)
        );

        const startIndex = (currentCIDPage - 1) * CIDS_PER_PAGE;
        const endIndex = startIndex + CIDS_PER_PAGE;
        const cidsToDisplay = filteredCIDs.slice(startIndex, endIndex);

        cidsToDisplay.forEach(cid => {
            const listItem = document.createElement('li');
            listItem.textContent = `${cid.code} - ${cid.description}`;
            listItem.dataset.code = cid.code;
            listItem.dataset.description = cid.description;
            listItem.addEventListener('click', () => {
                triggerInput.value = `${cid.code} - ${cid.description}`;
                hiddenCodeInput.value = cid.code;
                hiddenDescriptionInput.value = cid.description;
                panel.style.display = 'none';
            });
            listElement.appendChild(listItem);
        });

        loadMoreButton.style.display = endIndex < filteredCIDs.length ? 'block' : 'none';
    };

    triggerInput.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        if (panel.style.display === 'block' && listElement.children.length === 0) {
            currentCIDSearchTerm = ""; 
            searchInput.value = "";
            renderCIDItems(true); 
        }
    });

    searchInput.addEventListener('input', () => {
        currentCIDSearchTerm = searchInput.value;
        renderCIDItems(true); 
    });

    loadMoreButton.addEventListener('click', () => {
        currentCIDPage++;
        renderCIDItems(false); 
    });

    document.addEventListener('click', (event) => {
        if (!divCampo.contains(event.target) && panel.style.display === 'block') {
            panel.style.display = 'none';
        }
    });
}


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
            if (campoConfig.tipo === "cid_custom_select") {
                criarCampoCIDCustomizado(DOMElements.containerCamposPersonalizados, campoConfig);
            } else {
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
                            optionEl.value = opcao.value || opcao.id;
                            optionEl.textContent = opcao.display || opcao.name;
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
            }
        });
    }
}


export function coletarDadosDoFormulario() {
    const dados = {
        medico: {},
        paciente: {},
        servico: {},
        campos_dinamicos: {},
        pedidos_exames: [] // Novo campo para os exames
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
            if (campoConfig.tipo === "cid_custom_select") {
                const hiddenCodeInput = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomHiddenCodeSuffix);
                const hiddenDescriptionInput = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomHiddenDescriptionSuffix);
                
                if (hiddenCodeInput && campoConfig.placeholder_template_codigo) {
                    dados.campos_dinamicos[campoConfig.placeholder_template_codigo] = hiddenCodeInput.value;
                }
                if (hiddenDescriptionInput && campoConfig.placeholder_template_descricao) {
                    dados.campos_dinamicos[campoConfig.placeholder_template_descricao] = hiddenDescriptionInput.value;
                }
            } else {
                const inputElement = document.getElementById(campoConfig.id);
                if (inputElement) {
                    const value = inputElement.value;

                    if (tipoServicoSelecionado === "Eletrofisiologia" && campoConfig.id === "cirurgia_proposta_aviso_eletivo_ef") {
                        const selectedTussValue = value;
                        const cirurgiaSelecionada = OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA.find(c => c.value === selectedTussValue);
                        if (cirurgiaSelecionada) {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = cirurgiaSelecionada.display;
                            dados.campos_dinamicos.procedimento = cirurgiaSelecionada.fullOriginalString.split(";")[1].split(" (")[0].trim();
                            dados.campos_dinamicos.procedimento_codigo = cirurgiaSelecionada.tuss;
                        } else {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = "";
                        }
                    } else if (tipoServicoSelecionado === "Marcapassos" && campoConfig.id === "cirurgia_proposta_aviso_eletivo_mp") {
                        const selectedCirurgiaId = value;
                        const cirurgiaSelecionadaObj = OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO.find(c => c.id === selectedCirurgiaId);
                        if (cirurgiaSelecionadaObj) {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = cirurgiaSelecionadaObj.name;
                            if (cirurgiaSelecionadaObj.instrumental) {
                                dados.campos_dinamicos.instrumental_cirurgico_aviso = cirurgiaSelecionadaObj.instrumental;
                            }
                            if (cirurgiaSelecionadaObj.materiais) {
                                dados.campos_dinamicos.materiais_consignados_aviso = cirurgiaSelecionadaObj.materiais;
                            }
                        } else {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = "";
                        }
                    } else if (campoConfig.tipo === "select" && campoConfig.placeholder_template_nome && campoConfig.placeholder_template_crm) {
                        const selectedCirurgiaoId = value;
                        const cirurgiaoObj = CIRURGIOES_AUXILIARES.find(c => c.id === selectedCirurgiaoId);
                        if (cirurgiaoObj) {
                            dados.campos_dinamicos[campoConfig.placeholder_template_nome] = cirurgiaoObj.name;
                            dados.campos_dinamicos[campoConfig.placeholder_template_crm] = cirurgiaoObj.crm;
                        } else {
                             dados.campos_dinamicos[campoConfig.placeholder_template_nome] = "";
                             dados.campos_dinamicos[campoConfig.placeholder_template_crm] = "";
                        }
                    } else if (campoConfig.placeholder_template) { 
                        if (inputElement.tagName === 'SELECT' && !campoConfig.placeholder_template_nome) { 
                             const selectedOption = inputElement.options[inputElement.selectedIndex];
                             dados.campos_dinamicos[campoConfig.placeholder_template] = selectedOption ? selectedOption.text : "";
                        } else { 
                            dados.campos_dinamicos[campoConfig.placeholder_template] = value;
                        }
                    } else {
                        dados.campos_dinamicos[campoConfig.id] = value;
                    }
                }
            }
        });
    }

    // Coleta dos pedidos de exames
    const exameECGCheckbox = document.getElementById('exameECG');
    if (exameECGCheckbox && exameECGCheckbox.checked) {
        dados.pedidos_exames.push(exameECGCheckbox.value);
    }

    const exameRaioXCheckbox = document.getElementById('exameRaioX');
    if (exameRaioXCheckbox && exameRaioXCheckbox.checked) {
        dados.pedidos_exames.push(exameRaioXCheckbox.value);
    }

    const exameEcoCheckbox = document.getElementById('exameEco');
    if (exameEcoCheckbox && exameEcoCheckbox.checked) {
        dados.pedidos_exames.push(exameEcoCheckbox.value);
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