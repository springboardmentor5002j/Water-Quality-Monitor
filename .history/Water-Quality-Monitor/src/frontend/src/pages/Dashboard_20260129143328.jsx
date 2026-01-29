<div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
  <div className="max-w-7xl mx-auto grid grid-cols-[260px_1fr] gap-6 p-6">

    {/* ================= SIDEBAR ================= */}
    <aside className="bg-white rounded-2xl shadow-lg p-5 flex flex-col">
      <h2 className="text-2xl font-bold text-teal-700 mb-1">
        💧 Water Monitor
      </h2>
      <p className="text-xs text-gray-500 mb-6">Role: {role}</p>

      <nav className="space-y-2 flex-1">
        <button onClick={() => setShowTable("stations")} className="sidebar-btn">
          🚰 Water Stations
        </button>

        <button onClick={() => setShowTable("readings")} className="sidebar-btn">
          📊 Station Readings
        </button>

        <button onClick={fetchVerifiedReports} className="sidebar-btn">
          ✅ Verified Reports
        </button>

        <Link to="/reports/create" className="sidebar-btn">
          📝 Submit Report
        </Link>

        <Link to="/reports/my" className="sidebar-btn">
          📂 My Reports
        </Link>

        <Link
          to="/alerts"
          className="sidebar-btn bg-red-50 text-red-700 hover:bg-red-100"
        >
          🚨 Alerts ({alerts.length})
        </Link>

        <Link
          to="/historical"
          className="sidebar-btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        >
          📈 Historical Data
        </Link>
      </nav>

      <div className="text-xs text-center text-gray-400 mt-4">
        © Water Quality App
      </div>
    </aside>

    {/* ================= MAIN ================= */}
    <main className="bg-white rounded-2xl shadow-lg p-6">

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          value={userLocation}
          onChange={(e) => setUserLocation(e.target.value)}
          className="flex-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-400 outline-none"
          placeholder="Search location (city / area)"
        />
        <button
          onClick={() => geocodePlace(userLocation)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-semibold"
        >
          Search
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-red-600 font-bold mb-3 text-lg">
            🚨 Active Alerts
          </h3>
          {alerts.map((a) => (
            <div
              key={a.id}
              className="bg-red-50 border border-red-200 p-4 rounded-xl mb-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-red-700">
                  {a.type.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(a.issued_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-gray-700">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="h-[420px] rounded-2xl overflow-hidden shadow mb-6">
        <MapContainer center={center || [20, 77]} zoom={12} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater center={center} />

          {center && (
            <Marker position={center}>
              <Popup>{userLocation}</Popup>
            </Marker>
          )}

          {stations.map(
            (s) =>
              s.latitude &&
              s.longitude && (
                <Marker key={s.id} position={[s.latitude, s.longitude]}>
                  <Popup>
                    <b>{s.name}</b>
                    <br />
                    {s.location}
                  </Popup>
                </Marker>
              )
          )}
        </MapContainer>
      </div>

      {/* Tables */}
      {showTable === "stations" && <StationTable stations={stations} />}
      {showTable === "readings" && <ReadingTable stations={stations} />}
      {showTable === "reports" && (
        <VerifiedReportsTable
          reports={verifiedReports}
          loading={loadingReports}
        />
      )}
    </main>
  </div>
</div>
