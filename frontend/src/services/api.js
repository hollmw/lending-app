import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',  // Backend tiny Oracle proxy
});

export default api;
