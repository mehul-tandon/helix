import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'

export default function BoardsPage() {
  const [boards, setBoards] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { user, logout } = useAuth()
  const nav = useNavigate()

  useEffect(() => { fetchBoards() }, [])

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/api/boards')
      setBoards(data)
    } catch (_) {}
    setLoading(false)
  }

  const createBoard = async e => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/api/boards', { name: newName.trim() })
      setBoards(prev => [...prev, data])
      setNewName('')
    } catch (_) {}
    setCreating(false)
  }

  const deleteBoard = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this board?')) return
    await api.delete(`/api/boards/${id}`)
    setBoards(prev => prev.filter(b => b.id !== id))
  }

  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="nav-brand">
          <span>⚡</span> Forge 2
        </div>
        <div className="nav-actions">
          <a href="/audit" className="nav-link">📊 Audit Log</a>
          <div className="nav-user">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <span>{user?.name}</span>
          </div>
          <button id="logout-btn" onClick={logout} className="btn-ghost">Sign Out</button>
        </div>
      </nav>

      <main className="boards-main">
        <div className="boards-header">
          <h1>Your Boards</h1>
          <p>Select a board to manage your sprint</p>
        </div>

        <form onSubmit={createBoard} className="create-board-form">
          <input
            id="new-board-name"
            type="text"
            placeholder="New board name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <button id="create-board-btn" type="submit" className="btn-primary" disabled={creating}>
            {creating ? <span className="spinner" /> : '+ Create Board'}
          </button>
        </form>

        {loading ? (
          <div className="boards-grid">
            {[1,2,3].map(i => <div key={i} className="board-card-skeleton" />)}
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map((board, idx) => (
              <div
                key={board.id}
                className="board-card"
                style={{ '--accent': colors[idx % colors.length] }}
                onClick={() => nav(`/boards/${board.id}`)}
                id={`board-${board.id}`}
              >
                <div className="board-card-color" />
                <div className="board-card-body">
                  <h3>{board.name}</h3>
                  <p>{board.lists_count ?? 0} lists · {board.cards_count ?? 0} cards</p>
                </div>
                <button
                  className="board-card-delete"
                  onClick={e => deleteBoard(board.id, e)}
                  title="Delete board"
                >✕</button>
              </div>
            ))}
            {boards.length === 0 && (
              <div className="empty-state">
                <span>🗂️</span>
                <p>No boards yet. Create one above!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
