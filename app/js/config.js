// js/config.js
export const CHAVE_MEDICO_SELECIONADO = 'medicalDocApp_selectedDoctorId_v6';

// *** IMPORTANTE: URL da sua Cloud Function ***
export const CLOUD_FUNCTION_URL = 'SUA_CLOUD_FUNCTION_URL_AQUI/gerar-documento'; // Substitua pela sua URL real

// Caminho para o arquivo CSV dos CIDs
export const CID_CSV_PATH = 'cid.csv';
export const CIDS_PER_PAGE = 50; // Número de CIDs a carregar por vez no "Carregar mais"

// Médicos principais (solicitantes do documento)
export const MEDICOS = [
    { id: '1', name: "Matheus Henrique de Jesus Lima", crm: "31548", cpf: "70235523160" },
    { id: '2', name: "Thaine Inacio Mendonça", crm: "27066", cpf: "70114148198" },
];

// Cirurgiões para seleção em campos específicos (ex: Aviso Eletivo)
export const CIRURGIOES_AUXILIARES = [
    { id: 'luiz_antonio_aux', name: "Luiz Antonio", crm: "6873" },
    { id: 'guilherme_brasil_aux', name: "Guilherme Brasil", crm: "29479" },
    { id: 'marcos_vargas_aux', name: "Marcos Vargas Aleixo", crm: "5745" }
];

const INSTRUMENTAL_MATERIAIS_MP_DDD = {
    instrumental: "CAIXA DE MARCA-PASSO DDD ; FIOS DE NYLON; CAIXA DE MARCA-PASSO; GERADOR DE MARCA-PASSO DDD (COMUNICAR PROGRAMADOR – BOSTON - PROPONENT MRI)",
    materiais: "CAIXA DE MARCA-PASSO DDD ; FIOS DE NYLON; CAIXA DE MARCA-PASSO; GERADOR DE MARCA-PASSO DDD (COMUNICAR PROGRAMADOR – BOSTON - PROPONENT MRI)"
};

const INSTRUMENTAL_MATERIAIS_CDI_MULTISSITIO = {
    instrumental: "CAIXA DE MARCA-PASSO MULTISSÍTIO; FIOS DE NYLON; GERADOR DE CDI DDD (CAMERA DUPLA) (COMUNICAR PROGRAMADOR_)",
    materiais: "CAIXA DE MARCA-PASSO MULTISSÍTIO; FIOS DE NYLON; GERADOR DE CDI DDD (CAMERA DUPLA) (COMUNICAR PROGRAMADOR_)"
};

export const OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO = [
    {
        id: "implante_marcapasso_ddd",
        name: "Implante de marcapasso DDD",
        instrumental: INSTRUMENTAL_MATERIAIS_MP_DDD.instrumental,
        materiais: INSTRUMENTAL_MATERIAIS_MP_DDD.materiais
    },
    {
        id: "troca_gerador_marcapasso_ddd",
        name: "Troca de gerador marcapasso DDD",
        instrumental: INSTRUMENTAL_MATERIAIS_MP_DDD.instrumental,
        materiais: INSTRUMENTAL_MATERIAIS_MP_DDD.materiais
    },
    {
        id: "implante_cdi_multissitio",
        name: "Implante de CDI multissitio",
        instrumental: INSTRUMENTAL_MATERIAIS_CDI_MULTISSITIO.instrumental,
        materiais: INSTRUMENTAL_MATERIAIS_CDI_MULTISSITIO.materiais
    },
    {
        id: "troca_gerador_cdi_multissitio",
        name: "Troca de gerador de CDI multissitio",
        instrumental: INSTRUMENTAL_MATERIAIS_CDI_MULTISSITIO.instrumental,
        materiais: INSTRUMENTAL_MATERIAIS_CDI_MULTISSITIO.materiais
    }
];

// Opções para dropdown de Cirurgia Proposta para Eletrofisiologia
export const OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA = [
    { value: "0406050015", display: "ESTUDO ELETROFISIOLOGICO DIAGNOSTICO", tuss: "0406050015", fullOriginalString: "0406050015;ESTUDO ELETROFISIOLOGICO DIAGNOSTICO (ESTUDO ELETROFISIOLOGICO DIAGNOSTICO)" },
    { value: "0406050023", display: "ABLACAO DE FLUTTER ATRIAL", tuss: "0406050023", fullOriginalString: "0406050023;ESTUDO ELETROFISIOLOGICO TERAPEUTICO I (ABLACAO DE FLUTTER ATRIAL)" },
    { value: "0406050031", display: "ABLACAO DE TAQUICARDIA ATRIAL DIREITA", tuss: "0406050031", fullOriginalString: "0406050031;ESTUDO ELETROFISIOLOGICO TERAPEUTICO I (ABLACAO DE TAQUICARDIA ATRIAL DIREITA)" },
    { value: "0406050040", display: "ABLACAO DE TAQUICARDIA POR REENTRADA NODAL DE VIAS ANOMALAS DIREITAS, DE TV IDIOPATICA, DE VENTRICULO DIREITO E VENTRICULO ESQUERDO", tuss: "0406050040", fullOriginalString: "0406050040;ESTUDO ELETROFISIOLOGICO TERAPEUTICO I (ABLACAO DE TAQUICARDIA POR REENTRADA NODAL DE VIAS ANOMALAS DIREITAS, DE TV IDIOPATICA, DE VENTRICULO DIREITO E VENTRICULO ESQUERDO)." },
    { value: "0406050058", display: "ABLACAO DO NODULO ARCHOV-TAWARA", tuss: "0406050058", fullOriginalString: "0406050058;ESTUDO ELETROFISIOLOGICO TERAPEUTICO I (ABLACAO DO NODULO ARCHOV-TAWARA)" },
    { value: "0406050066", display: "ABLACAO DAS VIAS ANOMALAS MULTIPLAS", tuss: "0406050066", fullOriginalString: "0406050066;ESTUDO ELETROFISIOLOGICO TERAPEUTICO II (ABLACAO DAS VIAS ANOMALAS MULTIPLAS)" },
    { value: "0406050074", display: "ABLACAO DE FIBRILACAO ATRIAL", tuss: "0406050074", fullOriginalString: "0406050074;ESTUDO ELETROFISIOLOGICO TERAPEUTICO II (ABLACAO DE FIBRILACAO ATRIAL)" },
    { value: "0406050082", display: "ABLACAO DE TAQUICARDIA ATRIAL CICATRICIAL", tuss: "0406050082", fullOriginalString: "0406050082;ESTUDO ELETROFISIOLOGICO TERAPEUTICO II (ABLACAO DE TAQUICARDIA ATRIAL CICATRICIAL)" },
    { value: "0406050104", display: "ABLACAO DE TAQUICARDIA ATRIAL ESQUERDA", tuss: "0406050104", fullOriginalString: "0406050104;ESTUDO ELETROFISIOLOGICO TERAPEUTICO II (ABLACAO DE TAQUICARDIA ATRIAL ESQUERDA)" },
    { value: "0406050112", display: "ABLACAO DE TAQUICARDIA VENTRICULAR IDIOPATICA DO SEIO DE VALSALVA ESQUERDO", tuss: "0406050112", fullOriginalString: "0406050112;ESTUDO ELETROFISIOLOGICO TERAPEUTICO II (ABLACAO DE TAQUICARDIA VENTRICULAR IDIOPATICA DO SEIO DE VALSALVA ESQUERDO)" },
    { value: "0406050120", display: "ABLACAO DE TAQUICARDIA VENTRICULAR SUSTENTADA COM CARDIOPATIA ESTRUTURAL", tuss: "0406050120", fullOriginalString: "0406050120;ESTUDO ELETROFISIOLOGICO TERAPEUTICO II (ABLACAO DE TAQUICARDIA VENTRICULAR SUSTENTADA COM CARDIOPATIA ESTRUTURAL)" },
    { value: "0406050139", display: "ABLACAO DE VIAS ANOMALAS ESQUERDAS", tuss: "0406050139", fullOriginalString: "0406050139;ESTUDO ELETROFISIOLOGICO TERAPEUTICO II (ABLACAO DE VIAS ANOMALAS ESQUERDAS)" },
    { value: "0211020010_ESQ", display: "CATETERISMO CARDIACO ESQUERDO", tuss: "0211020010", fullOriginalString: "0211020010;CATETERISMO CARDIACO ESQUERDO (CATETERISMO CARDIACO ESQUERDO)" },
    { value: "0211020010_DIR", display: "CATETERISMO CARDIACO DIREITO", tuss: "0211020010", fullOriginalString: "0211020010;CATETERISMO CARDIACO DIREITO (CATETERISMO CARDIACO DIREITO)" }
];


export const CAMPOS_DINAMICOS_POR_SERVICO = {
    "Marcapassos": [
        {
            id: "detalhes_priorizacao_mp",
            label: "Condição Clínica:",
            tipo: "textarea",
            placeholder_template: "condicao_clinica"
        },
        {
            id: "data_cirurgia_aviso_eletivo_mp",
            label: "Data da Cirurgia:",
            tipo: "date",
            placeholder_template: "data_cirurgia"
        },
        {
            id: "diagnostico_aviso_eletivo_mp",
            label: "Diagnóstico:",
            tipo: "text",
            placeholder_template: "diagnostico"
        },
        {
            id: "cirurgia_proposta_aviso_eletivo_mp",
            label: "Cirurgia Proposta:",
            tipo: "select",
            opcoes_dropdown: OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO,
            placeholder_template: "cirurgia_proposta"
        },
        {
            id: "cirurgiao_aviso_eletivo_mp",
            label: "Cirurgião Principal:",
            tipo: "select",
            opcoes_dropdown: CIRURGIOES_AUXILIARES,
            placeholder_template_nome: "nome_cirurgiao",
            placeholder_template_crm: "crm_cirurgiao"
        }
    ],
    "Cirurgia Cardíaca": [
        {
            id: "detalhes_priorizacao_cc",
            label: "Condição Clínica:",
            tipo: "textarea",
            placeholder_template: "condicao_clinica"
        },
        {
            id: "data_cirurgia_aviso_eletivo_cc",
            label: "Data da Cirurgia:",
            tipo: "date",
            placeholder_template: "data_cirurgia"
        },
        {
            id: "diagnostico_aviso_eletivo_cc",
            label: "Diagnóstico:",
            tipo: "text",
            placeholder_template: "diagnostico"
        },
        {
            id: "cirurgia_proposta_aviso_eletivo_cc",
            label: "Cirurgia Proposta:",
            tipo: "textarea",
            placeholder_template: "cirurgia_proposta"
        },
        {
            id: "cirurgiao_aviso_eletivo_cc",
            label: "Cirurgião:",
            tipo: "select",
            opcoes_dropdown: CIRURGIOES_AUXILIARES,
            placeholder_template_nome: "nome_cirurgiao",
            placeholder_template_crm: "crm_cirurgiao"
        }
    ],
    "Eletrofisiologia": [
        {
            id: "detalhes_priorizacao_ef",
            label: "Condição Clínica:",
            tipo: "textarea",
            placeholder_template: "campo_personalizado"
        },
        {
            id: "data_cirurgia_aviso_eletivo_ef",
            label: "Data da Cirurgia:",
            tipo: "date",
            placeholder_template: "data_cirurgia"
        },
        { 
            id: "cid_selecionado_ef", // ID base para o campo CID customizado
            label: "CID:",
            tipo: "cid_custom_select", // Novo tipo para o componente customizado
            // Os placeholders serão usados para nomear os inputs hidden que guardarão os valores finais
            placeholder_template_codigo: "codigo_cid", 
            placeholder_template_descricao: "descricao_cid"
        },
        {
            id: "cirurgia_proposta_aviso_eletivo_ef",
            label: "Cirurgia Proposta:",
            tipo: "select",
            opcoes_dropdown: OPCOES_CIRURGIA_PROPOSTA_ELETROFISIOLOGIA,
            placeholder_template: "cirurgia_proposta"
        },
        {
            id: "cirurgiao_aviso_eletivo_ef",
            label: "Cirurgião:",
            tipo: "select",
            opcoes_dropdown: CIRURGIOES_AUXILIARES,
            placeholder_template_nome: "nome_cirurgiao",
            placeholder_template_crm: "crm_cirurgiao"
        }
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
    outputLink: "outputLink",
    // Sufixos para elementos do CID customizado (o ID base virá de campoConfig.id)
    cidCustomTriggerSuffix: "_trigger",
    cidCustomPanelSuffix: "_panel",
    cidCustomSearchSuffix: "_search",
    cidCustomListSuffix: "_list",
    cidCustomLoadMoreSuffix: "_loadMore",
    cidCustomHiddenCodeSuffix: "_hiddenCode",
    cidCustomHiddenDescriptionSuffix: "_hiddenDescription"
};
