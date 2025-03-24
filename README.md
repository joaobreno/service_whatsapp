# WhatsApp Service

Este é um serviço que permite enviar mensagens via WhatsApp usando a biblioteca whatsapp-web.js. O serviço oferece endpoints para enviar mensagens para grupos e contatos individuais.

## Pré-requisitos

- Node.js (recomendado usar NVM para instalação)
- NPM (Node Package Manager)
- Um navegador instalado (Chrome, Firefox, etc.)
- Acesso a uma conta do WhatsApp via celular

## Instalação

### 1. Instalando Node.js via NVM

Windows:
```bash
# Baixe e instale o NVM para Windows em: https://github.com/coreybutler/nvm-windows/releases

# Verifique a instalação
nvm version

# Liste as versões disponíveis
nvm list available

# Instale a versão LTS mais recente
nvm install 22.14.0

# Use a versão instalada
nvm use 22.14.0
```

### 2. Instalando as dependências do projeto
*** Talvez precise de:
```bash
fnm env --use-on-cd | Out-String | Invoke-Expression
```

```bash
npm install whatsapp-web.js qrcode qrcode-terminal express
```

## Executando o Serviço

```bash
node index.js
```

## Autenticação

Existem duas formas de autenticar:

### 1. Via Terminal
O QR Code será exibido diretamente no terminal quando você iniciar o serviço.

### 2. Via Endpoint
Acesse o QR Code através do seguinte endpoint:

- **Visualizar QR Code**: 
  - Acesse `http://localhost:3000/qrcode` no navegador
  - O QR Code será exibido como uma imagem HTML
  - Se já estiver conectado ou o QR Code não estiver disponível, uma mensagem apropriada será exibida

## Endpoints Disponíveis

### 1. Visualizar QR Code
```bash
GET http://localhost:3000/qrcode
```
Retorna uma página HTML com a imagem do QR Code para autenticação.

### 2. Enviar Mensagem para Contato
```bash
POST http://localhost:3000/send-message
Content-Type: application/json

{
    "number": "5511999999999",
    "message": "Sua mensagem aqui"
}
```

### 3. Enviar Mensagem para Grupo
```bash
POST http://localhost:3000/send-group-message
Content-Type: application/json

{
    "groupId": "123456789-123456@g.us",
    "message": "Sua mensagem aqui"
}
```

### 4. Listar Grupos
```bash
GET http://localhost:3000/list-groups
```
Retorna um JSON com a lista de grupos e seus IDs.

## Exemplos de Uso

### Usando cURL

1. Enviar mensagem para contato:
```bash
curl -X POST http://localhost:3000/send-message \
-H "Content-Type: application/json" \
-d '{"number":"5511999999999","message":"Teste de mensagem"}'
```

2. Enviar mensagem para grupo:
```bash
curl -X POST http://localhost:3000/send-group-message \
-H "Content-Type: application/json" \
-d '{"groupId":"123456789-123456@g.us","message":"Teste de mensagem"}'
```

3. Listar grupos:
```bash
curl http://localhost:3000/list-groups
```

## Formatos

### Número de Telefone
- Deve incluir código do país e DDD
- Formato: [código do país][DDD][número]
- Exemplo: "5511999999999" (Brasil, DDD 11)

### Group ID
- Obtido através do endpoint `/list-groups`
- Formato: "123456789-123456@g.us"

## Solução de Problemas

1. **Erro de dependências**: 
   - Certifique-se de ter instalado todas as dependências
   - Em caso de erro, tente: `npm install` novamente

2. **QR Code não aparece**: 
   - Verifique se o serviço está rodando
   - Acesse o endpoint `/status` para verificar o estado atual

3. **Mensagem não enviada**: 
   - Verifique se o WhatsApp está conectado
   - Confirme se o número/grupo está no formato correto
   - Verifique se há conexão com a internet

## Notas Importantes

- O serviço precisa estar conectado à internet
- Mantenha o terminal aberto enquanto o serviço estiver em uso
- Uma nova autenticação pode ser necessária periodicamente
- O número de telefone usado deve ter uma conta WhatsApp ativa 