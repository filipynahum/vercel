export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { numero } = req.body;

  if (!numero) {
    return res.status(400).json({ message: 'Número não enviado' });
  }

  try {
    const response = await fetch('https://backend.cfcmais.com.br/v2/api/external/6c969e8a-b200-49af-97fc-fbd223267d48', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6MSwicHJvZmlsZSI6ImFkbWluIiwic2Vzc2lvbklkIjoxLCJpYXQiOjE3NDg2OTEyMDgsImV4cCI6MTgxMTc2MzIwOH0.ezipwNuzSjWD7sJufrmx78_38fOrrQtZytjTYx97BvU',
        'Key': 'cfcmais-gpt'
      },
      body: JSON.stringify({
        number: numero,
        queue_id: 5,
        externalKey: 'cfcmais-gpt'
      })
    });

    const result = await response.json();

    return res.status(response.status).json(result);
  } catch (error) {
    console.error('Erro ao transferir:', error);
    return res.status(500).json({ message: 'Erro ao transferir atendimento', error: error.message });
  }
}
