const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(cors());

// Exemplo de endpoint que recebe dados e chama a Google Ads API
app.post('/getCampaignMetrics', async (req, res) => {
  try {
    const { accessToken, developerToken, customerId } = req.body;
    const url = `https://googleads.googleapis.com/v10/customers/${customerId}/googleAds:search`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.ctr, metrics.conversions, metrics.average_cpc, metrics.cost_micros FROM campaign WHERE campaign.status = 'ENABLED' LIMIT 50"
      }),
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Erro no backend:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
