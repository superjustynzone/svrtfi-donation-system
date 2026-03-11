const axios = require('axios');
axios.get('http://localhost:5000/api/transactions')
  .then(res => console.log('SUCCESS:', res.data.transactions?.length, 'txns found'))
  .catch(err => console.error('FAILED:', err.response?.status, err.message));
