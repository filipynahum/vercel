export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido' 
    });
  }

  // Validação do corpo da requisição
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ 
      success: false,
      message: 'Corpo da requisição inválido' 
    });
  }

  const { numero } = req.body;

  // Validação mais robusta do número
  if (!numero || typeof numero !== 'string' || !numero.trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'O campo "numero" precisa ser uma string não vazia' 
    });
  }

  try {
    // Configurações
    const token = process.env.API_TOKEN;
    const externalApiKey = process.env.EXTERNAL_API_KEY || '6c969e8a-b200-49af-97fc-fbd223267d48';
    const baseUrl = process.env.API_BASE_URL || 'https://backend.cfcmais.com.br';
    const targetQueueId = 5; // Fila de matrícula

    // Configuração do timeout (30 segundos para ambientes serverless)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    // Headers reutilizáveis
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 1. Buscar o contato e ticket pelo número
    const contatoResponse = await fetch(`${baseUrl}/v2/api/external/${externalApiKey}/showcontact`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ number: numero.trim() }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!contatoResponse.ok) {
      const errorData = await contatoResponse.json().catch(() => ({}));
      return res.status(contatoResponse.status).json({
        success: false,
        message: 'Erro ao buscar contato',
        apiError: errorData
      });
    }

    const contatoData = await contatoResponse.json();

    // Validação dos dados do contato
    if (!contatoData?.tickets || !Array.isArray(contatoData.tickets)) {
      return res.status(404).json({
        success: false,
        message: 'Contato ou tickets não encontrados'
      });
    }

    const ticketAberto = contatoData.tickets.find(t => t.status === 'open');

    if (!ticketAberto?.id) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum ticket aberto encontrado para este número'
      });
    }

    // 2. Atualizar a fila do ticket
    const trocaFilaResponse = await fetch(`${baseUrl}/v2/api/external/${externalApiKey}/updatequeue`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        ticketId: ticketAberto.id,
        queueId: targetQueueId
      }),
      signal: controller.signal
    });

    const resultado = await trocaFilaResponse.json();

    if (!trocaFilaResponse.ok) {
      return res.status(trocaFilaResponse.status).json({
        success: false,
        message: 'Erro ao trocar de fila',
        apiError: resultado
      });
    }

    // Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Atendimento transferido com sucesso para a fila de matrícula',
      ticketId: ticketAberto.id,
      queueId: targetQueueId,
      resultado
    });

  } catch (error) {
    console.error('Erro interno:', error);
    
    // Tratamento específico para erros de conexão
    if (error.code === 'ENOTFOUND') {
      return res.status(502).json({
        success: false,
        message: 'Não foi possível conectar ao servidor remoto',
        error: `Falha na resolução DNS para ${error.hostname}`
      });
    }
    
    // Tratamento para timeout
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'Tempo limite de conexão excedido (30 segundos)'
      });
    }

    // Erro genérico
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      error: error.message
    });
  }
}
