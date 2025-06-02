// js/main.js
import {
    CHAVE_MEDICO_SELECIONADO,
    FORM_ELEMENT_IDS,
    CLOUD_FUNCTION_URL,
    MEDICOS, // Import MEDICOS
    CAMPOS_DINAMICOS_POR_SERVICO, // Import for dynamic fields
    CIRURGIOES,
    OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA,
    OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO
} from './config.js';
import {
    popularDropdownMedicos,
    carregarMedicoSelecionado,
    salvarMedicoSelecionado,
    atualizarCamposPersonalizados,
    coletarDadosDoFormulario,
    exibirMensagemStatus,
    exibirLinkDocumento,
    limparResultado,
    carregarDadosCID,
    cidDataGlobal // Assuming cidDataGlobal is exported from ui.js or accessible
} from './ui.js';

async function chamarCloudFunctionGerarDocumento() {
    limparResultado();
    exibirMensagemStatus('Iniciando processo de geração de documentos...', 'info', true);

    exibirMensagemStatus('Verificando dados inseridos...', 'info');
    const dadosForm = coletarDadosDoFormulario();

    if (!dadosForm.medico.id) {
        exibirMensagemStatus("ERRO: Por favor, selecione um médico solicitante.", 'erro'); return;
    }
    if (!dadosForm.servico.tipo) {
        exibirMensagemStatus("ERRO: Por favor, selecione o Tipo de Serviço.", 'erro'); return;
    }
    if (!dadosForm.paciente.nome_social) {
        exibirMensagemStatus("ERRO: Por favor, preencha o Nome do Paciente.", 'erro'); return;
    }

    if (dadosForm.servico.tipo === "Marcapassos" && !dadosForm.campos_dinamicos.cirurgia_proposta) {
        exibirMensagemStatus("ERRO: Por favor, selecione a Cirurgia Proposta para Marcapassos.", 'erro'); return;
    }
    if (dadosForm.servico.tipo === "Eletrofisiologia") {
        if (!dadosForm.campos_dinamicos.cirurgia_proposta) {
            exibirMensagemStatus("ERRO: Por favor, selecione a Cirurgia Proposta para Eletrofisiologia.", 'erro'); return;
        }
        if (!dadosForm.campos_dinamicos.codigo_cid) { 
            exibirMensagemStatus("ERRO: Por favor, selecione o CID para Eletrofisiologia.", 'erro'); return;
        }
    }

    exibirMensagemStatus('Dados confirmados.', 'info');
    console.log("Dados enviados para a Cloud Function:", JSON.stringify(dadosForm, null, 2));


    if (CLOUD_FUNCTION_URL === 'SUA_CLOUD_FUNCTION_URL_AQUI/gerar-documento') {
        exibirMensagemStatus('ERRO: URL da Cloud Function não configurada em js/config.js. Contacte o administrador.', 'erro');
        return;
    }
    exibirMensagemStatus('Enviando solicitação para o servidor...', 'info');

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosForm),
        });

        exibirMensagemStatus('Aguardando resposta do servidor...', 'info');
        const responseData = await response.json();
        console.log("Resposta da Cloud Function:", responseData);

        if (response.ok && responseData.sucesso) {
            exibirMensagemStatus('Processamento no servidor concluído.', 'sucesso');

            if (responseData.links_documentos && responseData.links_documentos.length > 0) {
                exibirMensagemStatus('Documentos gerados:', 'info');
                responseData.links_documentos.forEach(docInfo => {
                    exibirLinkDocumento(`${docInfo.nome_arquivo}`, docInfo.link_arquivo);
                });
            }

            if (responseData.link_pasta_documento) {
                exibirMensagemStatus(`Geração de documentos finalizada!`, 'sucesso');
                exibirLinkDocumento('Acesse a pasta com todos os documentos aqui', responseData.link_pasta_documento);
            } else if (!responseData.links_documentos || responseData.links_documentos.length === 0) {
                 exibirMensagemStatus('Nenhum documento foi gerado, ou link da pasta não retornado.', 'aviso');
            }

        } else {
            exibirMensagemStatus(`Falha no servidor: ${responseData.erro || responseData.message || `Erro HTTP ${response.status}`}`, 'erro');
        }
    } catch (error) {
        console.error("Erro ao chamar Cloud Function:", error);
        exibirMensagemStatus(`Erro de comunicação com o servidor: ${error.message}`, 'erro');
    }
}

function setupEventListeners() {
    const selectMedicoEl = document.getElementById(FORM_ELEMENT_IDS.selectMedico);
    if (selectMedicoEl) {
        selectMedicoEl.addEventListener('change', () => salvarMedicoSelecionado(CHAVE_MEDICO_SELECIONADO));
    }

    const selectServicoTipoEl = document.getElementById(FORM_ELEMENT_IDS.selectServicoTipo);
    if (selectServicoTipoEl) {
        selectServicoTipoEl.addEventListener('change', atualizarCamposPersonalizados);
    }

    const btnGerar = document.getElementById(FORM_ELEMENT_IDS.btnGerarUploadDocumento);
    if (btnGerar) {
        btnGerar.addEventListener('click', chamarCloudFunctionGerarDocumento);
    }
}

async function initApp() {
    await carregarDadosCID();

    popularDropdownMedicos();
    carregarMedicoSelecionado(CHAVE_MEDICO_SELECIONADO);
    atualizarCamposPersonalizados();
    setupEventListeners();
    exibirMensagemStatus('Aplicação pronta. Preencha o formulário e clique em "Gerar Documentos".', 'info', true);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// --- Test Function and Helpers ---

function getRandomElement(arr) {
    if (!arr || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function getRandomNumberString(length) {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function getRandomDate(start, end) {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
}

function getRandomBoolean() {
    return Math.random() < 0.5;
}

function getRandomLorem(wordCount = 10) {
    const loremWords = ["teste", "dados", "aleatorios", "paciente", "documento", "exemplo", "preenchimento", "campo", "analise", "geracao", "sistema", "medico"];
    let text = "";
    for (let i = 0; i < wordCount; i++) {
        text += getRandomElement(loremWords) + " ";
    }
    return text.trim() + ".";
}

const nomesProprios = ["Maria Silva", "João Santos", "Ana Oliveira", "Pedro Costa", "Sofia Pereira", "Carlos Rodrigues", "Beatriz Almeida", "Tiago Ferreira", "Mariana Gomes", "José Martins", "Laura Azevedo", "Rafael Sousa", "Clara Mendes", "Lucas Barbosa", "Helena Rocha"];
const sobrenomes = ["Silva", "Santos", "Oliveira", "Costa", "Pereira", "Rodrigues", "Almeida", "Ferreira", "Gomes", "Martins", "Azevedo", "Sousa", "Mendes", "Barbosa", "Rocha"];


async function preencherFormularioParaTeste(servicoDesejado) {
    console.log(`Iniciando preenchimento de teste para o serviço: ${servicoDesejado}`);

    // 1. Médico Solicitante
    const selectMedicoEl = document.getElementById(FORM_ELEMENT_IDS.selectMedico);
    if (selectMedicoEl && MEDICOS.length > 0) {
        const medicoAleatorio = getRandomElement(MEDICOS);
        selectMedicoEl.value = medicoAleatorio.id;
    }

    // 2. Dados do Paciente
    document.getElementById(FORM_ELEMENT_IDS.pacProntuario).value = getRandomNumberString(7);
    document.getElementById(FORM_ELEMENT_IDS.pacNomeSocial).value = getRandomElement(nomesProprios);
    document.getElementById(FORM_ELEMENT_IDS.pacSexo).value = getRandomElement(["Masculino", "Feminino", "Outro"]);
    document.getElementById(FORM_ELEMENT_IDS.pacNomeMae).value = getRandomElement(nomesProprios).split(" ")[0] + " " + getRandomElement(sobrenomes);
    document.getElementById(FORM_ELEMENT_IDS.pacDataNascimento).value = getRandomDate(new Date(1950, 0, 1), new Date(2005, 11, 31));
    document.getElementById(FORM_ELEMENT_IDS.pacCartaoSUS).value = getRandomNumberString(15);

    // 3. Tipo de Serviço
    const selectServicoTipoEl = document.getElementById(FORM_ELEMENT_IDS.selectServicoTipo);
    if (selectServicoTipoEl) {
        selectServicoTipoEl.value = servicoDesejado;
        // Trigger change to load dynamic fields. Direct call to atualizarCamposPersonalizados also works.
        selectServicoTipoEl.dispatchEvent(new Event('change'));
        // It might be safer to call atualizarCamposPersonalizados directly if event dispatch has timing issues
        // await new Promise(resolve => setTimeout(resolve, 0)); // allow DOM update
        // ou:
        // atualizarCamposPersonalizados(); // Called by the event listener anyway
    } else {
        console.error("Elemento selectServicoTipo não encontrado.");
        return;
    }
    
    // Give a brief moment for conditional UI updates if any are async (though ours is mostly sync)
    await new Promise(resolve => setTimeout(resolve, 50));


    // 4. Campos Personalizados (Dinâmicos)
    const camposParaServico = CAMPOS_DINAMICOS_POR_SERVICO[servicoDesejado];
    if (camposParaServico && camposParaServico.length > 0) {
        camposParaServico.forEach(campoConfig => {
            const el = document.getElementById(campoConfig.id);
            if (el) {
                switch (campoConfig.tipo) {
                    case "textarea":
                        el.value = getRandomLorem(10 + Math.floor(Math.random() * 20)); // 10-29 words
                        break;
                    case "date":
                        el.value = getRandomDate(new Date(2024, 0, 1), new Date(2025, 11, 31));
                        break;
                    case "text":
                        el.value = "Valor de Teste " + getRandomString(8);
                        break;
                    case "select":
                        const options = el.querySelectorAll('option');
                        if (options.length > 1) { // Has more than just the default "Selecione..."
                            // Select a random option, skipping the first if it's a placeholder
                            const randomIndex = Math.floor(Math.random() * (options.length -1)) + 1;
                            el.value = options[randomIndex].value;
                        } else if (options.length === 1 && options[0].value !== "") {
                            el.value = options[0].value; // If only one valid option
                        }
                        break;
                }
            } else if (campoConfig.tipo === "cid_custom_select") {
                if (cidDataGlobal && cidDataGlobal.length > 0) {
                    const randomCID = getRandomElement(cidDataGlobal);
                    const triggerInput = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomTriggerSuffix);
                    const hiddenCodeInput = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomHiddenCodeSuffix);
                    const hiddenDescriptionInput = document.getElementById(campoConfig.id + FORM_ELEMENT_IDS.cidCustomHiddenDescriptionSuffix);

                    if (triggerInput) triggerInput.value = `${randomCID.code} - ${randomCID.description}`;
                    if (hiddenCodeInput) hiddenCodeInput.value = randomCID.code;
                    if (hiddenDescriptionInput) hiddenDescriptionInput.value = randomCID.description;
                } else {
                    console.warn("cidDataGlobal não está populado. Campo CID não preenchido.");
                }
            }
        });
    }

    // 5. Pedidos de Exames
    const exameECGCheckbox = document.getElementById('exameECG');
    if (exameECGCheckbox) exameECGCheckbox.checked = getRandomBoolean();

    const exameRaioXCheckbox = document.getElementById('exameRaioX');
    if (exameRaioXCheckbox) exameRaioXCheckbox.checked = getRandomBoolean();

    const exameEcoCheckbox = document.getElementById('exameEco');
    if (exameEcoCheckbox) exameEcoCheckbox.checked = getRandomBoolean();

    console.log("Preenchimento de teste concluído.");
    exibirMensagemStatus(`Formulário preenchido para teste do serviço: ${servicoDesejado}.`, 'info');
}

// Expose the function to the window object so it can be called from the browser console
window.preencherFormularioParaTeste = preencherFormularioParaTeste;