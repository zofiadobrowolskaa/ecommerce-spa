const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'inventory-order-service' });
});

app.listen(PORT, () => {
  // indicate pg service is running
  console.log(`inventory service (pg) listening on port ${PORT}`);
});