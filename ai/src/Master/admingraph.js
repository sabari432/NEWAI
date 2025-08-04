// src/components/Dashboard/Dashboard.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import "./admingraph.css";

const DashboardCard = ({ title, value, extraInfo, chartData, onClick }) => (
  <div className="dashboard-card" onClick={onClick}>
    <div className="card-content">
      <h3 className="card-title">{title}</h3>
      <p className="card-value">{value}</p>
      {extraInfo && <p className="card-extra-info">{extraInfo}</p>}

      {chartData && chartData.length > 0 && (
        <div className="card-chart">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" hide />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="hours" fill="#FF6B3D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  </div>
);

// ✅ Raw Data Table Modal
const RawDataView = ({ title, data, onClose }) => (
  <div className="raw-data-overlay">
    <div className="raw-data-modal">
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="close-button" onClick={onClose}>&times;</button>
      </div>
      <div className="modal-content">
        {data && data.length > 0 ? (
          <table className="raw-data-table">
            <thead>
              <tr>{Object.keys(data[0]).map((key) => <th key={key}>{key}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p>No data available.</p>}
      </div>
    </div>
  </div>
);

function Dashboard() {
  const [stats, setStats] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch Data from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/teachergraph.php");
        if (response.data.success && Array.isArray(response.data.cards)) {
          setStats(response.data.cards);
        } else {
          console.warn("No cards data received. Using fallback.");
          setStats([
            { title: "Total Teachers", value: 10, extraInfo: "Active", chartData: [{ name: "Jan", hours: 5 }] },
            { title: "Active Schools", value: 3, extraInfo: "Online", chartData: [{ name: "Feb", hours: 7 }] }
          ]);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Loading Dashboard...</p>;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-header">Admin Dashboard</h2>

      <div className="dashboard-cards-grid">
        {stats.map((item, idx) => (
          <DashboardCard
            key={idx}
            title={item.title}
            value={item.value}
            extraInfo={item.extraInfo}
            chartData={item.chartData}
            onClick={() => setSelectedData(item.tableData || [])}
          />
        ))}
      </div>

      {selectedData && <RawDataView title="Detailed Data" data={selectedData} onClose={() => setSelectedData(null)} />}
    </div>
  );
}

export default Dashboard;
