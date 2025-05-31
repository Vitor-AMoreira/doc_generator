// js/config.js
export const CHAVE_MEDICO_SELECIONADO = 'medicalDocApp_selectedDoctorId_v6';

// *** IMPORTANTE: URL da sua Cloud Function ***
export const CLOUD_FUNCTION_URL = 'SUA_CLOUD_FUNCTION_URL_AQUI/gerar-documento'; 

// Médicos principais (solicitantes do documento)
export const MEDICOS = [
    { id: '1', name: "Matheus Henrique de Jesus Lima", crm: "31548", cpf: "70235523160" }, // IDs como string para consistência com localStorage
    { id: '2', name: "Thaine Inacio Mendonça", crm: "27066", cpf: "70114148198" },
];

// Cirurgiões para seleção em campos específicos (ex: Aviso Eletivo)
export const CIRURGIOES_AUXILIARES = [
    { id: 'luiz_antonio_aux', name: "Luiz Antonio", crm: "6873" }, // CPF não é usado no template do Aviso Eletivo para o cirurgião
    { id: 'guilherme_brasil_aux', name: "Guilherme Brasil", crm: "29479" },
    { id: 'marcos_vargas_aux', name: "Marcos Vargas Aleixo", crm: "5745" }
];

// Opções para dropdowns de Cirurgia Proposta
export const OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO = [
    { id: "implante_marcapasso_ddd", name: "Implante de marcapasso DDD" },
    { id: "troca_gerador_marcapasso", name: "Troca de gerador de marcapasso DDD" },
    { id: "implante_cdi_multissitio", name: "Implante de CDI multissitio" },
    { id: "troca_gerador_cdi_multissitio", name: "Troca de gerador de CDI multissitio" }
];

export const OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA = [
    { id: "implante_cdi", name: "Implante de CDI" },
    { id: "troca_gerador_cdi", name: "Troca de gerador de CDI" },
    { id: "implante_cdi_multissitio", name: "Implante de CDI multissítio" },
    { id: "troca_gerador_cdi_multissitio", name: "Troca de gerador de CDI multissítio" }
];


// Define os campos dinâmicos necessários para os documentos que cada SERVIÇO pode gerar.
export const CAMPOS_DINAMICOS_POR_SERVICO = {
    "Marcapassos": [
        // Campos para o documento "Priorizacao" (Serviço Marcapasso)
        { 
            id: "detalhes_priorizacao_mp", 
            label: "Condição Clínica (Priorização de Internação Cirúrgica):", 
            tipo: "textarea", 
            placeholder_template: "campo_personalizado" // Usado no template de Priorização
        },
        // Campos para o documento "Aviso_Eletivo" (Serviço Marcapasso)
        {
            id: "data_cirurgia_aviso_eletivo_mp",
            label: "Data da Cirurgia (Aviso Eletivo):",
            tipo: "date",
            placeholder_template: "data_cirurgia_aviso" 
        },
        {
            id: "diagnostico_aviso_eletivo_mp",
            label: "Diagnóstico (Aviso Eletivo):",
            tipo: "text",
            placeholder_template: "diagnostico_aviso"
        },
        {
            id: "cirurgia_proposta_aviso_eletivo_mp", // Novo campo para dropdown
            label: "Cirurgia Proposta (Aviso Eletivo):",
            tipo: "select",
            opcoes_dropdown: OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO,
            placeholder_template: "cirurgia_proposta_aviso"
        },
        {
            id: "cirurgiao_aviso_eletivo_mp",
            label: "Cirurgião Principal (Aviso Eletivo):",
            tipo: "select",
            opcoes_dropdown: CIRURGIOES_AUXILIARES, 
            placeholder_template_nome: "nome_cirurgiao_aviso", 
            placeholder_template_crm: "crm_cirurgiao_aviso"    
        }
        // Placeholders para valores fixos (instrumental_cirurgico_aviso, materiais_consignados_aviso)
        // serão preenchidos pelo backend, não precisam de input no frontend.
    ],
    "Cirurgia Cardíaca": [
        {
            id: "detalhes_priorizacao_cc",
            label: "Condição Clínica (Priorização de Internação Cirúrgica):",
            tipo: "textarea",
            placeholder_template: "campo_personalizado" 
        },
        {
            id: "data_cirurgia_aviso_eletivo_cc",
            label: "Data da Cirurgia (Aviso Eletivo):",
            tipo: "date",
            placeholder_template: "data_cirurgia_aviso"
        },
        {
            id: "diagnostico_aviso_eletivo_cc",
            label: "Diagnóstico (Aviso Eletivo):",
            tipo: "text",
            placeholder_template: "diagnostico_aviso"
        },
        {
            id: "cirurgia_proposta_aviso_eletivo_cc",
            label: "Cirurgia Proposta (Aviso Eletivo):",
            tipo: "textarea", // Pode ser text ou textarea, ou um dropdown se houver opções fixas
            placeholder_template: "cirurgia_proposta_aviso"
        },
        {
            id: "cirurgiao_aviso_eletivo_cc",
            label: "Cirurgião (Aviso Eletivo):",
            tipo: "select",
            opcoes_dropdown: CIRURGIOES_AUXILIARES,
            placeholder_template_nome: "nome_cirurgiao_aviso",
            placeholder_template_crm: "crm_cirurgiao_aviso"
        }
    ],
    "Eletrofisiologia": [
        {
            id: "detalhes_priorizacao_ef",
            label: "Condição Clínica (Priorização de Internação Cirúrgica):",
            tipo: "textarea",
            placeholder_template: "campo_personalizado"
        },
        // Campos para o "Aviso Eletivo" de Eletrofisiologia
        {
            id: "data_cirurgia_aviso_eletivo_ef",
            label: "Data da Cirurgia (Aviso Eletivo):",
            tipo: "date",
            placeholder_template: "data_cirurgia_aviso" 
        },
        {
            id: "diagnostico_aviso_eletivo_ef",
            label: "Diagnóstico (Aviso Eletivo):",
            tipo: "text",
            placeholder_template: "diagnostico_aviso"
        },
        {
            id: "cirurgia_proposta_aviso_eletivo_ef", // Novo campo para dropdown
            label: "Cirurgia Proposta (Aviso Eletivo):",
            tipo: "select",
            opcoes_dropdown: OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA,
            placeholder_template: "cirurgia_proposta_aviso"
        },
        {
            id: "cirurgiao_aviso_eletivo_ef",
            label: "Cirurgião (Aviso Eletivo):",
            tipo: "select",
            opcoes_dropdown: CIRURGIOES_AUXILIARES, 
            placeholder_template_nome: "nome_cirurgiao_aviso", 
            placeholder_template_crm: "crm_cirurgiao_aviso"
        }
        // Placeholders para valores fixos (preparo_pre_operatorio_aviso, instrumental_cirurgico_aviso, etc.)
        // serão preenchidos pelo backend.
    ]
};

export const FORM_ELEMENT_IDS = {
    selectMedico: "selectMedico",
    selectServicoTipo: "servicoTipo",
    containerCamposPersonalizados: "camposPersonalizadosContainer",
    btnGerarUploadDocumento: "btnGerarUploadDocumento",
    pacProntuario: "pacProntuario",
    pacNomeSocial: "pacNomeSocial",
    pacSexo: "pacSexo",
    pacNomeMae: "pacNomeMae",
    pacDataNascimento: "pacDataNascimento",
    pacCartaoSUS: "pacCartaoSUS",
    statusMessages: "statusMessages",
    outputLink: "outputLink"
};
