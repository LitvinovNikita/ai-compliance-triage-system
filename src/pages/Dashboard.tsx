export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h1 className="text-xl font-bold mb-8">AI Compliance</h1>

        <nav className="space-y-4">
          <div className="hover:text-blue-400 cursor-pointer">Dashboard</div>
          <div className="hover:text-blue-400 cursor-pointer">Flagged Transactions</div>
          <div className="hover:text-blue-400 cursor-pointer">Accounts</div>
          <div className="hover:text-blue-400 cursor-pointer">Alerts</div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">

        <h2 className="text-2xl font-semibold mb-6">
          Transaction Monitoring
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">

          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">Transactions Today</p>
            <h3 className="text-2xl font-bold">124</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">Flagged</p>
            <h3 className="text-2xl font-bold text-red-500">8</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">High Risk</p>
            <h3 className="text-2xl font-bold text-orange-500">3</h3>
          </div>

        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow p-6">

          <h3 className="text-lg font-semibold mb-4">
            Recent Transactions
          </h3>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2">Account</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Risk</th>
              </tr>
            </thead>

            <tbody>

              <tr className="border-b">
                <td className="py-3">John Smith</td>
                <td>Amazon</td>
                <td>$120</td>
                <td>Completed</td>
                <td className="text-green-600">Low</td>
              </tr>

              <tr className="border-b">
                <td className="py-3">Maria Chen</td>
                <td>Crypto Exchange</td>
                <td>$4500</td>
                <td className="text-red-500">Flagged</td>
                <td className="text-orange-500">High</td>
              </tr>

            </tbody>

          </table>

        </div>

      </main>

    </div>
  );
}