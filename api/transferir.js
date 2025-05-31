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

    // Adicionando timeout para a requisição
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos

    // 1. Buscar o contato e ticket pelo número
    const contatoResponse = await fetch(`${baseUrl}/v2/api/external/${externalApiKey}/showcontact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6MSwicHJvZmlsZSI6ImFkbWluIiwic2Vzc2lvbklkIjoxLCJpYXQiOjE3NDg2OTEyMDgsImV4cCI6MTgxMTc2MzIwOH0.ezipwNuzSjWD7sJufrmx78_38fOrrQtZytjTYx97BvU`,
      },
      body: JSON.stringify({ number: numero }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    // 2. Atualizar a fila
    const trocaFila = await fetch(`${baseUrl}/v2/api/external/${externalApiKey}/updatequeue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    
  } catch (error) {
    console.error('Erro interno:', error);
    
    // Tratamento específico para erros de conexão
    if (error.code === 'ENOTFOUND') {
      return res.status(502).json({
        message: 'Não foi possível conectar ao servidor remoto',
        error: `Falha na resolução DNS para ${error.hostname}`
      });
    }
    
    // Tratamento para timeout
    if (error.name === 'AbortError') {
      return res.status(504).json({
        message: 'Tempo limite de conexão excedido'
      });
    }

    return res.status(500).json({
      message: 'Erro interno no servidor',
      error: error.message
    });
  }
}
