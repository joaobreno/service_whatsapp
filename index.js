const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

let client = null;
let qrCodeData = null; // Armazena o QR Code temporariamente
let botReady = false;

// Inicializa o cliente com persistência de sessão
client = new Client({
    authStrategy: new LocalAuth(), // Permite salvar a sessão
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--single-process',
            '--disable-extensions',
            '--memory-pressure-off',
            '--disable-features=Site-per-process',
            '--disable-software-rasterizer',
            '--disable-threaded-scrolling',
            '--disable-threaded-animation',
            '--js-flags="--max-old-space-size=499"', // Limita heap do Node
            '--disable-notifications',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows'
        ],
        headless: true,
        defaultViewport: {
            width: 800,
            height: 600
        },
        // Limitar uso de memória do Chromium
        executablePath: process.env.CHROME_BIN || null,
        pipe: true,
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

// Adicione esta função de limpeza periódica
function limparMemoria() {
    if (global.gc) {
        global.gc();
    }
    
    // Limpa variáveis não utilizadas
    qrCodeData = null;
}

// Evento quando o cliente está pronto
client.on('ready', async () => {
    qrCodeData = null;
    botReady = true;
    console.log('✅ Bot pronto e conectado!');
    // Executa limpeza a cada 10 minutos
    setInterval(limparMemoria, 10 * 60 * 1000);
});

// Adicione esta função para reinicializar o cliente
async function reinicializarCliente() {
    console.log('Tentando reinicializar o cliente...');
    try {
        await client.destroy();
        client.initialize();
    } catch (error) {
        console.error('Erro ao reinicializar:', error);
    }
}

// Modifique o evento de erro
client.on('error', async (error) => {
    console.error('Erro no WhatsApp:', error);
    if (error.message.includes('Session closed')) {
        await reinicializarCliente();
    }
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
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(formattedNumber, message);
        return res.json({ success: true, message: `Mensagem enviada para ${number}` });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return res.status(500).json({ 
            error: 'Erro ao enviar mensagem' 
        });
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

// Endpoint para reinicializar o cliente
app.post('/restart-session', async (req, res) => {
    try {
        limparMemoria();
        botReady = false;
        await reinicializarCliente();
        res.json({ result: true });
    } catch (error) {
        console.error('Erro ao reinicializar cliente:', error);
        res.json({ result: false });
    }
});

// Endpoint para verificar status do bot
app.get('/status-service', (req, res) => {
    console.log('Retorno status do bot: ', botReady);
    res.json({
        ready: botReady,
        needsQR: !!qrCodeData
    });
});

// Inicia o servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});