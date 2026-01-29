import React, { useEffect, useState } from "react";

const BASE_URL = "http://localhost:8000"; // change if needed

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const userLocation = "kannur"; // or get from state / context

  useEffect(() => {
    fetch(`${BASE_URL}/alerts/by_location?location=${userLocation}`)
      .then(res => res.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(err => console.error(err));
  }, [userLocation]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Alerts</h2>

      {alerts.length === 0 ? (
        <p>No alerts for your location.</p>
      ) : (
        alerts.map((alert, index) => (
          <div
            key={index}
            style={{
              background: "#fee2e2",
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "8px"
            }}
          >
            <h4>{alert.title}</h4>
            <p>{alert.message}</p>
            <small>Location: {alert.location}</small>
          </div>
        ))
      )}
    </div>
  );
}

export default Alerts;
