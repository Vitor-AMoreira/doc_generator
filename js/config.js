// js/config.js
export const CHAVE_MEDICO_SELECIONADO = 'medicalDocApp_selectedDoctorId_v6';

export const CLOUD_FUNCTION_URL = 'https://southamerica-east1-jesus-doc-generator.cloudfunctions.net/doc_generator';

export const CID_CSV_PATH = 'cid.csv';
export const CIDS_PER_PAGE = 50;

export const MEDICOS = [
    { id: '1', name: "Matheus Henrique de Jesus Lima", crm: "31548", cpf: "70235523160" },
    { id: '2', name: "Thaine Inacio Mendonça", crm: "27066", cpf: "70114148198" },
];

export const CIRURGIOES = [
    { id: 'luiz_antonio', name: "Luiz Antonio", crm: "6873" },
    { id: 'guilherme_brasil', name: "Guilherme Brasil", crm: "29479" },
    { id: 'marcos_vargas', name: "Marcos Vargas Aleixo", crm: "5745" }
];

const INSTRUMENTAL_MATERIAIS_BASE_MARCAPASSO_CDI = {
    pre_operatorio: "",
    empresa_consignados: "",
    fios_cirurgicos: "",
    bist_eletrico: "",
    torre_video: "",
    ultrassom: "",
    tca: "",
    eco_trans: ""
};

const INSTRUMENTAL_MATERIAIS_MP_DDD = {
    ...INSTRUMENTAL_MATERIAIS_BASE_MARCAPASSO_CDI,
    instrumental_cirurgico: "CAIXA DE MARCA-PASSO DDD ; FIOS DE NYLON; CAIXA DE MARCA-PASSO; GERADOR DE MARCA-PASSO DDD (COMUNICAR PROGRAMADOR – BOSTON - PROPONENT MRI)",
    materiais_consignados: "CAIXA DE MARCA-PASSO DDD ; FIOS DE NYLON; CAIXA DE MARCA-PASSO; GERADOR DE MARCA-PASSO DDD (COMUNICAR PROGRAMADOR – BOSTON - PROPONENT MRI)"
};

const INSTRUMENTAL_MATERIAIS_CDI_MULTISSITIO = {
    ...INSTRUMENTAL_MATERIAIS_BASE_MARCAPASSO_CDI,
    instrumental_cirurgico: "CAIXA DE MARCA-PASSO MULTISSÍTIO; FIOS DE NYLON; GERADOR DE CDI DDD (CAMERA DUPLA) (COMUNICAR PROGRAMADOR_)",
    materiais_consignados: "CAIXA DE MARCA-PASSO MULTISSÍTIO; FIOS DE NYLON; GERADOR DE CDI DDD (CAMERA DUPLA) (COMUNICAR PROGRAMADOR_)"
};

export const INSTRUMENTAL_MATERIAIS_CIRURGIA_CARDIACA = {
    pre_operatorio: "TOMAR BANHO COM CLOREXIDINE DEGERMANTE, DEPILAÇÃO DO TÓRAX, ABDOME E MEMBROS INFERIORES",
    instrumental_cirurgico: "CAIXA DA CIRURGIA CARDIOVASCULAR / CAIXAS DE COMPLEMENTO DE VÁLVULA / CAIXA DE CONECTORES PARA CEC / CAIXA DE PASSADORES DE FIO / KIT DE CIRCULAÇÃO EXTRACORPÓREA ADULTO / CÂNULAS DE AORTA E VEIA CAVA CURVA ARAMADAS / PATCH DE PERICÁRDIO BOVINO / PATCH INORGÂNICO / SURGICEL / GELFOAM / COLA CIRÚRGICA CARDIOVASCULAR (10 UNIDADES) / MANTA TÉRMICA / DRENO DE TÓRAX TUBULAR Nº 36 + COLETOR SELO D' ÁGUA (03 UNIDADES) / BISTURI LÂMINAS Nº 11, 15, 23 / JELCO Nº 14 (03 UNIDADES) / PRÓTESES DE VÁLVULA AÓRTICA MECÂNICA E BIOLÓGICA Nº  19, 21, 23, 25, 27 / PRÓTESES DE VÁLVULA MITRAL MECÂNICA E BIOLÓGICA Nº 25, 27, 29, 31, 33 /  CLOREXIDINE DEGERMANTE (1 LITRO) E CLOREXIDINE ALCOÓLICO (1 LITRO) / FIO VERMELHO E PRETO PARA MARCAPASSO EXTERNO /  CATETER VENOSO CENTRAL DUPLO LÚMEN / KIT DE BALÃO INTRA-AÓRTICO / SONDA VESICAL  Nº 12, 14, 16 + COLETOR / PÁS DE DESFIBRILADOR INTERNO ADULTO/ PLACAS ADESIVAS PARA DESFIBRILADOR EXTERNO / MARCAPASSO EXTERNO / COMPRESSAS ESTÉREIS / KIT PARA DEGERMAÇÃO / KIT SONDAGEM VESICAL / COXIM PARA TÓRAX / SCALP Nº 23 (02 UNIDADES) / ",
    materiais_consignados: "NÃO",
    empresa_consignados: "NÃO",
    fios_cirurgicos: "NYLON (3-0 / 4-0) - 10 UNIDADES DE CADA NÚMERO / ALGODÃO NÃO-AGULHADO (2-0 / 4-0) - 5 UNIDADES DE CADA NÚMERO / ALGODÃO AGULHADO (2-0) 10 UNIDADES / POLIPROPILENO (PROLENE) (3-0 / 4-0 / 5-0 / 6-0 / 7-0) - 10 UNIDADES DE CADA NÚMERO / POLIGLACTINA (VICRYL) (0 / 2-0 / 3-0) - 10 UNIDADES DE CADA NÚMERO / POLIÉSTER (ETHIBOND) COM ALMOFADA DE TEFLON (2-0) - 60 UNIDADES / FIO DE AÇO Nº 5 - 10 UNIDADES / FIO DE MARCAPASSO PROVISÓRIO - 02 UNIDADES / FITA CARDÍACA - 04 UNIDADES / POLIGLACTINA INCOLOR (VICRYL) (3-0) 10 UNIDADES",
    bist_eletrico: "X",
    torre_video: "X",
    ultrassom: "X",
    tca: "X",
    eco_trans: "X"
};

export const OPCOES_CIRURGIA_PROPOSTA_MARCAPASSO = [
    {
        id: "implante_marcapasso_ddd",
        name: "Implante de marcapasso DDD",
        ...INSTRUMENTAL_MATERIAIS_MP_DDD
    },
    {
        id: "troca_gerador_marcapasso_ddd",
        name: "Troca de gerador marcapasso DDD",
        ...INSTRUMENTAL_MATERIAIS_MP_DDD
    },
    {
        id: "implante_cdi_multissitio",
        name: "Implante de CDI multissitio",
        ...INSTRUMENTAL_MATERIAIS_CDI_MULTISSITIO
    },
    {
        id: "troca_gerador_cdi_multissitio",
        name: "Troca de gerador de CDI multissitio",
        ...INSTRUMENTAL_MATERIAIS_CDI_MULTISSITIO
    }
];

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

export const OPCOES_CIRURGIA_PROPOSTA_CIRURGIA_CARDIACA = [
    {
        value: "0211020010_CCE",
        display: "CATETERISMO CARDIACO ESQUERDO (PRIORIZAÇÃO)",
        tuss: "0211020010",
        fullOriginalString: "0211020010;CATETERISMO CARDIACO ESQUERDO (CATETERISMO CARDIACO ESQUERDO)"
    },
    {
        value: "0211020010_CCD",
        display: "CATETERISMO CARDIACO DIREITO (PRIORIZAÇÃO)",
        tuss: "0211020010",
        fullOriginalString: "0211020010;CATETERISMO CARDIACO DIREITO (CATETERISMO CARDIACO DIREITO)"
    },
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
            label: "Diagnóstico (Marcapasso):",
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
            label: "Cirurgião:",
            tipo: "select",
            opcoes_dropdown: CIRURGIOES,
            placeholder_template_nome: "nome_cirurgiao",
            placeholder_template_crm: "crm_cirurgiao"
        }
    ],
    "Cirurgia Cardíaca": [
        {
            id: "detalhes_priorizacao_cc",
            label: "Condição Clínica (detalhes adicionais):",
            tipo: "textarea",
            placeholder_template: "condicao_clinica"
        },
        {
            id: "data_cirurgia_aviso_eletivo_cc",
            label: "Data da Cirurgia (Aviso Eletivo):",
            tipo: "date",
            placeholder_template: "data_cirurgia_aviso"
        },
        {
            id: "diagnostico_aviso_eletivo_cc",
            label: "Diagnóstico:",
            tipo: "text",
            placeholder_template: "diagnostico"
        },
        {
            id: "cirurgia_proposta_priorizacao_cc",
            label: "Cirurgia Proposta (Priorização):",
            tipo: "select",
            opcoes_dropdown: OPCOES_CIRURGIA_PROPOSTA_CIRURGIA_CARDIACA,
            placeholder_template: "cirurgia_proposta"
        },
        {
            id: "cirurgia_proposta_aviso_texto_cc",
            label: "Cirurgia Proposta (Aviso Eletivo):",
            tipo: "text",
            placeholder_template: "cirurgia_proposta_aviso"
        },
        {
            id: "data_cateterismo_cc",
            label: "Data do Cateterismo (Aviso Hemodinâmica):",
            tipo: "date",
            placeholder_template: "data_cateterismo"
        },
        {
            id: "cirurgiao_aviso_eletivo_cc",
            label: "Cirurgião:",
            tipo: "select",
            opcoes_dropdown: CIRURGIOES,
            placeholder_template_nome: "nome_cirurgiao",
            placeholder_template_crm: "crm_cirurgiao"
        }
    ],
    "Eletrofisiologia": [
        {
            id: "detalhes_priorizacao_ef",
            label: "Condição Clínica:",
            tipo: "textarea",
            placeholder_template: "condicao_clinica" // Alterado de "campo_personalizado"
        },
        {
            id: "data_cirurgia_aviso_eletivo_ef",
            label: "Data da Cirurgia:",
            tipo: "date",
            placeholder_template: "data_cirurgia"
        },
        {
            id: "cid_selecionado_ef",
            label: "CID:",
            tipo: "cid_custom_select",
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
            opcoes_dropdown: CIRURGIOES,
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
    btnLimparFormulario: "btnLimparFormulario",
    pacProntuario: "pacProntuario",
    pacNomeSocial: "pacNomeSocial",
    pacSexo: "pacSexo",
    pacNomeMae: "pacNomeMae",
    pacDataNascimento: "pacDataNascimento",
    pacCartaoSUS: "pacCartaoSUS",
    statusMessages: "statusMessages",
    outputLink: "outputLink",
    cidCustomTriggerSuffix: "_trigger",
    cidCustomPanelSuffix: "_panel",
    cidCustomSearchSuffix: "_search",
    cidCustomListSuffix: "_list",
    cidCustomLoadMoreSuffix: "_loadMore",
    cidCustomHiddenCodeSuffix: "_hiddenCode",
    cidCustomHiddenDescriptionSuffix: "_hiddenDescription"
};