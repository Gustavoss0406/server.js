const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(cors());

// Exemplo de rota
app.post('/listAccessibleCustomers', async (req, res) => {
  try {
    const { accessToken, developerToken } = req.body;
    const url = 'https://googleads.googleapis.com/v10/customers:listAccessibleCustomers';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
      },
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Erro ao listar customers:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
