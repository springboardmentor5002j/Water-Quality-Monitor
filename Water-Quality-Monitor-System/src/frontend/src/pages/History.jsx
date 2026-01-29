import { useEffect, useState } from "react";
import axios from "axios";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const location = "Hyderabad";
  const parameter = "pH";

  useEffect(() => {
    setLoading(true);

    axios
      .get("http://127.0.0.1:8000/readings/history/location", {
        params: { location, parameter }
      })
      .then((res) => {
        setHistory(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading history...</p>;

  return (
    <div>
      <h2>📈 Historical Water Quality Data</h2>

      {history.length === 0 ? (
        <p>No data available</p>
      ) : (
        <ul>
          {history.map((item, index) => (
            <li key={index}>
              {item.recorded_at} → <b>{item.value}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
