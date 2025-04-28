import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tokenize from './pages/Tokenize';
import MyAssets from './components/MyAssets';
import MyLoans from './components/MyLoans';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tokenize" element={<Tokenize />} />
        <Route path="/my-assets" element={<MyAssets />} />
        <Route path="/my-loans" element={<MyLoans />} /> 
      </Routes>
    </Router>
  );
}

export default App;
