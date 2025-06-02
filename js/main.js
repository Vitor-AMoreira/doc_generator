// js/main.js
import {
    CHAVE_MEDICO_SELECIONADO,
    FORM_ELEMENT_IDS,
    CLOUD_FUNCTION_URL
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
    carregarDadosCID
} from './ui.js';

async function chamarCloudFunctionGerarDocumento() {
    limparResultado();
    exibirMensagemStatus('Coletando dados do formulário...', 'info');

    const dadosForm = coletarDadosDoFormulario();

    if (!dadosForm.medico.id) {
        exibirMensagemStatus("Por favor, selecione um médico solicitante.", 'erro'); return;
    }
    if (!dadosForm.servico.tipo) {
        exibirMensagemStatus("Por favor, selecione o Tipo de Serviço.", 'erro'); return;
    }
    if (!dadosForm.paciente.nome_social) {
        exibirMensagemStatus("Por favor, preencha o Nome do Paciente.", 'erro'); return;
    }

    if (dadosForm.servico.tipo === "Marcapassos" && !dadosForm.campos_dinamicos.cirurgia_proposta) {
        exibirMensagemStatus("Por favor, selecione a Cirurgia Proposta para Marcapassos.", 'erro'); return;
    }
    if (dadosForm.servico.tipo === "Eletrofisiologia") {
        if (!dadosForm.campos_dinamicos.cirurgia_proposta) {
            exibirMensagemStatus("Por favor, selecione a Cirurgia Proposta para Eletrofisiologia.", 'erro'); return;
        }
        if (!dadosForm.campos_dinamicos.cid_codigo) { 
            exibirMensagemStatus("Por favor, selecione o CID para Eletrofisiologia.", 'erro'); return;
        }
    }

    console.log("Dados enviados para a Cloud Function:", JSON.stringify(dadosForm, null, 2));
    exibirMensagemStatus('Enviando dados para o servidor...', 'info');

    exibirMensagemStatus(JSON.stringify(dadosForm, null, 2), 'info');

    if (CLOUD_FUNCTION_URL === 'SUA_CLOUD_FUNCTION_URL_AQUI/gerar-documento') {
        exibirMensagemStatus('ERRO: URL da Cloud Function não configurada em js/config.js.', 'erro');
        return;
    }

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosForm),
        });

        const responseData = await response.json();

        if (response.ok && responseData.sucesso) {
            exibirMensagemStatus(responseData.mensagem || 'Documentos processados com sucesso!', 'sucesso');
            if (responseData.links_documentos && responseData.links_documentos.length > 0) {
                responseData.links_documentos.forEach(docInfo => {
                    exibirLinkDocumento(`Documento Gerado (${docInfo.nome_arquivo})`, docInfo.link_arquivo);
                });
            } else if (responseData.link_pasta_documento) {
                exibirLinkDocumento('Pasta dos Documentos no Drive', responseData.link_pasta_documento);
            }
        } else {
            exibirMensagemStatus(responseData.erro || responseData.message || `Erro do servidor: ${response.status}`, 'erro');
        }
    } catch (error) {
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
    exibirMensagemStatus('Aplicação pronta. Preencha o formulário.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
