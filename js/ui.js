// js/ui.js
import {
    MEDICOS,
    CAMPOS_DINAMICOS_POR_SERVICO,
    FORM_ELEMENT_IDS,
    OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA,
    OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO,
    OPCOES_CIRURGIA_PROPOSTA_CIRURGIA_CARDIACA,
    CIRURGIOES,
    CID_CSV_PATH,
    CIDS_PER_PAGE,
    INSTRUMENTAL_MATERIAIS_CIRURGIA_CARDIACA,
    CHAVE_MEDICO_SELECIONADO
} from './config.js';


export let cidDataGlobal = [];
let currentCIDPage = 1;
let currentCIDSearchTerm = "";

const DOMElements = {
    selectMedico: document.getElementById(FORM_ELEMENT_IDS.selectMedico),
    selectServicoTipo: document.getElementById(FORM_ELEMENT_IDS.selectServicoTipo),
    containerCamposPersonalizados: document.getElementById(FORM_ELEMENT_IDS.containerCamposPersonalizados),
    statusMessages: document.getElementById(FORM_ELEMENT_IDS.statusMessages),
    medicalDocForm: document.getElementById('medicalDocForm')
};

export async function carregarDadosCID() {
    try {
        const response = await fetch(CID_CSV_PATH);
        if (!response.ok) {
            console.error(`Erro ao buscar o arquivo CID: ${response.statusText}`);
            exibirMensagemStatus(`Falha ao carregar dados de CID. Verifique o console.`, 'erro');
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
        pedidos_exames: []
    };

    const idMedicoSelecionado = DOMElements.selectMedico?.value;
    const medicoSelecionadoObj = MEDICOS.find(m => m.id.toString() === idMedicoSelecionado);
    dados.medico = medicoSelecionadoObj ? { ...medicoSelecionadoObj } : { name: "", crm: "", cpf: "" };

    dados.paciente.prontuario = document.getElementById(FORM_ELEMENT_IDS.pacProntuario)?.value || "";
    dados.paciente.nome_social = document.getElementById(FORM_ELEMENT_IDS.pacNomeSocial)?.value || "";
    dados.paciente.sexo = document.getElementById(FORM_ELEMENT_IDS.pacSexo)?.value || "";
    dados.paciente.nome_mae = document.getElementById(FORM_ELEMENT_IDS.pacNomeMae)?.value || "";

    const dataNascInput = document.getElementById(FORM_ELEMENT_IDS.pacDataNascimento);
    if (dataNascInput) {
        const dataNascValue = dataNascInput.value.trim();
        if (dataNascValue) {
            const parts = dataNascValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (parts) {
                dados.paciente.data_nascimento = `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            } else {
                dados.paciente.data_nascimento = dataNascValue;
            }
        } else {
            dados.paciente.data_nascimento = "";
        }
    }


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
                    let value = inputElement.value;

                    if (tipoServicoSelecionado === "Eletrofisiologia" && campoConfig.id === "cirurgia_proposta_aviso_eletivo_ef") {
                        const selectedValue = value;
                        const cirurgiaSelecionada = OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA.find(c => c.value === selectedValue);
                        if (cirurgiaSelecionada) {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = cirurgiaSelecionada.display;
                            dados.campos_dinamicos.procedimento = cirurgiaSelecionada.fullOriginalString.split(";")[1].split(" (")[0].trim();
                            dados.campos_dinamicos.procedimento_codigo = cirurgiaSelecionada.tuss;
                        } else {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = "";
                        }
                    } else if (tipoServicoSelecionado === "Cirurgia Cardíaca" && campoConfig.id === "cirurgia_proposta_priorizacao_cc") {
                        const selectedValue = value;
                        const cirurgiaSelecionada = OPCOES_CIRURGIA_PROPOSTA_CIRURGIA_CARDIACA.find(c => c.value === selectedValue);
                        if (cirurgiaSelecionada) {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = cirurgiaSelecionada.display;
                        } else {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = "";
                        }
                    } else if (tipoServicoSelecionado === "Cirurgia Cardíaca" && campoConfig.id === "cirurgia_proposta_aviso_texto_cc") {
                        dados.campos_dinamicos[campoConfig.placeholder_template] = value;
                    } else if (tipoServicoSelecionado === "Cirurgia Cardíaca" && campoConfig.id === "data_cateterismo_cc") {
                        dados.campos_dinamicos[campoConfig.placeholder_template] = value; 
                    } else if (tipoServicoSelecionado === "Cirurgia Cardíaca" && campoConfig.id === "data_cirurgia_aviso_eletivo_cc"){
                        dados.campos_dinamicos[campoConfig.placeholder_template] = value; 
                    }else if (tipoServicoSelecionado === "Marcapassos" && campoConfig.id === "cirurgia_proposta_aviso_eletivo_mp") {
                        const selectedCirurgiaId = value;
                        const cirurgiaSelecionadaObj = OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO.find(c => c.id === selectedCirurgiaId);
                        if (cirurgiaSelecionadaObj) {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = cirurgiaSelecionadaObj.name;
                            dados.campos_dinamicos.pre_operatorio = cirurgiaSelecionadaObj.pre_operatorio;
                            dados.campos_dinamicos.instrumental_cirurgico = cirurgiaSelecionadaObj.instrumental_cirurgico;
                            dados.campos_dinamicos.materiais_consignados = cirurgiaSelecionadaObj.materiais_consignados;
                            dados.campos_dinamicos.empresa_consignados = cirurgiaSelecionadaObj.empresa_consignados;
                            dados.campos_dinamicos.fios_cirurgicos = cirurgiaSelecionadaObj.fios_cirurgicos;
                            dados.campos_dinamicos.bist_eletrico = cirurgiaSelecionadaObj.bist_eletrico;
                            dados.campos_dinamicos.torre_video = cirurgiaSelecionadaObj.torre_video;
                            dados.campos_dinamicos.ultrassom = cirurgiaSelecionadaObj.ultrassom;
                            dados.campos_dinamicos.tca = cirurgiaSelecionadaObj.tca;
                            dados.campos_dinamicos.eco_trans = cirurgiaSelecionadaObj.eco_trans;
                        } else {
                            dados.campos_dinamicos[campoConfig.placeholder_template] = "";
                        }
                    } else if (campoConfig.tipo === "select" && campoConfig.placeholder_template_nome && campoConfig.placeholder_template_crm) { 
                        const selectedCirurgiaoId = value;
                        const cirurgiaoObj = CIRURGIOES.find(c => c.id === selectedCirurgiaoId);
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
    
    if (tipoServicoSelecionado === "Eletrofisiologia") {
        // 'condicao_clinica' (anteriormente 'campo_personalizado') é o placeholder para "Condição Clínica" de Eletrofisiologia
        // Garante que 'diagnostico' reflita esse valor, mesmo se vazio.
        dados.campos_dinamicos.diagnostico = dados.campos_dinamicos.condicao_clinica || "";
    }


    if (tipoServicoSelecionado === "Cirurgia Cardíaca") {
        Object.assign(dados.campos_dinamicos, INSTRUMENTAL_MATERIAIS_CIRURGIA_CARDIACA);
    }


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

export function exibirMensagemStatus(mensagem, tipo = 'info', limparAnteriores = false) {
    if (!DOMElements.statusMessages) return;

    if (limparAnteriores) {
        DOMElements.statusMessages.innerHTML = '';
    }

    const p = document.createElement('p');
    p.innerHTML = mensagem;
    p.className = `status-${tipo}`;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const timestampSpan = document.createElement('span');
    timestampSpan.style.fontSize = '0.8em';
    timestampSpan.style.marginLeft = '10px';
    timestampSpan.style.color = '#777';
    timestampSpan.textContent = `(${timestamp})`;
    p.appendChild(timestampSpan);

    DOMElements.statusMessages.appendChild(p);
    DOMElements.statusMessages.scrollTop = DOMElements.statusMessages.scrollHeight;
}

export function exibirLinkDocumento(texto, link) {
    let mensagemHtml = texto;
    if (link) {
        mensagemHtml += `: <a href="${link}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">Acessar Documento</a>`;
    }
    exibirMensagemStatus(mensagemHtml, 'info');
}

export function limparFormularioCompleto() {
    if (DOMElements.medicalDocForm) {
        DOMElements.medicalDocForm.reset();
    }
    localStorage.removeItem(CHAVE_MEDICO_SELECIONADO);
    
    if(DOMElements.selectMedico) DOMElements.selectMedico.value = "";
    if(DOMElements.selectServicoTipo) DOMElements.selectServicoTipo.value = "";

    atualizarCamposPersonalizados();
    
    const camposDinamicos = CAMPOS_DINAMICOS_POR_SERVICO[DOMElements.selectServicoTipo?.value] || [];
    camposDinamicos.forEach(campoConfig => {
        if (campoConfig.tipo === "cid_custom_select") {
            const triggerInput = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomTriggerSuffix);
            const hiddenCodeInput = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomHiddenCodeSuffix);
            const hiddenDescriptionInput = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomHiddenDescriptionSuffix);
            const panel = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomPanelSuffix);
            const listElement = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomListSuffix);


            if (triggerInput) triggerInput.value = "";
            if (hiddenCodeInput) hiddenCodeInput.value = "";
            if (hiddenDescriptionInput) hiddenDescriptionInput.value = "";
            if (panel) panel.style.display = 'none';
            if (listElement) listElement.innerHTML = '';
        }
    });
    
    if (DOMElements.statusMessages) {
        const mensagens = DOMElements.statusMessages.querySelectorAll('p');
        mensagens.forEach(msg => {
            if (!msg.textContent.includes('Formulário e cache limpos')) {
                msg.remove();
            }
        });
    }
    exibirMensagemStatus('Formulário e cache limpos.', 'info', true);
}