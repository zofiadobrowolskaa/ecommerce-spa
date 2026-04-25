const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'catalog-analytics-service' });
});

app.listen(PORT, () => {
  // indicate mongo service is running
  console.log(`catalog service (mongo) listening on port ${PORT}`);
});