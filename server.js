// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(cors());

// Se for uma conta Manager (MCC), defina o ID sem hifens.
// Exemplo: "9201538227"
const MANAGER_ACCOUNT_ID = '9201538227';

// Exemplo de rota para listar os Customer IDs acessíveis
app.post('/listAccessibleCustomers', async (req, res) => {
  try {
    const { accessToken, developerToken } = req.body;
    
    const url = 'https://googleads.googleapis.com/v10/customers:listAccessibleCustomers';

    // Faz a requisição GET para a Google Ads API (conta gerente)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,   // Token OAuth
        'developer-token': developerToken,          // Seu Developer Token
        'login-customer-id': MANAGER_ACCOUNT_ID,    // ID da conta gerente (MCC)
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Erro ao listar customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use process.env.PORT para que o Railway atribua a porta correta
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
