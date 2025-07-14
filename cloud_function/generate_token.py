import google_auth_oauthlib.flow

# Este script usa o client_secret.json para pedir a sua autorização.
flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
    'client_secret.json',
    scopes=['https://www.googleapis.com/auth/drive']
)

# Isto vai abrir uma janela no seu navegador para fazer login e autorizar.
credentials = flow.run_local_server(port=0)

# O refresh token é o que precisamos.
print("\n--- GUARDE ESTES 3 VALORES! VAMOS USÁ-LOS NO PRÓXIMO PASSO ---")
print(f"\n1. REFRESH_TOKEN:\n{credentials.refresh_token}")
print(f"\n2. CLIENT_ID:\n{credentials.client_id}")
print(f"\n3. CLIENT_SECRET:\n{credentials.client_secret}")