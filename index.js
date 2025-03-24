const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

let client = null;
let qrCodeData = null; // Armazena o QR Code temporariamente

// Inicializa o cliente com persistência de sessão
client = new Client({
    authStrategy: new LocalAuth(), // Permite salvar a sessão
    puppeteer: {
        args: ['--no-sandbox'],
        headless: true // Mantém a execução sem abrir o navegador
    }
});

// Evento para gerar o QR Code
client.on('qr', async (qr) => {
    qrCodeData = qr;
    console.log('Novo QR Code gerado!');
});

// Evento quando a sessão é autenticada com sucesso
client.on('authenticated', () => {
    console.log('Autenticado com sucesso!');
});

// Evento quando a sessão falha ou expira
client.on('auth_failure', (msg) => {
    console.error('Falha na autenticação!', msg);
});

// Evento quando o cliente está pronto
client.on('ready', async () => {
    qrCodeData = null; // Limpa o QR code após conexão
    console.log('✅ Bot pronto e conectado!');
});

// Evento de erro global
client.on('error', (error) => {
    console.error('Erro no WhatsApp:', error);
});

// Inicia o cliente do WhatsApp
client.initialize();

// Rota para exibir o QR Code via API
app.get('/qrcode', async (req, res) => {
    if (qrCodeData) {
        try {
            const qrImage = await qrcode.toDataURL(qrCodeData);
            res.send(`<img src="${qrImage}">`);
        } catch (err) {
            res.status(500).send('Erro ao gerar QR Code');
        }
    } else {
        res.send('Já conectado ou QR Code não gerado no momento.');
    }
});

// Endpoint para enviar mensagem para um número específico
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
    }

    try {
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`; // Formata o número
        await client.sendMessage(formattedNumber, message);
        res.json({ success: true, message: `Mensagem enviada para ${number}` });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// Endpoint para enviar mensagem para um grupo
app.post('/send-group-message', async (req, res) => {
    const { groupId, message } = req.body;

    if (!groupId || !message) {
        return res.status(400).json({ error: 'ID do grupo e mensagem são obrigatórios' });
    }

    try {
        await client.sendMessage(groupId, message);
        res.json({ success: true, message: `Mensagem enviada para o grupo ${groupId}` });
    } catch (error) {
        console.error('Erro ao enviar mensagem para grupo:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem para grupo' });
    }
});

// Endpoint para listar grupos
app.get('/list-groups', async (req, res) => {
    try {
        const chats = await client.getChats();
        const groups = chats.filter(chat => chat.isGroup);
        
        const groupList = groups.map(group => ({
            name: group.name,
            id: group.id._serialized
        }));

        res.json({ success: true, groups: groupList });
    } catch (error) {
        console.error('Erro ao listar grupos:', error);
        res.status(500).json({ error: 'Erro ao listar grupos' });
    }
});

// Inicia o servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});