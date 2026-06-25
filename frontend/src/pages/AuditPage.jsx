import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function AuditPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  const fetchLog = async () => {
    try {
      const { data: res } = await api.get('/api/agent-log')
      setData(res)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    fetchLog()
    const interval = setInterval(fetchLog, 30000)
    return () => clearInterval(interval)
  }, [])

  const stats = data?.stats || {}
  const events = data?.events || []

  const modelEntries = Object.entries(stats.models || {}).sort((a, b) => b[1] - a[1])
  const total = (stats.completed || 0) + (stats.failed || 0)

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="nav-brand">
          <button className="nav-back" onClick={() => nav('/boards')}>← Boards</button>
          <span className="nav-sep">·</span>
          <span>Agent Audit Log</span>
        </div>
        <div className="nav-actions">
          <span className="live-badge">● LIVE</span>
        </div>
      </nav>

      <main className="audit-main">
        <div className="audit-header">
          <h1>📊 Agent Activity</h1>
          <p>Real-time log of all Hermes + OpenClaw actions. Auto-refreshes every 30s.</p>
        </div>

        {loading ? (
          <div className="stat-cards-grid">
            {[1,2,3,4].map(i => <div key={i} className="stat-card-skeleton" />)}
          </div>
        ) : (
          <>
            <div className="stat-cards-grid">
              <div className="stat-card stat-green" id="stat-completed">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats.completed ?? 0}</div>
                <div className="stat-label">Tasks Completed</div>
              </div>
              <div className="stat-card stat-red" id="stat-failed">
                <div className="stat-icon">❌</div>
                <div className="stat-value">{stats.failed ?? 0}</div>
                <div className="stat-label">Tasks Failed</div>
              </div>
              <div className="stat-card stat-purple" id="stat-models">
                <div className="stat-icon">🧠</div>
                <div className="stat-value">{modelEntries.length}</div>
                <div className="stat-label">Models Used</div>
                <div className="model-breakdown">
                  {modelEntries.map(([model, count]) => (
                    <div key={model} className="model-bar-row">
                      <span className="model-name">{model}</span>
                      <div className="model-bar-bg">
                        <div className="model-bar-fill" style={{ width: `${total ? (count / total * 100) : 0}%` }} />
                      </div>
                      <span className="model-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="stat-card stat-blue" id="stat-avg-time">
                <div className="stat-icon">⏱️</div>
                <div className="stat-value">{stats.avgMs ? `${(stats.avgMs / 1000).toFixed(1)}s` : 'N/A'}</div>
                <div className="stat-label">Avg Task Duration</div>
              </div>
            </div>

            <div className="audit-table-wrap">
              <h2>Event Stream</h2>
              <table className="audit-table" id="audit-events-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Agent</th>
                    <th>Task</th>
                    <th>Model</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...events].reverse().map((e, i) => (
                    <tr key={i} className={`event-row ${e.status}`}>
                      <td className="ts">{e.ts ? new Date(e.ts).toLocaleTimeString() : '—'}</td>
                      <td><span className={`agent-badge agent-${e.agent}`}>{e.agent}</span></td>
                      <td className="task-name">{e.task}</td>
                      <td className="model-cell">{e.model || '—'}</td>
                      <td>{e.duration_ms ? `${(e.duration_ms / 1000).toFixed(1)}s` : '—'}</td>
                      <td><span className={`status-badge status-${e.status}`}>{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && (
                <div className="empty-state" style={{padding:'2rem'}}>
                  <span>🤖</span>
                  <p>No agent events yet. Events will appear here as agents work.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
