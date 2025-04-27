import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',  // Backend tiny Oracle proxy
});

export default api;
