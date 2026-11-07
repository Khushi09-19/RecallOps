
import { useEffect, useState } from "react";
import axios from "axios";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Siren,
  BookOpen,
  Settings,
  Search,
  Bell,
  RefreshCw,
  Plus,
  ArrowLeft
} from "lucide-react";

import "./App.css";

const API = "http://localhost:5000";

// Initial incident form values
const initialFormData = {
  title: "",
  description: "",
  service_name: "",
  severity: "Medium",
  error_message: "",
  symptoms: ""
};

// Initial runbook form values
const initialRunbookData = {
  title: "",
  service_name: "",
  description: "",
  steps: ""
};


// ------------------------------------
// INCIDENT FORM
// ------------------------------------

function IncidentForm({
  onSubmit,
  onCancel,
  formData,
  handleChange,
  submitting
}) {
  return (
    <form onSubmit={onSubmit} className="incident-form">

      <div className="form-group">
        <label>Incident Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter incident title"
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the incident"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Service Name</label>
        <input
          type="text"
          name="service_name"
          value={formData.service_name}
          onChange={handleChange}
          placeholder="Example: Payment Service"
        />
      </div>

      <div className="form-group">
        <label>Severity</label>
        <select
          name="severity"
          value={formData.severity}
          onChange={handleChange}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      <div className="form-group">
        <label>Error Message</label>
        <textarea
          name="error_message"
          value={formData.error_message}
          onChange={handleChange}
          placeholder="Enter error message"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Symptoms</label>
        <textarea
          name="symptoms"
          value={formData.symptoms}
          onChange={handleChange}
          placeholder="Describe the symptoms"
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="refresh-button"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save Incident"}
        </button>
      </div>

    </form>
  );
}


// ------------------------------------
// INCIDENT LIST
// ------------------------------------

function IncidentContent({
  incidents,
  loading,
  error,
  loadIncidents,
  onIncidentClick
}) {
  if (loading) {
    return <div className="empty-state">Loading incidents...</div>;
  }

  if (error) {
    return (
      <div className="empty-state">
        <p>{error}</p>
        <button className="refresh-button" onClick={loadIncidents}>
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="empty-state">
        <Siren size={35} />
        <h3>No incidents recorded yet</h3>
        <p>Add your first incident to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>INCIDENT</th>
            <th>SERVICE</th>
            <th>SEVERITY</th>
            <th>STATUS</th>
            <th>CREATED</th>
          </tr>
        </thead>

        <tbody>
          {incidents.map((item) => (
            <tr
              key={item.id}
              onClick={() => onIncidentClick(item)}
              style={{ cursor: "pointer" }}
            >
              <td>
                <strong>
                  {item.title || item.description || `Incident #${item.id}`}
                </strong>
                <small>#{item.id}</small>
              </td>

              <td>{item.service_name || "Not provided"}</td>

              <td>
                <span
                  className={`severity ${(item.severity || "Medium").toLowerCase()}`}
                >
                  {item.severity || "Medium"}
                </span>
              </td>

              <td>{item.status || "OPEN"}</td>

              <td>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "Not available"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// ------------------------------------
// INCIDENT DETAILS
// ------------------------------------

function IncidentDetails({ incident, onBack }) {
  const [rootCause, setRootCause] = useState(incident.root_cause || "");
  const [resolution, setResolution] = useState(incident.resolution || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleResolve = async () => {
    if (!rootCause.trim() || !resolution.trim()) {
      setMessage("Please enter both root cause and resolution.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await axios.put(
        `http://localhost:5000/api/incidents/${incident.id}/resolve`,
        {
          root_cause: rootCause,
          resolution: resolution
        }
      );

      setMessage("Incident successfully marked as RESOLVED!");
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Unable to update incident."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="incident-panel">

      <button className="refresh-button" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to Incidents
      </button>

      <div className="panel-heading">
        <div>
          <h2>{incident.title || `Incident #${incident.id}`}</h2>
          <p>Incident ID: #{incident.id}</p>
        </div>

        <span className={`severity ${(incident.severity || "Medium").toLowerCase()}`}>
          {incident.severity || "Medium"}
        </span>
      </div>

      <div className="incident-details">
        <div>
          <strong>Service Name</strong>
          <p>{incident.service_name || "Not provided"}</p>
        </div>

        <div>
          <strong>Status</strong>
          <p>{incident.status || "OPEN"}</p>
        </div>

        <div>
          <strong>Description</strong>
          <p>{incident.description || "Not provided"}</p>
        </div>

        <div>
          <strong>Error Message</strong>
          <p>{incident.error_message || "Not provided"}</p>
        </div>

        <div>
          <strong>Symptoms</strong>
          <p>{incident.symptoms || "Not provided"}</p>
        </div>

        <div>
          <strong>Created At</strong>
          <p>
            {incident.created_at
              ? new Date(incident.created_at).toLocaleString()
              : "Not available"}
          </p>
        </div>
      </div>

      <div className="form-group">
        <label>Root Cause</label>
        <textarea
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          placeholder="Describe what caused this incident..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Resolution Steps</label>
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Describe how this incident was resolved..."
          rows={4}
        />
      </div>

      <button
        className="submit-button"
        onClick={handleResolve}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save & Mark as Resolved"}
      </button>

      {message && <p>{message}</p>}

      <div className="incident-details">
        <div>
          <strong>Previous Resolution Time</strong>
          <p>
            {incident.resolution_minutes != null
              ? `${incident.resolution_minutes} minutes`
              : "Not available"}
          </p>
        </div>
      </div>

    </section>
  );
}


// ------------------------------------
// MAIN APP
// ------------------------------------

function App() {

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  // Runbook states
  const [runbooks, setRunbooks] = useState([]);
  const [runbooksLoading, setRunbooksLoading] = useState(false);
  const [runbooksError, setRunbooksError] = useState("");
  const [showRunbookForm, setShowRunbookForm] = useState(false);
  const [runbookSubmitting, setRunbookSubmitting] = useState(false);
  const [runbookSuccess, setRunbookSuccess] = useState("");
  const [selectedRunbook, setSelectedRunbook] = useState(null);
  const [runbookFormData, setRunbookFormData] = useState(initialRunbookData);
  // Local Recall states
const [recallQuery, setRecallQuery] = useState("");
const [recallService, setRecallService] = useState("");
const [recallSymptoms, setRecallSymptoms] = useState("");
const [recallErrorMessage, setRecallErrorMessage] = useState("");

const [recallResults, setRecallResults] = useState([]);
const [recommendedRunbooks, setRecommendedRunbooks] = useState([]);
const [suggestedResolution, setSuggestedResolution] = useState("");
const [recallLoading, setRecallLoading] = useState(false);
const [recallError, setRecallError] = useState("");


  // ------------------------------------
  // LOAD INCIDENTS
  // ------------------------------------

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API}/api/incidents`);
      setIncidents(response.data);

    } catch (err) {
      console.error("Error loading incidents:", err);
      setError("Unable to load incidents. Please check the backend connection.");
    } finally {
      setLoading(false);
    }
  };


  // ------------------------------------
  // LOAD RUNBOOKS
  // ------------------------------------

  const loadRunbooks = async () => {
    try {
      setRunbooksLoading(true);
      setRunbooksError("");

      const response = await axios.get(`${API}/api/runbooks`);
      setRunbooks(response.data);

    } catch (err) {
      console.error("Error loading runbooks:", err);
      setRunbooksError("Unable to load runbooks. Please check the backend.");
    } finally {
      setRunbooksLoading(false);
    }
  };


  useEffect(() => {
    loadIncidents();
  }, []);


  // ------------------------------------
  // HANDLE INCIDENT FORM CHANGES
  // ------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };


  // ------------------------------------
  // SAVE INCIDENT
  // ------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setSuccess("");

      await axios.post(`${API}/api/incidents`, formData);

      setSuccess("Incident saved successfully!");
      setFormData(initialFormData);
      setShowForm(false);

      await loadIncidents();

    } catch (err) {
      console.error("Error saving incident:", err);

      alert(
        err.response?.data?.message ||
        "Unable to save incident. Please check the backend."
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ------------------------------------
  // HANDLE RUNBOOK FORM CHANGES
  // ------------------------------------

  const handleRunbookChange = (e) => {
    const { name, value } = e.target;

    setRunbookFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };


  // ------------------------------------
  // SAVE RUNBOOK TO MYSQL
  // ------------------------------------

  const handleRunbookSubmit = async (e) => {
    e.preventDefault();

    try {
      setRunbookSubmitting(true);
      setRunbookSuccess("");

      await axios.post(`${API}/api/runbooks`, runbookFormData);

      setRunbookSuccess("Runbook saved successfully!");
      setRunbookFormData(initialRunbookData);
      setShowRunbookForm(false);
      setSelectedRunbook(null);

      await loadRunbooks();

    } catch (err) {
      console.error("Error saving runbook:", err);

      alert(
        err.response?.data?.message ||
        "Unable to save runbook. Please check the backend."
      );
    } finally {
      setRunbookSubmitting(false);
    }
  };


  // ------------------------------------
  // OPEN INCIDENT DETAILS
  // ------------------------------------

  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
    setActivePage("Incidents");
    setShowForm(false);
  };


  // ------------------------------------
  // NAVIGATION
  // ------------------------------------

  const handleNavigation = (page) => {
    setActivePage(page);

    setSelectedIncident(null);
    setSelectedRunbook(null);

    setShowForm(false);
    setShowRunbookForm(false);

    setSuccess("");
    setRunbookSuccess("");

    if (page === "Runbooks") {
      loadRunbooks();
    }
  };
// ------------------------------------
// LOCAL RECALL SEARCH
// ------------------------------------

const handleRecallSearch = async (e) => {
  e.preventDefault();

  if (!recallQuery.trim()) {
    setRecallError("Please describe the incident.");
    return;
  }

  try {
    setRecallLoading(true);
    setRecallError("");
    setRecallResults([]);
    setSuggestedResolution("");
    setRecommendedRunbooks([]);

    const response = await axios.post(`${API}/api/recall`, {
      query: recallQuery,
      service_name: recallService,
      symptoms: recallSymptoms,
      error_message: recallErrorMessage
    });

    setRecallResults(response.data.matches || []);
    setRecommendedRunbooks(
  response.data.recommendedRunbooks || []
  );
    setSuggestedResolution(
      response.data.suggestedResolution || ""
    );

  } catch (err) {
    console.error("Recall search error:", err);
    setRecallError(
      err.response?.data?.message ||
      "Unable to search previous incidents. Check the backend."
    );
  } finally {
    setRecallLoading(false);
  }
};

  // ------------------------------------
  // DASHBOARD STATISTICS
  // ------------------------------------

  const totalIncidents = incidents.length;

  const openIncidents = incidents.filter(
    (item) => (item.status || "OPEN").toUpperCase() === "OPEN"
  ).length;

  const criticalIncidents = incidents.filter(
    (item) => (item.severity || "").toLowerCase() === "critical"
  ).length;

  const resolvedIncidents = incidents.filter(
    (item) => (item.status || "").toUpperCase() === "RESOLVED"
  ).length;


  // ------------------------------------
  // NAVIGATION ITEMS
  // ------------------------------------

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Incidents", icon: Siren },
    { name: "Runbooks", icon: BookOpen },
    { name: "AI Recommendations", icon: Activity },
    { name: "Settings", icon: Settings }
  ];


  // ------------------------------------
  // MAIN UI
  // ------------------------------------

  return (
    <div className="app-container">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <Activity size={28} />
          <h2>RecallOps</h2>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <nav>
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${activePage === item.name ? "active" : ""}`}
                onClick={() => handleNavigation(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p>RecallOps</p>
          <small>Incident Management System</small>
        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOP BAR */}

        <header className="topbar">
          <div className="topbar-left">
            <h2>{activePage}</h2>
            <p>Welcome to RecallOps</p>
          </div>

          <div className="topbar-right">
            <button className="icon-button">
              <Search size={19} />
            </button>

            <button className="icon-button">
              <Bell size={19} />
            </button>
          </div>
        </header>


        {/* PAGE CONTENT */}

        <div className="page-content">

          {/* DASHBOARD */}

          {activePage === "Dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <h2>Dashboard Overview</h2>
                  <p>Monitor and manage your incidents.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => {
                    setActivePage("Incidents");
                    setSelectedIncident(null);
                    setShowForm(true);
                  }}
                >
                  <Plus size={17} />
                  Add Incident
                </button>
              </div>


              {/* STATISTICS */}

              <div className="stats-grid">

                <div className="stat-card">
                  <div className="stat-icon">
                    <Activity size={23} />
                  </div>
                  <p>Total Incidents</p>
                  <h2>{totalIncidents}</h2>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Clock size={23} />
                  </div>
                  <p>Open Incidents</p>
                  <h2>{openIncidents}</h2>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <AlertTriangle size={23} />
                  </div>
                  <p>Critical Incidents</p>
                  <h2>{criticalIncidents}</h2>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <CheckCircle2 size={23} />
                  </div>
                  <p>Resolved Incidents</p>
                  <h2>{resolvedIncidents}</h2>
                </div>

              </div>


              {/* RECENT INCIDENTS */}

              <section className="incident-panel">

                <div className="panel-heading">
                  <div>
                    <h2>Recent Incidents</h2>
                    <p>Recently reported incidents</p>
                  </div>

                  <button className="refresh-button" onClick={loadIncidents}>
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>

                <IncidentContent
                  incidents={incidents}
                  loading={loading}
                  error={error}
                  loadIncidents={loadIncidents}
                  onIncidentClick={handleIncidentClick}
                />

                <button
                  className="text-button"
                  onClick={() => {
                    setSelectedIncident(null);
                    setActivePage("Incidents");
                  }}
                >
                  View all incidents
                </button>

              </section>
            </>
          )}


          {/* INCIDENTS PAGE */}

          {activePage === "Incidents" && (
            selectedIncident ? (
              <IncidentDetails
                incident={selectedIncident}
                onBack={() => setSelectedIncident(null)}
              />
            ) : (
              <section className="incident-panel">

                <div className="panel-heading">
                  <div>
                    <h2>All Incidents</h2>
                    <p>Manage and track reported incidents.</p>
                  </div>

                  <div className="panel-actions">
                    <button className="refresh-button" onClick={loadIncidents}>
                      <RefreshCw size={16} />
                      Refresh
                    </button>

                    <button
                      className="primary-button"
                      onClick={() => {
                        setShowForm(!showForm);
                        setSuccess("");
                      }}
                    >
                      <Plus size={17} />
                      {showForm ? "Close Form" : "Add Incident"}
                    </button>
                  </div>
                </div>

                {success && (
                  <p className="success-message">{success}</p>
                )}

                {showForm && (
                  <IncidentForm
                    onSubmit={handleSubmit}
                    onCancel={() => {
                      setShowForm(false);
                      setFormData(initialFormData);
                    }}
                    formData={formData}
                    handleChange={handleChange}
                    submitting={submitting}
                  />
                )}

                <IncidentContent
                  incidents={incidents}
                  loading={loading}
                  error={error}
                  loadIncidents={loadIncidents}
                  onIncidentClick={handleIncidentClick}
                />

              </section>
            )
          )}


          {/* RUNBOOKS PAGE */}

          {activePage === "Runbooks" && (

            <section className="incident-panel">

              {/* RUNBOOK DETAILS */}

              {selectedRunbook ? (

                <>
                  <button
                    className="refresh-button"
                    onClick={() => setSelectedRunbook(null)}
                  >
                    <ArrowLeft size={16} />
                    Back to Runbooks
                  </button>

                  <div className="panel-heading">
                    <div>
                      <h2>{selectedRunbook.title}</h2>
                      <p>{selectedRunbook.service_name}</p>
                    </div>
                  </div>

                  <div className="incident-details">
                    <div>
                      <strong>Description</strong>
                      <p>{selectedRunbook.description}</p>
                    </div>

                    <div>
                      <strong>Service Name</strong>
                      <p>{selectedRunbook.service_name}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: "25px" }}>
                    <h3>Troubleshooting Steps</h3>

                    <ol style={{ paddingLeft: "25px", lineHeight: "2" }}>
                      {(selectedRunbook.steps || "")
                        .split("\n")
                        .filter((step) => step.trim() !== "")
                        .map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                    </ol>
                  </div>
                </>

              ) : (

                <>

                  {/* RUNBOOK HEADER */}

                  <div className="panel-heading">
                    <div>
                      <h2>Runbooks</h2>
                      <p>Manage incident troubleshooting guides.</p>
                    </div>

                    <div className="panel-actions">

                      <button
                        className="refresh-button"
                        onClick={loadRunbooks}
                      >
                        <RefreshCw size={16} />
                        Refresh
                      </button>

                      <button
                        className="primary-button"
                        onClick={() => {
                          setShowRunbookForm(!showRunbookForm);
                          setRunbookSuccess("");
                        }}
                      >
                        <Plus size={17} />
                        {showRunbookForm ? "Close Form" : "Add Runbook"}
                      </button>

                    </div>
                  </div>


                  {/* SUCCESS MESSAGE */}

                  {runbookSuccess && (
                    <p className="success-message">
                      {runbookSuccess}
                    </p>
                  )}


                  {/* ADD RUNBOOK FORM */}

                  {showRunbookForm && (

                    <form
                      className="incident-form"
                      onSubmit={handleRunbookSubmit}
                    >

                      <h3>Add New Runbook</h3>

                      <div className="form-group">
                        <label>Runbook Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={runbookFormData.title}
                          onChange={handleRunbookChange}
                          placeholder="Example: Database Connection Failure"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Service Name *</label>
                        <input
                          type="text"
                          name="service_name"
                          value={runbookFormData.service_name}
                          onChange={handleRunbookChange}
                          placeholder="Example: Database Service"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Description *</label>
                        <textarea
                          name="description"
                          value={runbookFormData.description}
                          onChange={handleRunbookChange}
                          placeholder="Explain the problem this runbook helps solve"
                          rows="3"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Troubleshooting Steps *</label>
                        <textarea
                          name="steps"
                          value={runbookFormData.steps}
                          onChange={handleRunbookChange}
                          placeholder={"1. Check the service status\n2. Check the error logs\n3. Identify the problem\n4. Apply the solution\n5. Verify the service"}
                          rows="7"
                          required
                        />
                        <small>
                          Enter each troubleshooting step on a new line.
                        </small>
                      </div>

                      <div className="form-actions">

                        <button
                          type="button"
                          className="refresh-button"
                          onClick={() => {
                            setShowRunbookForm(false);
                            setRunbookFormData(initialRunbookData);
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="primary-button"
                          disabled={runbookSubmitting}
                        >
                          {runbookSubmitting ? "Saving..." : "Save Runbook"}
                        </button>

                      </div>

                    </form>

                  )}


                  {/* RUNBOOK LIST */}

                  {runbooksLoading ? (

                    <div className="empty-state">
                      Loading runbooks...
                    </div>

                  ) : runbooksError ? (

                    <div className="empty-state">
                      <p>{runbooksError}</p>

                      <button
                        className="refresh-button"
                        onClick={loadRunbooks}
                      >
                        <RefreshCw size={16} />
                        Try Again
                      </button>
                    </div>

                  ) : runbooks.length === 0 ? (

                    <div className="empty-state">
                      <BookOpen size={35} />
                      <h3>No runbooks available</h3>
                      <p>Add your first troubleshooting guide.</p>
                    </div>

                  ) : (

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                      marginTop: "25px"
                    }}>

                      {runbooks.map((runbook) => (

                        <div
                          key={runbook.id}
                          className="stat-card"
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedRunbook(runbook)}
                        >

                          <div className="stat-icon">
                            <BookOpen size={23} />
                          </div>

                          <h3>{runbook.title}</h3>

                          <p>
                            Service: {runbook.service_name}
                          </p>

                          <p>
                            {runbook.description}
                          </p>

                          <button className="text-button">
                            View Runbook →
                          </button>

                        </div>

                      ))}

                    </div>

                  )}

                </>

              )}

            </section>

          )}


          {/* AI RECOMMENDATIONS PAGE */}

{activePage === "AI Recommendations" && (

  <section className="incident-panel">

    <div className="panel-heading">
      <div>
        <h2>Recall Previous Incidents</h2>
        <p>Find similar incidents and reuse previously recorded solutions.</p>
      </div>
    </div>

    <form className="incident-form" onSubmit={handleRecallSearch}>

      <h3>Describe the Current Incident</h3>

      <div className="form-group">
        <label>Incident Description *</label>
        <textarea
          value={recallQuery}
          onChange={(e) => setRecallQuery(e.target.value)}
          placeholder="Example: Application is unable to connect to the database..."
          rows="4"
          required
        />
      </div>

      <div className="form-group">
        <label>Service Name</label>
        <input
          type="text"
          value={recallService}
          onChange={(e) => setRecallService(e.target.value)}
          placeholder="Example: Payment Service"
        />
      </div>

      <div className="form-group">
        <label>Symptoms</label>
        <textarea
          value={recallSymptoms}
          onChange={(e) => setRecallSymptoms(e.target.value)}
          placeholder="Describe the symptoms..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Error Message</label>
        <textarea
          value={recallErrorMessage}
          onChange={(e) => setRecallErrorMessage(e.target.value)}
          placeholder="Enter the error message, if available..."
          rows="2"
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="primary-button"
          disabled={recallLoading}
        >
          {recallLoading ? "Searching..." : "Recall Previous Incidents"}
        </button>
      </div>

    </form>

    {recallError && (
      <p className="error-message">{recallError}</p>
    )}

    {recallResults.length > 0 && (

      <div style={{ marginTop: "30px" }}>

        <h3>Similar Past Incidents</h3>

        {recallResults.map((incident, index) => (

          <div
            key={incident.id || index}
            className="stat-card"
            style={{ marginTop: "15px" }}
          >

            <h3>{incident.title || "Previous Incident"}</h3>

            <p>
              <strong>Service:</strong>{" "}
              {incident.service_name || "Not specified"}
            </p>

            <p>
              <strong>Description:</strong>{" "}
              {incident.description || "Not available"}
            </p>

            <p>
              <strong>Root Cause:</strong>{" "}
              {incident.root_cause || "Not recorded"}
            </p>

            <p>
              <strong>Resolution:</strong>{" "}
              {incident.resolution || "Not recorded"}
            </p>

            <p>
              <strong>Similarity Score:</strong>{" "}
              {typeof incident.similarity === "number"
                ? `${Math.round(incident.similarity * 100)}%`
                : "Not available"}
            </p>

          </div>

        ))}

        {suggestedResolution && (
          <div className="stat-card" style={{ marginTop: "20px" }}>
            <h3>Suggested Resolution</h3>
            <p>{suggestedResolution}</p>
          </div>
        )}
        {recommendedRunbooks.length > 0 && (
  <div style={{ marginTop: "30px" }}>

    <h3>Recommended Runbooks</h3>

    <p>
      Troubleshooting guides related to this incident.
    </p>

    {recommendedRunbooks.map((runbook) => (
      <div
        key={runbook.id}
        className="stat-card"
        style={{ marginTop: "15px" }}
      >
        <div className="stat-icon">
          <BookOpen size={23} />
        </div>

        <h3>{runbook.title}</h3>

        <p>
          <strong>Service:</strong> {runbook.service_name}
        </p>

        <p>{runbook.description}</p>

        <h4>Troubleshooting Steps</h4>

        <ol style={{ paddingLeft: "22px", lineHeight: "2" }}>
          {(runbook.steps || "")
            .split("\n")
            .filter(step => step.trim() !== "")
            .map((step, index) => (
              <li key={index}>{step}</li>
            ))}
        </ol>

      </div>
    ))}

  </div>
)}

      </div>

    )}

    {!recallLoading &&
      !recallError &&
      recallResults.length === 0 &&
      suggestedResolution === "" && (
        <div className="empty-state">
          <Activity size={35} />
          <h3>Ready to Recall</h3>
          <p>Enter an incident above to search your incident history.</p>
        </div>
      )}

  </section>

)}


          {/* SETTINGS PAGE */}

          {activePage === "Settings" && (

            <section className="incident-panel">

              <div className="panel-heading">
                <div>
                  <h2>Settings</h2>
                  <p>Application settings.</p>
                </div>
              </div>

              <div className="empty-state">
                <Settings size={35} />
                <h3>Settings</h3>
                <p>Application configuration will be available here.</p>
              </div>

            </section>

          )}

        </div>


        {/* FOOTER */}

        <footer className="app-footer">
          RecallOps © 2026 | Incident Management System
        </footer>

      </main>

    </div>
  );
}

export default App;
