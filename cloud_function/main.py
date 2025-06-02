import os
import io
from datetime import datetime
import json
import traceback

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
# from googleapiclient.errors import HttpError # Pode ser útil para error handling mais específico

from docxtpl import DocxTemplate

IS_TEST_ENVIRONMENT = False # Mantenha True para testes locais, False para deploy
SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING = 'cloud_function/jesus-doc-generator-dee55c6191db.json'

PASTA_RAIZ_GERADOR_NOME = "Gerador de Documentos Médicos"
ID_PASTA_RAIZ_GERADOR_FIXO = "1uBlptVoSpPCqWkKKZB7wyyVq--tsJ1nf"

DOCUMENTOS_POR_SERVICO = {
    "Marcapassos": [
        {"nome_documento_logico": "Priorizacao_Marcapasso", "template_id": "1NpRDSnzqvarzjF_H2Ykg1hpxI61az-SiD4OUCnaPkvQ"},
        {"nome_documento_logico": "Aviso_Eletivo_Marcapasso", "template_id": "1mT8_xHTuuMn1uKkVae2_c8cH41PSavFuleqKLE6WxhE"}
    ],
    "Eletrofisiologia": [
        {"nome_documento_logico": "Lista_Material_Eletrofisiologia", "template_id": "1hSWY4TztveMj6Y7cduW_YBGg2FIRq5tM204RsH_oiQw"},
        {"nome_documento_logico": "Aviso_Hemodinamica_Eletrofisiologia", "template_id": "1AINdqy0i2YB-9p5zlLbbleqSVSKSjq0iY6RZTSv5IW4"},
        {"nome_documento_logico": "Priorizacao_Eletrofisiologia", "template_id": "1NpRDSnzqvarzjF_H2Ykg1hpxI61az-SiD4OUCnaPkvQ"}
    ],
    "Cirurgia Cardíaca": [
        # Certifique-se de que este ID e os outros sejam válidos e acessíveis pela conta de serviço.
        {"nome_documento_logico": "Aviso_Hemodinamica_Cirurgia_Cardiaca", "template_id": "1AINdqy0i2YB-9p5zlLbbleqSVSKSjq0iY6RZTSv5IW4"},
        {"nome_documento_logico": "Priorizacao_Cirurgia_Cardiaca", "template_id": "1NpRDSnzqvarzjF_H2Ykg1hpxI61az-SiD4OUCnaPkvQ"},
        {"nome_documento_logico": "Aviso_Eletivo_Cirurgia_Cardiaca", "template_id": "1mT8_xHTuuMn1uKkVae2_c8cH41PSavFuleqKLE6WxhE"}
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

def get_or_create_folder(service, folder_name, parent_folder_id=None, recreate_if_exists=False):
    query = f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}' and trashed=false"
    if parent_folder_id:
        query += f" and '{parent_folder_id}' in parents"

    response = service.files().list(q=query, spaces='drive', fields='files(id, name)', pageSize=1).execute()
    existing_files = response.get('files', [])

    if existing_files:
        folder_id = existing_files[0].get('id')
        if recreate_if_exists:
            print(f"Pasta '{folder_name}' (ID: {folder_id}) encontrada. Removendo para recriar...")
            try:
                service.files().delete(fileId=folder_id).execute()
                print(f"Pasta '{folder_name}' (ID: {folder_id}) removida com sucesso.")
            except Exception as e_delete:
                print(f"Erro ao remover a pasta '{folder_name}' (ID: {folder_id}): {e_delete}. Tentando criar uma nova de qualquer maneira.")
                # A criação prosseguirá; pode falhar se a pasta ainda existir e o nome colidir.
        else:
            print(f"Pasta '{folder_name}' encontrada com ID: {folder_id}. Usando existente.")
            return folder_id

    # Criar a pasta se não existia ou se foi (tentativa de) deletada
    print(f"Criando nova pasta '{folder_name}'...")
    file_metadata = {'name': folder_name, 'mimeType': 'application/vnd.google-apps.folder'}
    if parent_folder_id:
        file_metadata['parents'] = [parent_folder_id]
    
    try:
        folder = service.files().create(body=file_metadata, fields='id').execute()
        new_folder_id = folder.get('id')
        print(f"Pasta '{folder_name}' criada com ID: {new_folder_id}")
        return new_folder_id
    except Exception as e_create:
        print(f"Falha crítica ao criar pasta '{folder_name}': {e_create}")
        # Tenta encontrar novamente caso a exclusão tenha sido lenta e a pasta agora exista
        # ou se outra instância a criou nesse meio tempo.
        response_after_failed_create = service.files().list(q=query, spaces='drive', fields='files(id, name)', pageSize=1).execute()
        if response_after_failed_create.get('files', []):
            print(f"Pasta '{folder_name}' foi encontrada após falha na criação inicial. Usando-a.")
            return response_after_failed_create.get('files')[0].get('id')
        raise # Relança a exceção original se ainda não for encontrada.


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

    medico_info = dados_formulario.get('medico', {})
    context['nome_medico'] = medico_info.get('name', '')
    context['crm_medico'] = medico_info.get('crm', '')
    context['cpf_medico'] = medico_info.get('cpf', '')

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
            context['data_nascimento'] = data_nasc_str
            context['idade'] = ''
    else:
        context['data_nascimento'] = ''
        context['idade'] = ''

    sexo_paciente = paciente_info.get('sexo', '')
    if sexo_paciente == 'Feminino':
        context['F_sexo'] = 'X'
        context['M_sexo'] = ' '
    elif sexo_paciente == 'Masculino':
        context['F_sexo'] = ' '
        context['M_sexo'] = 'X'
    else:
        context['F_sexo'] = ' '
        context['M_sexo'] = ' '
    context['cartao_sus'] = paciente_info.get('cartao_sus', '')
    context['servico'] = dados_formulario.get('servico', {}).get('tipo', '')

    campos_dinamicos = dados_formulario.get('campos_dinamicos', {})
    for key, value in campos_dinamicos.items():
        context[key] = value

    if 'codigo_cid' in context and 'descricao_cid' in context : # Renomeia para o template se necessário
        context['cid_codigo'] = context.get('codigo_cid')
        context['cid_descricao'] = context.get('descricao_cid')


    datas_para_formatar = ['data_cirurgia', 'data_cirurgia_aviso']
    for campo_data in datas_para_formatar:
        if campo_data in context and isinstance(context[campo_data], str) and context[campo_data]:
            try:
                data_obj = datetime.strptime(context[campo_data], '%Y-%m-%d')
                context[campo_data] = data_obj.strftime('%d/%m/%Y')
            except ValueError:
                print(f"Alerta: Valor de data ('{context[campo_data]}') para o campo '{campo_data}' não está no formato YYYY-MM-DD ou é inválido.")

    hoje = datetime.now()
    context['hoje_dia'] = hoje.strftime('%d')
    context['hoje_mes'] = hoje.strftime('%m')
    context['hoje_ano'] = hoje.strftime('%Y')
    context['data_hoje'] = hoje.strftime('%d/%m/%Y')

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
             _id_pasta_raiz_gerador_cache = get_or_create_folder(drive_service, PASTA_RAIZ_GERADOR_NOME) # recreate_if_exists é False por padrão
        if not _id_pasta_raiz_gerador_cache: return (json.dumps({"sucesso": False, "erro": "Falha ao obter/criar pasta raiz."}), 500, headers)
        print(f"Usando ID da pasta raiz: {_id_pasta_raiz_gerador_cache}")

        timestamp = datetime.now().strftime("%Y-%m-%d")
        nome_paciente_subpasta = dados_formulario.get('paciente', {}).get('nome_social', 'PacienteDesconhecido').replace(' ', '_').replace('/', '_')
        nome_subpasta = f"{nome_paciente_subpasta}-{timestamp}"
        
        # A subpasta de execução será removida e recriada se já existir
        id_subpasta_execucao = get_or_create_folder(drive_service, nome_subpasta, 
                                                    parent_folder_id=_id_pasta_raiz_gerador_cache, 
                                                    recreate_if_exists=True) # Alterado aqui
        if not id_subpasta_execucao: return (json.dumps({"sucesso": False, "erro": "Falha ao criar subpasta de execução."}), 500, headers)

        links_documentos_gerados = []
        nome_paciente_arquivo = dados_formulario.get('paciente', {}).get('nome_social', 'PacienteDesconhecido').replace(' ', '_').replace('/', '_')

        for doc_info in documentos_a_gerar:
            nome_doc_logico = doc_info["nome_documento_logico"]
            template_id = doc_info["template_id"]
            if not template_id or template_id.startswith("SEU_ID_TEMPLATE_"): # Verificação de placeholder
                print(f"AVISO: ID do template para '{nome_doc_logico}' ({tipo_servico_selecionado}) não configurado ou inválido: '{template_id}'. Pulando.")
                continue
            print(f"\nProcessando documento: {nome_doc_logico} (Template ID: {template_id})")
            try:
                template_stream = download_template_from_drive(drive_service, template_id)
                documento_preenchido_stream = preencher_documento_docx(template_stream, dados_formulario, nome_doc_logico, tipo_servico_selecionado)
                nome_arquivo_final = f"{nome_doc_logico}_{nome_paciente_arquivo}_{timestamp}.docx"
                arquivo_criado = upload_documento_para_drive(drive_service, nome_arquivo_final, documento_preenchido_stream, id_subpasta_execucao)
                links_documentos_gerados.append({"nome_arquivo": nome_arquivo_final, "link_arquivo": arquivo_criado.get('webViewLink'), "id_arquivo": arquivo_criado.get('id')})
            except Exception as e_doc:
                print(f"Erro ao processar o documento '{nome_doc_logico}': {e_doc}")
                traceback.print_exc()
                # Considerar se deve retornar um erro parcial aqui ou continuar
        
        if not links_documentos_gerados and any(doc_info["template_id"].startswith("SEU_ID_TEMPLATE_") for doc_info in documentos_a_gerar):
             return (json.dumps({"sucesso": False, "erro": "Nenhum documento foi gerado. Verifique a configuração dos IDs de template."}), 500, headers)
        elif not links_documentos_gerados:
            return (json.dumps({"sucesso": False, "erro": "Nenhum documento foi gerado com sucesso. Verifique os logs da função."}), 500, headers)


        permissao = {'type': 'anyone', 'role': 'reader'}
        try:
            drive_service.permissions().create(fileId=id_subpasta_execucao, body=permissao, fields='id').execute()
        except Exception as e_perm:
            print(f"Aviso: Falha ao definir permissões públicas para a pasta {id_subpasta_execucao}: {e_perm}")
            # A função ainda pode retornar sucesso, mas a pasta pode não ser publicamente acessível

        pasta_info = drive_service.files().get(fileId=id_subpasta_execucao, fields='webViewLink').execute()
        link_pasta_compartilhada = pasta_info.get('webViewLink')

        response_data = {"sucesso": True, "mensagem": f"{len(links_documentos_gerados)} doc(s) processado(s).", "link_pasta_documento": link_pasta_compartilhada, "links_documentos": links_documentos_gerados}
        return (json.dumps(response_data, ensure_ascii=False), 200, headers)

    except FileNotFoundError as e_fnf: # Específico para SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING
        print(f"Erro de configuração: {e_fnf}"); traceback.print_exc()
        return (json.dumps({"sucesso": False, "erro": f"Erro de configuração do Service Account: {str(e_fnf)}"}), 500, headers)
    except Exception as e:
        print(f"Erro geral na Cloud Function: {e}"); traceback.print_exc()
        return (json.dumps({"sucesso": False, "erro": f"Erro interno do servidor: {str(e)}"}), 500, headers)

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
        if IS_TEST_ENVIRONMENT and (not SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING or not os.path.exists(SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING)):
            print(f"ERRO CONFIG: 'SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING' ('{SERVICE_ACCOUNT_FILE_PATH_FOR_TESTING}') não configurado ou arquivo não encontrado."); return

        mock_form_data_teste_cirurgia_cardiaca = {
            "medico": {
                "id": "2",
                "name": "Thaine Inacio Mendonça",
                "crm": "27066",
                "cpf": "70114148198"
            },
            "paciente": {
                "prontuario": "9993745",
                "nome_social": "José Martins",
                "sexo": "Masculino",
                "nome_mae": "Maria Ferreira",
                "data_nascimento": "1989-09-28",
                "cartao_sus": "517622766005437"
            },
            "servico": {
                "tipo": "Cirurgia Cardíaca"
            },
            "campos_dinamicos": {
                "condicao_clinica": "analise documento sistema documento medico paciente aleatorios aleatorios exemplo dados paciente aleatorios paciente aleatorios paciente sistema campo.",
                "data_cirurgia": "2025-11-03",
                "diagnostico": "Valor de Teste fgyFXdlN",
                "cirurgia_proposta": "analise medico dados sistema documento geracao geracao documento preenchimento documento aleatorios preenchimento analise dados documento teste aleatorios documento paciente teste.",
                "nome_cirurgiao": "Luiz Antonio",
                "crm_cirurgiao": "6873",
                "pre_operatorio": "TOMAR BANHO COM CLOREXIDINE DEGERMANTE, DEPILAÇÃO DO TÓRAX, ABDOME E MEMBROS INFERIORES",
                "instrumental_cirurgico": "CAIXA DA CIRURGIA CARDIOVASCULAR / CAIXAS DE COMPLEMENTO DE VÁLVULA / CAIXA DE CONECTORES PARA CEC / CAIXA DE PASSADORES DE FIO / KIT DE CIRCULAÇÃO EXTRACORPÓREA ADULTO / CÂNULAS DE AORTA E VEIA CAVA CURVA ARAMADAS / PATCH DE PERICÁRDIO BOVINO / PATCH INORGÂNICO / SURGICEL / GELFOAM / COLA CIRÚRGICA CARDIOVASCULAR (10 UNIDADES) / MANTA TÉRMICA / DRENO DE TÓRAX TUBULAR Nº 36 + COLETOR SELO D' ÁGUA (03 UNIDADES) / BISTURI LÂMINAS Nº 11, 15, 23 / JELCO Nº 14 (03 UNIDADES) / PRÓTESES DE VÁLVULA AÓRTICA MECÂNICA E BIOLÓGICA Nº  19, 21, 23, 25, 27 / PRÓTESES DE VÁLVULA MITRAL MECÂNICA E BIOLÓGICA Nº 25, 27, 29, 31, 33 /  CLOREXIDINE DEGERMANTE (1 LITRO) E CLOREXIDINE ALCOÓLICO (1 LITRO) / FIO VERMELHO E PRETO PARA MARCAPASSO EXTERNO /  CATETER VENOSO CENTRAL DUPLO LÚMEN / KIT DE BALÃO INTRA-AÓRTICO / SONDA VESICAL  Nº 12, 14, 16 + COLETOR / PÁS DE DESFIBRILADOR INTERNO ADULTO/ PLACAS ADESIVAS PARA DESFIBRILADOR EXTERNO / MARCAPASSO EXTERNO / COMPRESSAS ESTÉREIS / KIT PARA DEGERMAÇÃO / KIT SONDAGEM VESICAL / COXIM PARA TÓRAX / SCALP Nº 23 (02 UNIDADES) / ",
                "materiais_consignados": "NÃO",
                "empresa_consignados": "NÃO",
                "fios_cirurgicos": "NYLON (3-0 / 4-0) - 10 UNIDADES DE CADA NÚMERO / ALGODÃO NÃO-AGULHADO (2-0 / 4-0) - 5 UNIDADES DE CADA NÚMERO / ALGODÃO AGULHADO (2-0) 10 UNIDADES / POLIPROPILENO (PROLENE) (3-0 / 4-0 / 5-0 / 6-0 / 7-0) - 10 UNIDADES DE CADA NÚMERO / POLIGLACTINA (VICRYL) (0 / 2-0 / 3-0) - 10 UNIDADES DE CADA NÚMERO / POLIÉSTER (ETHIBOND) COM ALMOFADA DE TEFLON (2-0) - 60 UNIDADES / FIO DE AÇO Nº 5 - 10 UNIDADES / FIO DE MARCAPASSO PROVISÓRIO - 02 UNIDADES / FITA CARDÍACA - 04 UNIDADES / POLIGLACTINA INCOLOR (VICRYL) (3-0) 10 UNIDADES",
                "bist_eletrico": "X",
                "torre_video": "X",
                "ultrassom": "X",
                "tca": "X",
                "eco_trans": "X"
            },
            "pedidos_exames": [
                "Raio-X de Torax Pa e Perfil"
            ]
        }
        
        mock_form_data_teste = mock_form_data_teste_cirurgia_cardiaca # Escolha o mock_data para testar
        
        serv_teste = mock_form_data_teste["servico"]["tipo"]
        documentos_configurados = DOCUMENTOS_POR_SERVICO.get(serv_teste, [])
        if not documentos_configurados: 
            print(f"ERRO CONFIG: Nenhum doc para '{serv_teste}'."); return
        
        ids_templates_ok = True
        for doc_cfg in documentos_configurados:
            if not doc_cfg["template_id"] or doc_cfg["template_id"].startswith("SEU_ID_TEMPLATE_"):
                print(f"ERRO CONFIG: ID do template para '{doc_cfg['nome_documento_logico']}' ('{serv_teste}') não configurado ou inválido: '{doc_cfg['template_id']}'.")
                ids_templates_ok = False
        if not ids_templates_ok: return

        print(f"\nDados para teste (Serviço: {serv_teste}):\n{json.dumps(mock_form_data_teste, indent=2, ensure_ascii=False)}")
        request_simulada = MockRequest(json_data=mock_form_data_teste)
        print("\nChamando gerar_documento_http...")
        corpo_resposta, codigo_status, headers_resposta = gerar_documento_http(request_simulada)
        print(f"\n--- RESULTADO TESTE LOCAL ---"); print(f"Status: {codigo_status}"); print(f"Headers: {headers_resposta}")
        try:
            dados_resposta = json.loads(corpo_resposta)
            print(f"Corpo (JSON):\n{json.dumps(dados_resposta, indent=2, ensure_ascii=False)}")
            if codigo_status == 200 and dados_resposta.get("sucesso"): print("\n===> TESTE LOCAL BEM-SUCEDIDO! <===")
            else: print("\n===> TESTE LOCAL FALHOU OU COM ERRO. <===")
        except json.JSONDecodeError: print(f"Corpo (Texto):\n{corpo_resposta}"); print("\n===> TESTE FALHOU (resposta não JSON). <===")

    run_local_test()