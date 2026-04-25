const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// simple healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

app.listen(PORT, () => {
  // log service start
  console.log(`api gateway listening on port ${PORT}`);
});