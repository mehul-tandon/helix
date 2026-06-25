import { useState, useEffect } from 'react'
import api from '../api'

export default function CardModal({ card, onClose, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    title: card.title,
    description: card.description || '',
    due_date: card.due_date || '',
  })
  const [allTags, setAllTags] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [saving, setSaving] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6366f1')

  useEffect(() => {
    api.get('/api/tags').then(r => setAllTags(r.data))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put(`/api/cards/${card.id}`, form)
      onUpdate(data)
    } catch (_) {}
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return
    await api.delete(`/api/cards/${card.id}`)
    onDelete(card.id)
  }

  const toggleTag = async tag => {
    const hasTag = (card.tags || []).some(t => t.id === tag.id)
    if (hasTag) {
      const { data } = await api.delete(`/api/cards/${card.id}/tags/${tag.id}`)
      onUpdate(data)
    } else {
      const { data } = await api.post(`/api/cards/${card.id}/tags`, { tag_id: tag.id })
      onUpdate(data)
    }
  }

  const createTag = async e => {
    e.preventDefault()
    if (!newTagName.trim()) return
    const { data } = await api.post('/api/tags', { name: newTagName, color: newTagColor })
    setAllTags(prev => [...prev, data])
    setNewTagName('')
    // Auto-attach to card
    const { data: updated } = await api.post(`/api/cards/${card.id}/tags`, { tag_id: data.id })
    onUpdate(updated)
  }

  const cardTags = card.tags || []
  const cardMembers = card.members || []

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" id={`card-modal-${card.id}`}>
        <div className="modal-header">
          <h2>Card Details</h2>
          <div className="modal-header-actions">
            <button id={`delete-card-${card.id}`} className="btn-danger-sm" onClick={handleDelete}>Delete</button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Title</label>
            <input
              id={`card-title-${card.id}`}
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              id={`card-desc-${card.id}`}
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Add a description…"
            />
          </div>

          <div className="field">
            <label>Due Date</label>
            <input
              id={`card-due-${card.id}`}
              type="date"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <button id={`save-card-${card.id}`} className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" /> : 'Save Changes'}
          </button>

          <div className="modal-section">
            <h3>Tags</h3>
            <div className="tags-grid">
              {allTags.map(tag => {
                const active = cardTags.some(t => t.id === tag.id)
                return (
                  <button
                    key={tag.id}
                    id={`tag-toggle-${tag.id}`}
                    className={`tag-toggle ${active ? 'active' : ''}`}
                    style={{ '--tag-color': tag.color }}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>

            <form onSubmit={createTag} className="create-tag-form">
              <input
                id="new-tag-name"
                type="text"
                placeholder="New tag name…"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
              />
              <input
                id="new-tag-color"
                type="color"
                value={newTagColor}
                onChange={e => setNewTagColor(e.target.value)}
              />
              <button type="submit" className="btn-primary btn-sm">+ Add</button>
            </form>
          </div>

          <div className="modal-section">
            <h3>Members</h3>
            <div className="member-list">
              {cardMembers.length === 0 && <p className="muted">No members assigned</p>}
              {cardMembers.map(m => (
                <div key={m.id} className="member-chip">
                  <div className="avatar">{m.name[0]}</div>
                  <span>{m.name}</span>
                  <button
                    id={`remove-member-${m.id}`}
                    className="btn-icon-sm"
                    onClick={async () => {
                      const { data } = await api.delete(`/api/cards/${card.id}/members/${m.id}`)
                      onUpdate(data)
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
