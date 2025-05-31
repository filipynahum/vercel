export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  console.log('req.body:', req.body);

  const { numero } = req.body;

  if (!numero || typeof numero !== 'string') {
    return res.status(400).json({ message: 'O campo "numero" precisa ser uma string' });
  }

  // Valida formato 55DDDNUMERO (ex: 5511999999999)
  if (!/^55\d{10,}$/.test(numero)) {
    return res.status(400).json({ message: 'Formato inválido. Use 55DDDNUMERO (ex: 5511999999999)' });
  }

  try {
    const response = await fetch('https://backend.cfcmais.com.br/v2/api/external/6c969e8a-b200-49af-97fc-fbd223267d48', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6MSwicHJvZmlsZSI6ImFkbWluIiwic2Vzc2lvbklkIjoxLCJpYXQiOjE3NDg2OTEyMDgsImV4cCI6MTgxMTc2MzIwOH0.ezipwNuzSjWD7sJufrmx78_38fOrrQtZytjTYx97BvU`, // Use variável de ambiente!
        'Key': 'cfcmais-gpt'
      },
      body: JSON.stringify({
        number: numero,
        queue_id: 5,
        externalKey: 'cfcmais-gpt'
      })
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (!response.ok) {
      return res.status(response.status).json({
        message: 'Falha na transferência',
        error: result
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao transferir:', error);
    return res.status(500).json({ 
      message: 'Erro interno ao transferir atendimento',
      error: error.message 
    });
  }
}
