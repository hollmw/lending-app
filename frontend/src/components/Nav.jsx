import { Link } from 'react-router-dom';

function Nav() {
  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <div className="text-xl font-bold">DeFi Lending</div>
      <div className="flex space-x-4">
        <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
        <Link to="/tokenize" className="hover:text-gray-300">Tokenize</Link>
        <Link to="/my-assets" className="hover:text-gray-300">My Assets</Link>
        <Link to="/my-loans" className="hover:text-gray-300">My Loans</Link>
      </div>
    </nav>
  );
}

export default Nav;
