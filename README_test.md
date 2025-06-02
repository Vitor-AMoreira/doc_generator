# Gerador de Documentos Médicos

## Visão Geral

Esta aplicação Python com interface gráfica (GUI) visa auxiliar médicos na geração semi-automática de documentos clínicos (laudos, relatórios, etc.) com base nos dados do paciente e no tipo de serviço selecionado.

Atualmente, a interface coleta as informações necessárias e prepara a estrutura para a geração dos arquivos, mas a criação dos documentos `.docx` em si ainda precisa ser implementada.

## Funcionalidades Atuais

* **Interface Gráfica:** Utiliza `tkinter` para fornecer uma interface amigável.
* **Dados do Médico:**
    * Permite inserir Nome, CRM e Especialidade.
    * **Salva automaticamente** os dados do médico para uso futuro.
    * Botão para **limpar** os dados do médico salvos.
* **Dados do Paciente:** Formulário detalhado para inserir informações do paciente (Prontuário, Nome, Nascimento, Contatos, SUS, etc.).
* **Seleção de Serviço:** Permite escolher o tipo de procedimento médico (Cirurgia Cardíaca, Eletrofisiologia, Marcapassos).
* **Detalhes Clínicos:** Campos para inserir Diagnóstico, CID-10 e Histórico do Paciente.
* **Ação "Gerar Documentos":**
    * Coleta todos os dados inseridos.
    * Solicita ao usuário um local para salvar os documentos.
    * **Cria uma pasta** nesse local com o nome do paciente e/ou tipo de serviço.
    * **(Placeholder)** Exibe mensagens indicando quais documentos *seriam* gerados (a lógica de criação real ainda não está implementada).

## Estrutura do Projeto

O código está organizado em múltiplos arquivos para melhor manutenção:

* `main.py`: Ponto de entrada da aplicação.
* `app_gui.py`: Classe principal da janela da aplicação.
* `gui_components.py`: Define os diferentes painéis (frames) da interface.
* `data_manager.py`: Gerencia o salvamento e carregamento dos dados do médico.
* `doc_generator.py`: Contém as funções (atualmente placeholders) para a geração dos documentos.
* `config.py`: Armazena constantes e configurações (tipos de serviço, nomes de arquivos).
* `doctor_data.json`: Arquivo onde os dados do médico são persistidos (criado automaticamente).

## Requisitos

* Python 3.x
* `tkinter` (geralmente incluído na instalação padrão do Python)
* **(Futuro)** `python-docx` (será necessário para a geração real dos documentos `.docx`) - Para instalar: `pip install python-docx`

## Como Executar

1.  Certifique-se de ter o Python 3 instalado.
2.  Navegue até o diretório raiz do projeto (`medical_doc_generator`) via terminal ou prompt de comando.
3.  Execute o script principal:
    ```bash
    python main.py
    ```

## Próximos Passos

* Implementar a lógica de geração de arquivos `.docx` dentro das funções no arquivo `doc_generator.py` utilizando a biblioteca `python-docx`.
* Criar ou utilizar arquivos de modelo (`.docx`) para facilitar a formatação dos documentos gerados.
* Adicionar mais validações de dados nos formulários.
* Considerar a compilação para um executável (`.exe`) usando ferramentas como PyInstaller ou cx_Freeze.