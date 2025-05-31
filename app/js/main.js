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
} from './ui.js';

async function chamarCloudFunctionGerarDocumento() {
    limparResultado();
    exibirMensagemStatus('Coletando dados do formulário...', 'info');

    const dadosForm = coletarDadosDoFormulario();

    // Validações básicas no frontend
    if (!dadosForm.medico.name) { // Verifica se um médico solicitante foi selecionado
        exibirMensagemStatus("Por favor, selecione um médico solicitante.", 'erro'); return;
    }
    if (!dadosForm.servico.tipo) {
        exibirMensagemStatus("Por favor, selecione o Tipo de Serviço.", 'erro'); return;
    }
    if (!dadosForm.paciente.nome_social) {
        exibirMensagemStatus("Por favor, preencha o Nome do Paciente.", 'erro'); return;
    }
    // Adicionar validações para campos dinâmicos obrigatórios se necessário

    console.log("Dados enviados para a Cloud Function:", JSON.stringify(dadosForm, null, 2)); // Para debug
    exibirMensagemStatus('Enviando dados para o servidor...', 'info');

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosForm), // Envia todos os dados coletados
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
            exibirMensagemStatus(responseData.erro || `Erro do servidor: ${response.status}`, 'erro');
            console.error("Resposta do servidor (erro):", responseData);
        }
    } catch (error) {
        console.error("Erro ao chamar a Cloud Function:", error);
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

function initApp() {
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
