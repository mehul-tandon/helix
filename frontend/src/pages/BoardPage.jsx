import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import api from '../api'
import CardModal from '../components/CardModal'
import { useAuth } from '../contexts/AuthContext'

export default function BoardPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user, logout } = useAuth()
  const [board, setBoard] = useState(null)
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [newListName, setNewListName] = useState('')
  const [addingList, setAddingList] = useState(false)
  const [addingCardListId, setAddingCardListId] = useState(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)

  const fetchBoard = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/boards/${id}`)
      setBoard(data)
      setLists(data.lists || [])
    } catch (_) { nav('/boards') }
    setLoading(false)
  }, [id, nav])

  useEffect(() => { fetchBoard() }, [fetchBoard])

  const addList = async e => {
    e.preventDefault()
    if (!newListName.trim()) return
    setAddingList(true)
    try {
      const { data } = await api.post(`/api/boards/${id}/lists`, { name: newListName })
      setLists(prev => [...prev, { ...data, cards: [] }])
      setNewListName('')
    } catch (_) {}
    setAddingList(false)
  }

  const deleteList = async listId => {
    if (!confirm('Delete this list and all its cards?')) return
    await api.delete(`/api/lists/${listId}`)
    setLists(prev => prev.filter(l => l.id !== listId))
  }

  const addCard = async (listId, e) => {
    e.preventDefault()
    if (!newCardTitle.trim()) return
    const { data } = await api.post(`/api/lists/${listId}/cards`, { title: newCardTitle })
    setLists(prev => prev.map(l => l.id === listId ? { ...l, cards: [...(l.cards || []), data] } : l))
    setNewCardTitle('')
    setAddingCardListId(null)
  }

  const onDragEnd = async result => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const srcListId = parseInt(source.droppableId)
    const dstListId = parseInt(destination.droppableId)
    const cardId = parseInt(draggableId)

    // Optimistic UI update
    setLists(prev => {
      const next = prev.map(l => ({ ...l, cards: [...(l.cards || [])] }))
      const srcList = next.find(l => l.id === srcListId)
      const dstList = next.find(l => l.id === dstListId)
      if (!srcList || !dstList) return prev
      const [card] = srcList.cards.splice(source.index, 1)
      dstList.cards.splice(destination.index, 0, card)
      return next
    })

    // Persist to API
    try {
      await api.put(`/api/cards/${cardId}`, { list_id: dstListId, position: destination.index })
    } catch (_) { fetchBoard() } // rollback on error
  }

  const refreshCard = updatedCard => {
    setLists(prev => prev.map(l => ({
      ...l,
      cards: (l.cards || []).map(c => c.id === updatedCard.id ? updatedCard : c)
    })))
    setSelectedCard(updatedCard)
  }

  const deleteCard = cardId => {
    setLists(prev => prev.map(l => ({ ...l, cards: (l.cards || []).filter(c => c.id !== cardId) })))
    setSelectedCard(null)
  }

  if (loading) return <div className="loading-screen"><span className="spinner-lg" /></div>

  return (
    <div className="app-layout board-layout">
      <nav className="top-nav">
        <div className="nav-brand">
          <button className="nav-back" onClick={() => nav('/boards')}>← Boards</button>
          <span className="nav-sep">·</span>
          <span className="board-title-nav">{board?.name}</span>
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

      <div className="board-canvas">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="lists-container">
            {lists.map(list => (
              <div key={list.id} className="list-column" id={`list-${list.id}`}>
                <div className="list-header">
                  <h3>{list.name}</h3>
                  <div className="list-header-actions">
                    <span className="card-count">{list.cards?.length ?? 0}</span>
                    <button className="btn-icon-danger" onClick={() => deleteList(list.id)} title="Delete list">✕</button>
                  </div>
                </div>

                <Droppable droppableId={String(list.id)}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`cards-drop-zone ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                    >
                      {(list.cards || []).map((card, idx) => (
                        <Draggable key={card.id} draggableId={String(card.id)} index={idx}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`card-item ${snap.isDragging ? 'dragging' : ''}`}
                              onClick={() => setSelectedCard(card)}
                              id={`card-${card.id}`}
                            >
                              <div className="card-tags">
                                {(card.tags || []).map(t => (
                                  <span key={t.id} className="tag-pill" style={{ background: t.color }}>{t.name}</span>
                                ))}
                              </div>
                              <p className="card-title">{card.title}</p>
                              <div className="card-meta">
                                {card.due_date && (
                                  <span className={`due-date ${new Date(card.due_date) < new Date() ? 'overdue' : ''}`}>
                                    📅 {card.due_date}
                                  </span>
                                )}
                                <div className="member-avatars">
                                  {(card.members || []).slice(0, 3).map(m => (
                                    <div key={m.id} className="avatar-sm" title={m.name}>{m.name[0]}</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {addingCardListId === list.id ? (
                  <form onSubmit={e => addCard(list.id, e)} className="add-card-form">
                    <input
                      autoFocus
                      id={`new-card-input-${list.id}`}
                      type="text"
                      placeholder="Card title…"
                      value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                    />
                    <div className="add-card-actions">
                      <button type="submit" className="btn-primary btn-sm">Add Card</button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => { setAddingCardListId(null); setNewCardTitle('') }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button
                    id={`add-card-btn-${list.id}`}
                    className="add-card-btn"
                    onClick={() => { setAddingCardListId(list.id); setNewCardTitle('') }}
                  >
                    + Add card
                  </button>
                )}
              </div>
            ))}

            {/* Add new list */}
            <div className="list-column add-list-column">
              <form onSubmit={addList}>
                <input
                  id="new-list-name"
                  type="text"
                  placeholder="+ Add another list…"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="add-list-input"
                />
                {newListName && (
                  <button id="create-list-btn" type="submit" className="btn-primary btn-sm" disabled={addingList}>
                    {addingList ? <span className="spinner" /> : 'Add List'}
                  </button>
                )}
              </form>
            </div>
          </div>
        </DragDropContext>
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={refreshCard}
          onDelete={deleteCard}
        />
      )}
    </div>
  )
}
