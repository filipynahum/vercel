export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { numero } = req.body;

  if (!numero || typeof numero !== 'string') {
    return res.status(400).json({ message: 'O campo "numero" precisa ser uma string' });
  }

  try {
    const BASE_URL = 'https://backend.cfcmais.com.br/v2/api/external/6c969e8a-b200-49af-97fc-fbd223267d48';
    
    // 1. Buscar o ticket com POST
    const buscaContato = await fetch(`${BASE_URL}/showcontact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Key': 'cfcmais-gpt'
      },
      body: JSON.stringify({ number: numero })
    });

    const contato = await buscaContato.json();

    if (!contato?.ticketId) {
      return res.status(404).json({ message: 'Ticket não encontrado.' });
    }

    // 2. Atualizar a fila
    const trocaFila = await fetch(`${BASE_URL}/updatequeue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Key': 'cfcmais-gpt'
      },
      body: JSON.stringify({
        ticketId: contato.ticketId,
        queueId: 5 // Fila de matrícula, por exemplo
      })
    });

    const resultado = await trocaFila.json();

    if (!trocaFila.ok) {
      return res.status(trocaFila.status).json({ message: 'Erro ao trocar de fila', resultado });
    }

    return res.status(200).json({
      message: 'Fila atualizada com sucesso',
      ticketId: contato.ticketId,
      resultado
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ message: 'Erro interno', error: error.message });
  }
}
