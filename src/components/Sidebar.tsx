import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div style={{ width: 200, background: "#f3f3f3", padding: 20, height: "100vh" }}>
      <h2>Compliance Dashboard</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/transactions">Transactions</Link></li>
      </ul>
    </div>
  );
}