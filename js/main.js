// js/main.js
import {
    CHAVE_MEDICO_SELECIONADO,
    FORM_ELEMENT_IDS,
    CLOUD_FUNCTION_URL,
    MEDICOS,
    CAMPOS_DINAMICOS_POR_SERVICO,
    CIRURGIOES,
    OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA,
    OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO,
    OPCOES_CIRURGIA_PROPOSTA_CIRURGIA_CARDIACA
} from './config.js';
import {
    popularDropdownMedicos,
    carregarMedicoSelecionado,
    salvarMedicoSelecionado,
    atualizarCamposPersonalizados,
    coletarDadosDoFormulario,
    exibirMensagemStatus,
    exibirLinkDocumento,
    limparFormularioCompleto,
    carregarDadosCID,
    cidDataGlobal
} from './ui.js';
import { formatarDataParaDisplay } from './utils.js';


function validarFormatoData(dataStr, nomeCampo) {
    if (!dataStr.trim()) return true; // Permite campos de data opcionais não preenchidos
    const regexData = /^(\d{2})\/(\d{2})\/(\d{4})$/; // Estritamente DD/MM/YYYY
    const match = dataStr.match(regexData);

    if (!match) {
        exibirMensagemStatus(`ERRO: Formato da ${nomeCampo} inválido. Use dia/mês/ano.`, 'erro');
        return false;
    }

    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    const ano = parseInt(match[3], 10);

    if (ano < 1900 || ano > new Date().getFullYear() + 5) { // Permite algum buffer para datas futuras
        exibirMensagemStatus(`ERRO: Ano da ${nomeCampo} inválido.`, 'erro');
        return false;
    }
    if (mes < 1 || mes > 12) {
        exibirMensagemStatus(`ERRO: Mês da ${nomeCampo} inválido.`, 'erro');
        return false;
    }
    const diasNoMes = new Date(ano, mes, 0).getDate();
    if (dia < 1 || dia > diasNoMes) {
        exibirMensagemStatus(`ERRO: Dia da ${nomeCampo} inválido para o mês/ano.`, 'erro');
        return false;
    }
    return true;
}


async function chamarCloudFunctionGerarDocumento() {
    exibirMensagemStatus('Iniciando processo de geração de documentos...', 'info', true);

    exibirMensagemStatus('Verificando dados inseridos...', 'info');
    const dadosForm = coletarDadosDoFormulario(); // Dados já são coletados no formato DD/MM/YYYY onde aplicável

    // Validações
    if (!dadosForm.medico.id) {
        exibirMensagemStatus("ERRO: Por favor, selecione um médico solicitante.", 'erro'); return;
    }
    if (!dadosForm.paciente.nome_social) {
        exibirMensagemStatus("ERRO: Por favor, preencha o Nome do Paciente.", 'erro'); return;
    }
    if (!document.getElementById(FORM_ELEMENT_IDS.pacDataNascimento)?.value.trim()) {
         exibirMensagemStatus("ERRO: Data de Nascimento é obrigatória.", 'erro');
         return;
    }
    if (!validarFormatoData(dadosForm.paciente.data_nascimento, "Data de Nascimento")) {
        return;
    }
    if (!dadosForm.servico.tipo) {
        exibirMensagemStatus("ERRO: Por favor, selecione o Tipo de Serviço.", 'erro'); return;
    }

    // Validar outras datas dinâmicas
    const camposServicoAtual = CAMPOS_DINAMICOS_POR_SERVICO[dadosForm.servico.tipo] || [];
    for (const campo of camposServicoAtual) {
        if (campo.tipo === "text" && campo.label.toLowerCase().includes("data")) { // Assumindo que campos de data em texto têm "data" no label
            const valorCampoData = document.getElementById(campo.id)?.value;
            if (valorCampoData && !validarFormatoData(valorCampoData, campo.label)) return;
        } else if (campo.tipo === "date") { // Para campos <input type="date">, o valor já foi formatado para DD/MM/YYYY em coletarDadosDoFormulario
             const valorCampoData = dadosForm.campos_dinamicos[campo.placeholder_template]; // Acessa o valor já formatado
             if (valorCampoData && !validarFormatoData(valorCampoData, campo.label)) return;
        }
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
    if (dadosForm.servico.tipo === "Cirurgia Cardíaca") {
        if (!dadosForm.campos_dinamicos.cirurgia_proposta && !dadosForm.campos_dinamicos.cirurgia_proposta_aviso) {
            exibirMensagemStatus("ERRO: Preencha pelo menos um dos campos de 'Cirurgia Proposta' para Cirurgia Cardíaca.", 'erro'); return;
        }
    }


    exibirMensagemStatus('Dados confirmados.', 'info');
    console.log("Dados enviados para a Cloud Function:", JSON.stringify(dadosForm, null, 2));


    if (CLOUD_FUNCTION_URL === 'SUA_CLOUD_FUNCTION_URL_AQUI/gerar-documento') {
        exibirMensagemStatus('ERRO: URL da Cloud Function não configurada em js/config.js. Contacte o administrador.', 'erro');
        return;
    }
    exibirMensagemStatus('Solicitação enviada ao servidor. Processando...', 'info');
    document.getElementById(FORM_ELEMENT_IDS.btnGerarUploadDocumento).disabled = true;

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
    } finally {
        document.getElementById(FORM_ELEMENT_IDS.btnGerarUploadDocumento).disabled = false;
        limparFormularioCompleto(); // Limpa o formulário após a tentativa de gerar
        exibirMensagemStatus("Formulário limpo após a operação. Pronto para nova entrada.", "info");
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

function getRandomDateForTest(start, end) {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
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
    limparFormularioCompleto();

    const selectMedicoEl = document.getElementById(FORM_ELEMENT_IDS.selectMedico);
    if (selectMedicoEl && MEDICOS.length > 0) {
        const medicoAleatorio = getRandomElement(MEDICOS);
        selectMedicoEl.value = medicoAleatorio.id;
        salvarMedicoSelecionado(CHAVE_MEDICO_SELECIONADO);
    }

    document.getElementById(FORM_ELEMENT_IDS.pacProntuario).value = getRandomNumberString(7);
    document.getElementById(FORM_ELEMENT_IDS.pacNomeSocial).value = getRandomElement(nomesProprios);
    document.getElementById(FORM_ELEMENT_IDS.pacSexo).value = getRandomElement(["Masculino", "Feminino", "Outro"]);
    document.getElementById(FORM_ELEMENT_IDS.pacNomeMae).value = getRandomElement(nomesProprios).split(" ")[0] + " " + getRandomElement(sobrenomes);
    document.getElementById(FORM_ELEMENT_IDS.pacDataNascimento).value = getRandomDateForTest(new Date(1950, 0, 1), new Date(2005, 11, 31));
    document.getElementById(FORM_ELEMENT_IDS.pacCartaoSUS).value = getRandomNumberString(15);

    const selectServicoTipoEl = document.getElementById(FORM_ELEMENT_IDS.selectServicoTipo);
    if (selectServicoTipoEl) {
        selectServicoTipoEl.value = servicoDesejado;
        atualizarCamposPersonalizados();
    } else {
        console.error("Elemento selectServicoTipo não encontrado.");
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const camposParaServico = CAMPOS_DINAMICOS_POR_SERVICO[servicoDesejado];
    if (camposParaServico && camposParaServico.length > 0) {
        camposParaServico.forEach(campoConfig => {
            const el = document.getElementById(campoConfig.id);
            if (el) {
                switch (campoConfig.tipo) {
                    case "textarea":
                        el.value = getRandomLorem(10 + Math.floor(Math.random() * 20));
                        break;
                    case "date": // Mantido como date, mas a coleta tratará
                        const randomDateObj = new Date(new Date(2024, 0, 1).getTime() + Math.random() * (new Date(2025, 11, 31).getTime() - new Date(2024, 0, 1).getTime()));
                        el.value = randomDateObj.toISOString().split('T')[0]; // Formato YYYY-MM-DD para o input date
                        break;
                    case "text":
                         if (campoConfig.label.toLowerCase().includes("data")){ // para os campos de data que são text
                            el.value = getRandomDateForTest(new Date(2024,0,1), new Date(2025,11,31));
                         } else {
                            el.value = "Valor de Teste " + getRandomString(8);
                         }
                        break;
                    case "select":
                        const options = el.querySelectorAll('option');
                        if (options.length > 1) {
                            const randomIndex = Math.floor(Math.random() * (options.length -1)) + 1;
                            el.value = options[randomIndex].value;
                        } else if (options.length === 1 && options[0].value !== "") {
                            el.value = options[0].value;
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
                }
            }
        });
    }

    const exameECGCheckbox = document.getElementById('exameECG');
    if (exameECGCheckbox) exameECGCheckbox.checked = getRandomBoolean();

    const exameRaioXCheckbox = document.getElementById('exameRaioX');
    if (exameRaioXCheckbox) exameRaioXCheckbox.checked = getRandomBoolean();

    const exameEcoCheckbox = document.getElementById('exameEco');
    if (exameEcoCheckbox) exameEcoCheckbox.checked = getRandomBoolean();

    console.log("Preenchimento de teste concluído.");
    exibirMensagemStatus(`Formulário preenchido para teste do serviço: ${servicoDesejado}.`, 'info');
}

window.preencherFormularioParaTeste = preencherFormularioParaTeste;