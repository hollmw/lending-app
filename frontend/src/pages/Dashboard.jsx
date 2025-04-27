function Dashboard() {
    return (
      <div className="flex flex-col items-center p-8">
        <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
        <div className="flex space-x-4">
          <a href="/tokenize" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
            Tokenize New Asset
          </a>
        </div>
        {/* Later: Show Assets + Loans list */}
      </div>
    );
  }
  
  export default Dashboard;
  