import os
import io
from datetime import datetime
import json
import traceback 

from google.oauth2 import service_account 
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from googleapiclient.errors import HttpError 

from docxtpl import DocxTemplate

IS_TEST_ENVIRONMENT = True 
SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING = 'cloud_function\jesus-doc-generator-fc5cb335625d.json'

PASTA_RAIZ_GERADOR_NOME = "Gerador de Documentos Médicos"
ID_PASTA_RAIZ_GERADOR_FIXO = "1uBlptVoSpPCqWkKKZB7wyyVq--tsJ1nf"

CIRURGIOES_AUXILIARES_MAP = {
    'luiz_antonio_aux': {"name": "Luiz Antonio", "crm": "6873"},
    'guilherme_brasil_aux': {"name": "Guilherme Brasil", "crm": "29479"},
    'marcos_vargas_aux': {"name": "Marcos Vargas Aleixo", "crm": "5745"}
}

# Mapeamento dos IDs dos campos dinâmicos do frontend para os placeholders nos templates.
MAPEAMENTO_FRONTEND_TEMPLATE = {
    # Priorização (geral)
    "detalhes_priorizacao_mp": "condicao_clinica",
    "detalhes_priorizacao_cc": "condicao_clinica",
    "detalhes_priorizacao_ef": "condicao_clinica",

    # Aviso Eletivo - Marcapasso
    "data_cirurgia_aviso_eletivo_mp": "data_cirurgia_aviso",
    "diagnostico_aviso_eletivo_mp": "diagnostico_aviso",
    "cirurgia_proposta_aviso_eletivo_mp": "cirurgia_proposta_aviso", # O valor será o texto do dropdown
    "cirurgiao_aviso_eletivo_mp": { 
        "nome": "nome_cirurgiao_aviso", 
        "crm": "crm_cirurgiao_aviso"    
    },
    # Aviso Eletivo - Cirurgia Cardíaca
    "data_cirurgia_aviso_eletivo_cc": "data_cirurgia_aviso",
    "diagnostico_aviso_eletivo_cc": "diagnostico_aviso",
    "cirurgia_proposta_aviso_eletivo_cc": "cirurgia_proposta_aviso", # Valor do textarea
    "cirurgiao_aviso_eletivo_cc": {
        "nome": "nome_cirurgiao_aviso",
        "crm": "crm_cirurgiao_aviso"
    },
    # Aviso Eletivo - Eletrofisiologia
    "data_cirurgia_aviso_eletivo_ef": "data_cirurgia_aviso",
    "diagnostico_aviso_eletivo_ef": "diagnostico_aviso",
    "cirurgia_proposta_aviso_eletivo_ef": "cirurgia_proposta_aviso", # O valor será o texto do dropdown
    "cirurgiao_aviso_eletivo_ef": { 
        "nome": "nome_cirurgiao_aviso", 
        "crm": "crm_cirurgiao_aviso"    
    },
}

# Valores fixos para campos específicos do template "Aviso Eletivo"
VALORES_FIXOS_AVISO_ELETIVO = {
    "Marcapassos": { #DDD
        "instrumental_cirurgico_aviso": "CAIXA DE MARCA-PASSO DDD ; FIOS DE NYLON; CAIXA DE MARCA-PASSO; GERADOR DE MARCA-PASSO DDD (COMUNICAR PROGRAMADOR – BOSTON - PROPONENT MRI)",
        "materiais_consignados_aviso": "CAIXA DE MARCA-PASSO DDD ; FIOS DE NYLON; CAIXA DE MARCA-PASSO; GERADOR DE MARCA-PASSO DDD (COMUNICAR PROGRAMADOR – BOSTON - PROPONENT MRI)"
    },
    "Eletrofisiologia": {
        "preparo_pre_operatorio_aviso": "TOMAR BANHO COM CLOREXIDINE DEGERMANTE, DEPILAÇÃO DO TÓRAX, ABDOME E MEMBROS INFERIORES",
        "instrumental_cirurgico_aviso": "CAIXA DA CIRURGIA CARDIOVASCULAR / CAIXAS DE COMPLEMENTO DE VÁLVULA / CAIXA DE CONECTORES PARA CEC / CAIXA DE PASSADORES DE FIO / KIT DE CIRCULAÇÃO EXTRACORPÓREA ADULTO / CÂNULAS DE AORTA E VEIA CAVA CURVA ARAMADAS / PATCH DE PERICÁRDIO BOVINO / PATCH INORGÂNICO / SURGICEL / GELFOAM / COLA CIRÚRGICA CARDIOVASCULAR (10 UNIDADES) / MANTA TÉRMICA / DRENO DE TÓRAX TUBULAR Nº 36 + COLETOR SELO D' ÁGUA (03 UNIDADES) / BISTURI LÂMINAS Nº 11, 15, 23 / JELCO Nº 14 (03 UNIDADES) / PRÓTESES DE VÁLVULA AÓRTICA MECÂNICA E BIOLÓGICA Nº 19, 21, 23, 25, 27 / PRÓTESES DE VÁLVULA MITRAL MECÂNICA E BIOLÓGICA Nº 25, 27, 29, 31, 33 / CLOREXIDINE DEGERMANTE (1 LITRO) E CLOREXIDINE ALCOÓLICO (1 LITRO) / FIO VERMELHO E PRETO PARA MARCAPASSO EXTERNO / CATETER VENOSO CENTRAL DUPLO LÚMEN / KIT DE BALÃO INTRA-AÓRTICO / SONDA VESICAL Nº 12, 14, 16 + COLETOR / PÁS DE DESFIBRILADOR INTERNO ADULTO/ PLACAS ADESIVAS PARA DESFIBRILADOR EXTERNO / MARCAPASSO EXTERNO / COMPRESSAS ESTÉREIS / KIT PARA DEGERMAÇÃO / KIT SONDAGEM VESICAL / COXIM PARA TÓRAX / SCALP Nº 23 (02 UNIDADES) /",
        "materiais_consignados_aviso": "NÃO"
    }
    # Cirurgia Cardíaca pode ter seus próprios valores fixos se necessário
}


DOCUMENTOS_POR_SERVICO = {
    "Marcapassos": [
        {"nome_documento_logico": "Priorizacao_Marcapasso", "template_id": "1lD1VC6g2KlyWYB0nQOBWgevSqOAfQfwea3Bojnek06c"},
        {"nome_documento_logico": "Aviso_Eletivo_Marcapasso", "template_id": "16QJzBhnHMYuifNk7gotMshQPRbDos-hB7_1DauoIa0U"}
    ],
    "Cirurgia Cardíaca": [
        {"nome_documento_logico": "Priorizacao_Cirurgia_Cardiaca", "template_id": "17r4EoIv2wh8bGsrcqyvib5BwtLZ19v0b2EtUtrs7wgs"},
        {"nome_documento_logico": "Aviso_Eletivo_Cirurgia_Cardiaca", "template_id": "1Q-3CPv-tB7UA6Ixz6R8VA1TohH5BoyaPmatFIKxGb9s"},
        {"nome_documento_logico": "Aviso_Hemodinamica_Cirurgia_Cardiaca", "template_id": "1Qq-wyZUY7DdOaDI-ultr1QksCgTYgpL_Bfxfy6LLG94"}
    ],
    "Eletrofisiologia": [
        {"nome_documento_logico": "Priorizacao_Eletrofisiologia", "template_id": "1ceMw3-SdGZREUCzcGvGL99uPQ5W3AxySb5O4XVQmlHM"},
        {"nome_documento_logico": "lista_material_eletrofisiologia", "template_id": "1hSWY4TztveMj6Y7cduW_YBGg2FIRq5tM204RsH_oiQw"},
        {"nome_documento_logico": "Aviso_Hemodinamica_Eletrofisiologia", "template_id": "1AINdqy0i2YB-9p5zlLbbleqSVSKSjq0iY6RZTSv5IW4"}
    ]
}
_id_pasta_raiz_gerador_cache = ID_PASTA_RAIZ_GERADOR_FIXO

def get_drive_service():
    creds = None
    if IS_TEST_ENVIRONMENT:
        print(f"MODO DE TESTE LOCAL: Usando Service Account File: '{SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING}'")
        if not os.path.exists(SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING):
            raise FileNotFoundError(f"Arquivo da chave da SA não encontrado: '{SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING}'.")
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING, scopes=['https://www.googleapis.com/auth/drive']
        )
    else: 
        print("MODO DE PRODUÇÃO/CLOUD: Usando Application Default Credentials (ADC).")
        from google.auth import default as default_creds
        creds, project = default_creds(scopes=['https://www.googleapis.com/auth/drive'])
        print(f"Credenciais ADC obtidas para o projeto: {project or 'Não especificado'}.")
    if not creds: raise Exception("Falha ao obter credenciais.")
    return build('drive', 'v3', credentials=creds, cache_discovery=False)

def get_or_create_folder(service, folder_name, parent_folder_id=None):
    query = f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}' and trashed=false"
    if parent_folder_id: query += f" and '{parent_folder_id}' in parents"
    response = service.files().list(q=query, spaces='drive', fields='files(id, name)', pageSize=1).execute()
    if response.get('files', []):
        folder_id = response.get('files')[0].get('id')
        print(f"Pasta '{folder_name}' encontrada com ID: {folder_id}")
        return folder_id
    else: 
        print(f"Pasta '{folder_name}' não encontrada. Criando...")
        file_metadata = {'name': folder_name, 'mimeType': 'application/vnd.google-apps.folder'}
        if parent_folder_id: file_metadata['parents'] = [parent_folder_id]
        folder = service.files().create(body=file_metadata, fields='id').execute()
        folder_id = folder.get('id')
        print(f"Pasta '{folder_name}' criada com ID: {folder_id}")
        return folder_id

def download_template_from_drive(service, template_id):
    print(f"Iniciando download/export do template ID: {template_id}")
    fh = io.BytesIO()
    request_obj = service.files().export_media(fileId=template_id, mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    downloader = MediaIoBaseDownload(fh, request_obj)
    done = False
    while not done:
        status, done = downloader.next_chunk()
        if status: print(f"Download (export) template {int(status.progress() * 100)}%.")
    fh.seek(0)
    print("Template exportado e baixado como DOCX.")
    return fh

def preencher_documento_docx(template_content_stream, dados_formulario, nome_documento_logico, tipo_servico_selecionado):
    print(f"Iniciando preenchimento do template DOCX para: {nome_documento_logico} (Serviço: {tipo_servico_selecionado})")
    doc = DocxTemplate(template_content_stream)
    context = {} 
    
    medico_solicitante = dados_formulario.get('medico', {})
    context['nome_medico'] = medico_solicitante.get('name', '')
    context['crm_medico'] = medico_solicitante.get('crm', '')
    context['cpf_medico'] = medico_solicitante.get('cpf', '') 
    
    paciente_info = dados_formulario.get('paciente', {})
    context['nome_social'] = paciente_info.get('nome_social', '')
    context['prontuario'] = paciente_info.get('prontuario', '')
    context['nome_mae'] = paciente_info.get('nome_mae', '')
    data_nasc_str = paciente_info.get('data_nascimento', '')
    if data_nasc_str:
        try:
            data_nasc_obj = datetime.strptime(data_nasc_str, '%Y-%m-%d')
            context['data_nascimento'] = data_nasc_obj.strftime('%d/%m/%Y')
            hoje_calc = datetime.now()
            idade_calc = hoje_calc.year - data_nasc_obj.year - ((hoje_calc.month, hoje_calc.day) < (data_nasc_obj.month, data_nasc_obj.day))
            context['idade'] = str(idade_calc)
        except ValueError:
            context['data_nascimento'] = data_nasc_str; context['idade'] = ''
    else: context['data_nascimento'] = ''; context['idade'] = ''
    sexo_paciente = paciente_info.get('sexo', '')
    context['F_sexo'] = 'X' if sexo_paciente == 'Feminino' else ''
    context['M_sexo'] = 'X' if sexo_paciente == 'Masculino' else ''
    context['cartao_sus'] = paciente_info.get('cartao_sus', '')
    
    servico_info = dados_formulario.get('servico', {})
    context['servico'] = servico_info.get('tipo', '') 
    
    campos_dinamicos_recebidos = dados_formulario.get('campos_dinamicos', {})
    for id_frontend, placeholder_info in MAPEAMENTO_FRONTEND_TEMPLATE.items():
        if id_frontend in campos_dinamicos_recebidos:
            valor_frontend = campos_dinamicos_recebidos[id_frontend]
            if isinstance(placeholder_info, dict): 
                cirurgiao_aux_selecionado = CIRURGIOES_AUXILIARES_MAP.get(valor_frontend)
                if cirurgiao_aux_selecionado:
                    context[placeholder_info["nome"]] = cirurgiao_aux_selecionado["name"]
                    context[placeholder_info["crm"]] = cirurgiao_aux_selecionado["crm"]
                else: 
                    context[placeholder_info["nome"]] = "" # Ou o valor_frontend se quiser mostrar o ID
                    context[placeholder_info["crm"]] = ""
            elif isinstance(placeholder_info, str): 
                # Para dropdowns de "Cirurgia Proposta", o valor_frontend é o 'id' da opção.
                # Precisamos do texto da opção.
                # Isso requer que o frontend envie o texto ou que o backend tenha o mapa de opções.
                # Por simplicidade, se o ID do frontend corresponder a um dos campos de cirurgia proposta,
                # vamos buscar o texto da opção no config do frontend (que o backend não tem acesso direto).
                # SOLUÇÃO MELHOR: Enviar o texto selecionado do dropdown do frontend, ou mapear IDs para texto no backend.
                # Por agora, vamos assumir que o valor_frontend é o texto desejado se não for um select de cirurgião.
                # Se o placeholder_info for "cirurgia_proposta_aviso", o valor_frontend já é o texto da opção.
                
                # Se o placeholder_info for um dos campos de cirurgia proposta, o valor já é o texto.
                # Ex: id_frontend = "cirurgia_proposta_aviso_eletivo_mp" -> placeholder_info = "cirurgia_proposta_aviso"
                # O frontend já envia o texto selecionado para estes casos, pois não há um "map" para eles como há para cirurgiões.
                # Esta lógica assume que o frontend, ao coletar dados de selects que não são o de cirurgião,
                # já pega o TEXTO da opção selecionada se o `placeholder_template` for uma string simples.
                # Se o frontend envia o ID da opção, o backend precisaria de um mapa para converter ID em texto.
                # Vamos ajustar o frontend para enviar o texto da opção para 'cirurgia_proposta_...'

                if placeholder_info.startswith("data_") and valor_frontend: # Formatação de data
                     try:
                        data_obj = datetime.strptime(valor_frontend, '%Y-%m-%d')
                        context[placeholder_info] = data_obj.strftime('%d/%m/%Y')
                     except ValueError:
                        context[placeholder_info] = valor_frontend 
                else:
                    context[placeholder_info] = valor_frontend

    # Adicionar valores fixos se for um documento "Aviso_Eletivo"
    if "Aviso_Eletivo" in nome_documento_logico:
        valores_fixos_servico = VALORES_FIXOS_AVISO_ELETIVO.get(tipo_servico_selecionado, {})
        for placeholder_fixo, valor_fixo in valores_fixos_servico.items():
            context[placeholder_fixo] = valor_fixo
            print(f"Valor fixo para '{placeholder_fixo}': '{valor_fixo}'")

    hoje = datetime.now()
    context['hoje_dia'] = hoje.strftime('%d'); context['hoje_mes'] = hoje.strftime('%m'); context['hoje_ano'] = hoje.strftime('%Y')

    print(f"Contexto final para '{nome_documento_logico}': {json.dumps(context, indent=2, ensure_ascii=False)}")
    doc.render(context) 
    filled_doc_stream = io.BytesIO()
    doc.save(filled_doc_stream)
    filled_doc_stream.seek(0)
    print(f"Template DOCX '{nome_documento_logico}' preenchido.")
    return filled_doc_stream

def upload_documento_para_drive(service, nome_arquivo_final, filled_doc_stream, pasta_destino_id):
    print(f"Upload de '{nome_arquivo_final}' para pasta ID: {pasta_destino_id}")
    file_metadata = {'name': nome_arquivo_final, 'parents': [pasta_destino_id], 'mimeType': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
    media = MediaIoBaseUpload(filled_doc_stream, mimetype=file_metadata['mimeType'], resumable=True)
    file_obj = service.files().create(body=file_metadata, media_body=media, fields='id, webViewLink').execute()
    print(f"Arquivo '{nome_arquivo_final}' enviado com ID: {file_obj.get('id')}")
    return file_obj

def gerar_documento_http(request):
    headers = {'Access-Control-Allow-Origin': '*','Access-Control-Allow-Methods': 'POST, OPTIONS','Access-Control-Allow-Headers': 'Content-Type','Access-Control-Max-Age': '3600','Content-Type': 'application/json'}
    if request.method == 'OPTIONS': return ('', 204, headers)
    if request.method != 'POST': return (json.dumps({"sucesso": False, "erro": "Método não permitido."}), 405, headers)

    try:
        if 'application/json' not in request.headers.get('content-type', '').lower():
            return (json.dumps({"sucesso": False, "erro": "Tipo de conteúdo inválido."}), 415, headers)
        dados_formulario = request.get_json(silent=True)
        if not dados_formulario: return (json.dumps({"sucesso": False, "erro": "Requisição sem dados JSON."}), 400, headers)

        print(f"Dados recebidos: {json.dumps(dados_formulario, indent=2, ensure_ascii=False)}")
        tipo_servico_selecionado = dados_formulario.get('servico', {}).get('tipo')
        if not tipo_servico_selecionado: return (json.dumps({"sucesso": False, "erro": "Tipo de serviço não especificado."}), 400, headers)
        
        documentos_a_gerar = DOCUMENTOS_POR_SERVICO.get(tipo_servico_selecionado)
        if not documentos_a_gerar: return (json.dumps({"sucesso": False, "erro": f"Nenhuma config de doc para serviço: {tipo_servico_selecionado}."}), 404, headers)

        drive_service = get_drive_service()
        global _id_pasta_raiz_gerador_cache
        if not _id_pasta_raiz_gerador_cache: 
            _id_pasta_raiz_gerador_cache = get_or_create_folder(drive_service, PASTA_RAIZ_GERADOR_NOME)
        if not _id_pasta_raiz_gerador_cache: return (json.dumps({"sucesso": False, "erro": "Falha ao obter/criar pasta raiz."}), 500, headers)
        print(f"Usando ID da pasta raiz: {_id_pasta_raiz_gerador_cache}")

        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        nome_medico_safe = dados_formulario.get('medico', {}).get('name', 'MedicoDesconhecido').replace(' ', '_').replace('/', '_')
        nome_subpasta = f"{timestamp}_{nome_medico_safe}"
        id_subpasta_execucao = get_or_create_folder(drive_service, nome_subpasta, parent_folder_id=_id_pasta_raiz_gerador_cache)
        if not id_subpasta_execucao: return (json.dumps({"sucesso": False, "erro": "Falha ao criar subpasta de execução."}), 500, headers)

        links_documentos_gerados = []
        nome_paciente_safe = dados_formulario.get('paciente', {}).get('nome_social', 'PacienteDesconhecido').replace(' ', '_').replace('/', '_')

        for doc_info in documentos_a_gerar:
            nome_doc_logico = doc_info["nome_documento_logico"]
            template_id = doc_info["template_id"]
            if template_id.startswith("SEU_ID_TEMPLATE_"):
                print(f"AVISO: ID do template para '{nome_doc_logico}' ({tipo_servico_selecionado}) não configurado. Pulando.")
                continue 
            print(f"\nProcessando documento: {nome_doc_logico} (Template ID: {template_id})")
            try:
                template_stream = download_template_from_drive(drive_service, template_id)
                # Passar tipo_servico_selecionado para preencher_documento_docx
                documento_preenchido_stream = preencher_documento_docx(template_stream, dados_formulario, nome_doc_logico, tipo_servico_selecionado)
                nome_arquivo_final = f"{nome_doc_logico}_{nome_paciente_safe}_{timestamp}.docx"
                arquivo_criado = upload_documento_para_drive(drive_service, nome_arquivo_final, documento_preenchido_stream, id_subpasta_execucao)
                links_documentos_gerados.append({"nome_arquivo": nome_arquivo_final, "link_arquivo": arquivo_criado.get('webViewLink'), "id_arquivo": arquivo_criado.get('id')})
            except Exception as e_doc: 
                print(f"Erro ao processar o documento '{nome_doc_logico}': {e_doc}")
                traceback.print_exc()
        if not links_documentos_gerados: return (json.dumps({"sucesso": False, "erro": "Nenhum documento foi gerado com sucesso."}), 500, headers)

        permissao = {'type': 'anyone', 'role': 'reader'}
        drive_service.permissions().create(fileId=id_subpasta_execucao, body=permissao, fields='id').execute()
        pasta_info = drive_service.files().get(fileId=id_subpasta_execucao, fields='webViewLink').execute()
        link_pasta_compartilhada = pasta_info.get('webViewLink')

        response_data = {"sucesso": True, "mensagem": f"{len(links_documentos_gerados)} doc(s) processado(s).", "link_pasta_documento": link_pasta_compartilhada, "links_documentos": links_documentos_gerados}
        return (json.dumps(response_data, ensure_ascii=False), 200, headers)
    except Exception as e:
        print(f"Erro geral na Cloud Function: {e}"); traceback.print_exc() 
        return (json.dumps({"sucesso": False, "erro": f"Erro interno: {str(e)}"}), 500, headers)

if __name__ == '__main__':
    class MockRequest:
        def __init__(self, json_data, method='POST', headers=None):
            self.json_data = json_data; self.method = method; self.headers = headers or {'content-type': 'application/json'}
        def get_json(self, silent=False):
            if self.json_data is not None: return self.json_data
            if silent: return None
            raise ValueError("MockRequest: No JSON data.")

    def run_local_test():
        print("--- INICIANDO TESTE LOCAL DA CLOUD FUNCTION ---")
        if IS_TEST_ENVIRONMENT and SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING == 'caminho/para/seu/service_account_key.json':
            print("ERRO CONFIG: 'SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING' não alterado."); return
        
        # Teste para Marcapasso
        # mock_form_data_marcapasso = {
        #     "medico": {"id": "1", "name": "Matheus Henrique de Jesus Lima", "crm": "31548", "cpf": "70235523160"},
        #     "paciente": {"prontuario": "MP003", "nome_social": "Roberto Marcapasso Fixo", "sexo": "Masculino", "nome_mae": "Regina Fixo", "data_nascimento": "1955-07-02", "cartao_sus": "303030303030303"},
        #     "servico": {"tipo": "Marcapassos"}, 
        #     "campos_dinamicos": { 
        #         "detalhes_priorizacao_mp": "Prioridade alta para Marcapasso devido a bloqueio AV total.",
        #         "data_cirurgia_aviso_eletivo_mp": "2025-11-15",
        #         "diagnostico_aviso_eletivo_mp": "BAVT",
        #         "cirurgia_proposta_aviso_eletivo_mp": "implante_marcapasso_ddd", # ID da opção do dropdown
        #         "cirurgiao_aviso_eletivo_mp": "marcos_vargas_aux" 
        #     }
        # }
        
        # Teste para Eletrofisiologia
        mock_form_data_eletro = {
            "medico": {"id": "2", "name": "Thaine Inacio Mendonça", "crm": "27066", "cpf": "70114148198"},
            "paciente": {"prontuario": "EF001", "nome_social": "Clara Eletro Teste", "sexo": "Feminino", "nome_mae": "Sofia Eletro", "data_nascimento": "1970-02-20", "cartao_sus": "404040404040404"},
            "servico": {"tipo": "Eletrofisiologia"},
            "campos_dinamicos": {
                "detalhes_priorizacao_ef": "Necessidade de estudo eletrofisiológico e possível ablação.",
                "data_cirurgia_aviso_eletivo_ef": "2025-10-20",
                "diagnostico_aviso_eletivo_ef": "Taquicardia Supraventricular Refratária",
                "cirurgia_proposta_aviso_eletivo_ef": "implante_cdi", # ID da opção do dropdown
                "cirurgiao_aviso_eletivo_ef": "guilherme_brasil_aux"
            }
        }

        # Escolha qual teste rodar
        mock_form_data_teste = mock_form_data_eletro # Ou mock_form_data_eletro
        
        serv_teste = mock_form_data_teste["servico"]["tipo"]
        documentos_configurados = DOCUMENTOS_POR_SERVICO.get(serv_teste, [])
        if not documentos_configurados: print(f"ERRO CONFIG: Nenhum doc para '{serv_teste}'."); return
        for doc_cfg in documentos_configurados:
            if doc_cfg["template_id"].startswith("SEU_ID_TEMPLATE_"):
                print(f"ERRO CONFIG: ID do template para '{doc_cfg['nome_documento_logico']}' ('{serv_teste}') não configurado."); return

        print(f"\nDados para teste (Serviço: {serv_teste}):\n{json.dumps(mock_form_data_teste, indent=2, ensure_ascii=False)}")
        request_simulada = MockRequest(json_data=mock_form_data_teste)
        print("\nChamando gerar_documento_http...")
        corpo_resposta, codigo_status, headers_resposta = gerar_documento_http(request_simulada)
        print(f"\n--- RESULTADO TESTE LOCAL ---"); print(f"Status: {codigo_status}"); print(f"Headers: {headers_resposta}")
        try:
            dados_resposta = json.loads(corpo_resposta)
            print(f"Corpo (JSON):\n{json.dumps(dados_resposta, indent=2, ensure_ascii=False)}")
            if codigo_status == 200 and dados_resposta.get("sucesso"): print("\n===> TESTE LOCAL BEM-SUCEDIDO! <===")
            else: print("\n===> TESTE LOCAL FALHOU OU ERRO. <===")
        except json.JSONDecodeError: print(f"Corpo (Texto):\n{corpo_resposta}"); print("\n===> TESTE FALHOU (resposta não JSON). <===")
    run_local_test()
