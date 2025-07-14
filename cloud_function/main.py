import os
import io
from datetime import datetime
import json
import traceback

import google.oauth2.credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from google.cloud import secretmanager

from docxtpl import DocxTemplate

# --- CONFIGURAÇÃO DOS SECRETS ---
# Certifique-se que o ID do seu projeto está correto.
# Pode encontrá-lo na página inicial da Google Cloud Console.
PROJECT_ID = "jesus-doc-generator"
REFRESH_TOKEN_SECRET_ID = "DRIVE_REFRESH_TOKEN"
CLIENT_ID_SECRET_ID = "DRIVE_CLIENT_ID"
CLIENT_SECRET_SECRET_ID = "DRIVE_CLIENT_SECRET"
# --- FIM DA CONFIGURAÇÃO ---

PASTA_RAIZ_GERADOR_NOME = "Gerador de Documentos Médicos"
ID_PASTA_RAIZ_GERADOR_FIXO = "1uBlptVoSpPCqWkKKZB7wyyVq--tsJ1nf" # ID da pasta principal no Drive

DOCUMENTOS_POR_SERVICO = {
    "Marcapassos": [
        {"nome_documento_logico": "Priorizacao_Marcapasso", "template_id": "1XqCtQtAcvKJidVzK272VDrU1ViujK7ijxXpkKTY5eYQ"},
        {"nome_documento_logico": "Aviso_Eletivo_Marcapasso", "template_id": "1mT8_xHTuuMn1uKkVae2_c8cH41PSavFuleqKLE6WxhE"}
    ],
    "Eletrofisiologia": [
        {"nome_documento_logico": "Lista_Material_Eletrofisiologia", "template_id": "1hSWY4TztveMj6Y7cduW_YBGg2FIRq5tM204RsH_oiQw"},
        {"nome_documento_logico": "Aviso_Hemodinamica_Eletrofisiologia", "template_id": "1AVDcc67hy7aaCcuNt1EYaJk25J2QErKyNwIoBsfGOiY"},
        {"nome_documento_logico": "Priorizacao_Eletrofisiologia", "template_id": "1XqCtQtAcvKJidVzK272VDrU1ViujK7ijxXpkKTY5eYQ"}
    ],
    "Cirurgia Cardíaca": [
        {"nome_documento_logico": "Aviso_Hemodinamica_Cirurgia_Cardiaca", "template_id": "1AVDcc67hy7aaCcuNt1EYaJk25J2QErKyNwIoBsfGOiY"},
        {"nome_documento_logico": "Priorizacao_Cirurgia_Cardiaca", "template_id": "1XqCtQtAcvKJidVzK272VDrU1ViujK7ijxXpkKTY5eYQ"},
        {"nome_documento_logico": "Aviso_Eletivo_Cirurgia_Cardiaca", "template_id": "1mT8_xHTuuMn1uKkVae2_c8cH41PSavFuleqKLE6WxhE"}
    ]
}
_id_pasta_raiz_gerador_cache = ID_PASTA_RAIZ_GERADOR_FIXO

TEMPLATE_ID_PEDIDO_EXAME = "1A3PGpgC3pkFl2Fr9j2-xUOylo8-8VlbyHf-TCvsC4Bo"

def get_secret(secret_id, version="latest"):
    """Busca um segredo do Google Secret Manager."""
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_id}/versions/{version}"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

def get_drive_service():
    """Cria o serviço do Drive usando o refresh token do Secret Manager."""
    print("MODO DE AUTENTICAÇÃO: OAuth 2.0 com Refresh Token do Utilizador.")
    try:
        refresh_token = get_secret(REFRESH_TOKEN_SECRET_ID)
        client_id = get_secret(CLIENT_ID_SECRET_ID)
        client_secret = get_secret(CLIENT_SECRET_SECRET_ID)

        creds = google.oauth2.credentials.Credentials(
            token=None,  # O access token será obtido automaticamente
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=client_id,
            client_secret=client_secret,
            scopes=['https://www.googleapis.com/auth/drive']
        )

        return build('drive', 'v3', credentials=creds, cache_discovery=False)
    except Exception as e:
        print(f"Falha crítica ao obter credenciais do Secret Manager: {e}")
        raise

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
        else:
            print(f"Pasta '{folder_name}' encontrada com ID: {folder_id}. Usando existente.")
            return folder_id

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
        response_after_failed_create = service.files().list(q=query, spaces='drive', fields='files(id, name)', pageSize=1).execute()
        if response_after_failed_create.get('files', []):
            print(f"Pasta '{folder_name}' foi encontrada após falha na criação inicial. Usando-a.")
            return response_after_failed_create.get('files')[0].get('id')
        raise

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

def preencher_documento_docx(template_content_stream, dados_formulario, nome_documento_logico, tipo_servico_logico_para_log):
    print(f"Iniciando preenchimento do template DOCX para: {nome_documento_logico} (Tipo lógico: {tipo_servico_logico_para_log})")
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
    context['F_sexo'] = 'X' if sexo_paciente == 'Feminino' else ' '
    context['M_sexo'] = 'X' if sexo_paciente == 'Masculino' else ' '

    context['cartao_sus'] = paciente_info.get('cartao_sus', '')
    context['servico'] = dados_formulario.get('servico', {}).get('tipo', tipo_servico_logico_para_log)

    campos_dinamicos = dados_formulario.get('campos_dinamicos', {})
    for key, value in campos_dinamicos.items():
        context[key] = value

    if 'codigo_cid' in context and 'descricao_cid' in context :
        context['cid_codigo'] = context.get('codigo_cid')
        context['cid_descricao'] = context.get('descricao_cid')
    if 'codigo_cid_cc' in context:
        context['codigo_cid_cc'] = context.get('codigo_cid_cc')

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

    print(f"Contexto para '{nome_documento_logico}': {json.dumps({k: v for k, v in context.items() if k not in ['instrumental_cirurgico', 'fios_cirurgicos']}, indent=2, ensure_ascii=False)}")
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

        drive_service = get_drive_service()
        global _id_pasta_raiz_gerador_cache
        if not _id_pasta_raiz_gerador_cache:
             _id_pasta_raiz_gerador_cache = get_or_create_folder(drive_service, PASTA_RAIZ_GERADOR_NOME)
        if not _id_pasta_raiz_gerador_cache: return (json.dumps({"sucesso": False, "erro": "Falha ao obter/criar pasta raiz."}), 500, headers)
        print(f"Usando ID da pasta raiz: {_id_pasta_raiz_gerador_cache}")

        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        nome_paciente_sanitizado = dados_formulario.get('paciente', {}).get('nome_social', 'PacienteDesconhecido').replace(' ', '_').replace('/', '_')
        nome_subpasta = f"{nome_paciente_sanitizado}-{timestamp}"

        id_subpasta_execucao = get_or_create_folder(drive_service, nome_subpasta,
                                                    parent_folder_id=_id_pasta_raiz_gerador_cache,
                                                    recreate_if_exists=False)
        if not id_subpasta_execucao: return (json.dumps({"sucesso": False, "erro": "Falha ao criar subpasta de execução."}), 500, headers)

        links_documentos_gerados = []
        nome_paciente_arquivo = nome_paciente_sanitizado

        documentos_a_gerar_servico = DOCUMENTOS_POR_SERVICO.get(tipo_servico_selecionado)
        if documentos_a_gerar_servico:
            for doc_info in documentos_a_gerar_servico:
                nome_doc_logico = doc_info["nome_documento_logico"]
                template_id = doc_info["template_id"]
                if not template_id or template_id.startswith("SEU_ID_TEMPLATE_"):
                    print(f"AVISO: ID do template para '{nome_doc_logico}' ({tipo_servico_selecionado}) não configurado ou inválido: '{template_id}'. Pulando.")
                    continue
                print(f"\nProcessando documento de serviço: {nome_doc_logico} (Template ID: {template_id})")
                try:
                    template_stream = download_template_from_drive(drive_service, template_id)
                    documento_preenchido_stream = preencher_documento_docx(template_stream, dados_formulario, nome_doc_logico, tipo_servico_selecionado)

                    nome_arquivo_final = f"{nome_doc_logico}_{nome_paciente_arquivo}_{timestamp}.docx"
                    arquivo_criado = upload_documento_para_drive(drive_service, nome_arquivo_final, documento_preenchido_stream, id_subpasta_execucao)
                    links_documentos_gerados.append({"nome_arquivo": nome_arquivo_final, "link_arquivo": arquivo_criado.get('webViewLink'), "id_arquivo": arquivo_criado.get('id')})
                except Exception as e_doc_servico:
                    print(f"Erro ao processar o documento de serviço '{nome_doc_logico}': {e_doc_servico}")
                    traceback.print_exc()
        else:
            print(f"Nenhuma configuração de documento encontrada para o serviço: {tipo_servico_selecionado}")

        pedidos_exames_selecionados = dados_formulario.get('pedidos_exames', [])
        if pedidos_exames_selecionados:
            nome_doc_logico_base_exame = "Pedido_Exame"
            print(f"\nProcessando Pedidos de Exame (Template ID: {TEMPLATE_ID_PEDIDO_EXAME})")
            try:
                template_fh_pedido_exame = download_template_from_drive(drive_service, TEMPLATE_ID_PEDIDO_EXAME)
                template_bytes_pedido_exame = template_fh_pedido_exame.getvalue()

                for nome_exame in pedidos_exames_selecionados:
                    print(f"Gerando Pedido para o exame: {nome_exame}")
                    current_template_stream_exame = io.BytesIO(template_bytes_pedido_exame)
                    dados_para_exame = json.loads(json.dumps(dados_formulario))
                    if 'campos_dinamicos' not in dados_para_exame:
                        dados_para_exame['campos_dinamicos'] = {}
                    dados_para_exame['campos_dinamicos']['exame_solicitado'] = nome_exame
                    nome_exame_sanitizado = nome_exame.replace(' ', '_').replace('/', '_').replace('(', '').replace(')','').replace(',','')
                    logical_doc_name_for_exam = f"{nome_doc_logico_base_exame}_{nome_exame_sanitizado}"

                    documento_preenchido_stream = preencher_documento_docx(current_template_stream_exame, dados_para_exame, logical_doc_name_for_exam, "Pedido_Exame_Geral")

                    nome_arquivo_final_exame = f"{nome_doc_logico_base_exame}_{nome_exame_sanitizado}_{nome_paciente_arquivo}_{timestamp}.docx"

                    arquivo_criado = upload_documento_para_drive(drive_service, nome_arquivo_final_exame, documento_preenchido_stream, id_subpasta_execucao)
                    links_documentos_gerados.append({"nome_arquivo": nome_arquivo_final_exame, "link_arquivo": arquivo_criado.get('webViewLink'), "id_arquivo": arquivo_criado.get('id')})
            except Exception as e_pedido_exame:
                print(f"Erro ao processar Pedidos de Exame: {e_pedido_exame}")
                traceback.print_exc()

        if not links_documentos_gerados :
             return (json.dumps({"sucesso": False, "erro": "Nenhum documento foi gerado. Verifique a configuração dos IDs de template ou seleções de exames."}), 500, headers)

        # --- INÍCIO DA ALTERAÇÃO ---
        # Define a permissão de EDITOR para qualquer pessoa com o link.
        permissao_editor = {'type': 'anyone', 'role': 'writer'}

        # Aplica a permissão à pasta que contém todos os documentos.
        try:
            print(f"Definindo permissão de editor para a pasta: {id_subpasta_execucao}")
            drive_service.permissions().create(fileId=id_subpasta_execucao, body=permissao_editor, fields='id').execute()
        except Exception as e_perm:
            print(f"Aviso: Falha ao definir permissões de editor para a pasta {id_subpasta_execucao}: {e_perm}")

        # Aplica a permissão a CADA documento gerado.
        for doc in links_documentos_gerados:
            try:
                doc_id = doc.get('id_arquivo')
                if doc_id:
                    print(f"Definindo permissão de editor para o documento: {doc.get('nome_arquivo')}")
                    drive_service.permissions().create(fileId=doc_id, body=permissao_editor, fields='id').execute()
            except Exception as e_perm_doc:
                print(f"Aviso: Falha ao definir permissões de editor para o documento {doc.get('nome_arquivo')}: {e_perm_doc}")
        # --- FIM DA ALTERAÇÃO ---

        pasta_info = drive_service.files().get(fileId=id_subpasta_execucao, fields='webViewLink').execute()
        link_pasta_compartilhada = pasta_info.get('webViewLink')

        response_data = {"sucesso": True, "mensagem": f"{len(links_documentos_gerados)} doc(s) processado(s).", "link_pasta_documento": link_pasta_compartilhada, "links_documentos": links_documentos_gerados}
        return (json.dumps(response_data, ensure_ascii=False), 200, headers)

    except Exception as e:
        print(f"Erro geral na Cloud Function: {e}"); traceback.print_exc()
        return (json.dumps({"sucesso": False, "erro": f"Erro interno do servidor: {str(e)}"}), 500, headers)