export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { numero } = req.body;

  if (!numero || typeof numero !== 'string') {
    return res.status(400).json({ message: 'O campo "numero" precisa ser uma string' });
  }

  try {
    const token = process.env.API_TOKEN;
    const externalApiKey = '6c969e8a-b200-49af-97fc-fbd223267d48';
    const baseUrl = 'https://backend.cfcmais.com.br';

    // 1. Buscar o contato e ticket pelo número
    const contatoResponse = await fetch(`${baseUrl}/v2/api/external/${externalApiKey}/showcontact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ number: numero })
    });

    const contatoData = await contatoResponse.json();

    if (!contatoData || !contatoData.tickets || !Array.isArray(contatoData.tickets)) {
      return res.status(404).json({ message: 'Contato ou tickets não encontrados.' });
    }

    const ticketAberto = contatoData.tickets.find(t => t.status === 'open');

    if (!ticketAberto) {
      return res.status(404).json({ message: 'Nenhum ticket aberto encontrado para este número.' });
    }

    // 2. Trocar a fila do ticket
    const trocaFilaResponse = await fetch(`${baseUrl}/v2/api/external/${externalApiKey}/updatequeue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ticketId: ticketAberto.id,
        queueId: 5 // Fila de matrícula
      })
    });

    const resultado = await trocaFilaResponse.json();

    if (!trocaFilaResponse.ok) {
      return res.status(trocaFilaResponse.status).json({
        message: 'Erro ao trocar de fila',
        error: resultado
      });
    }

    return res.status(200).json({
      message: 'Atendimento transferido com sucesso para a fila de matrícula.',
      ticket: ticketAberto.id,
      resultado
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({
      message: 'Erro interno no servidor',
      error: error.message
    });
  }
}
