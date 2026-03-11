const axios = require('axios');
axios.get('http://localhost:5173/api/transactions')
  .then(res => {
    console.log('STATUS:', res.status);
    console.log('DATA:', JSON.stringify(res.data, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILED:', err.response?.status, err.message);
    if (err.response?.data) console.log('ERROR DATA:', err.response.data);
    process.exit(1);
  });
