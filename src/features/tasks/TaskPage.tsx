'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Check, MessageSquare, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  boardsApi,
  commentsApi,
  labelsApi,
  organizationsApi,
  projectsApi,
  tasksApi,
  type Board,
  type Comment,
  type Label,
  type Member,
  type Project,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ErrorMessage, Field, formatLabel, PageIntro } from '@/shared/ui'

const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED']
const priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const getMemberIdentity = (member: Member) => member.userId || member.user?.id || member.id || ''

export function TaskPage() {
  const { taskId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [task, setTask] = useState<Task>()
  const [board, setBoard] = useState<Board>()
  const [project, setProject] = useState<Project>()
  const [members, setMembers] = useState<Member[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [error, setError] = useState<unknown>()
  const [message, setMessage] = useState('')
  const [commentText, setCommentText] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', estimatedHours: '' })
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [status, setStatus] = useState<TaskStatus>('TODO')
  const [assignee, setAssignee] = useState('')
  const [labelId, setLabelId] = useState('')
  const currentMember = members.find((member) => getMemberIdentity(member) === user?.id)
  const canEdit = Boolean(currentMember && currentMember.role !== 'VIEWER')
  const canDelete = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN'
  const loadTask = useCallback(async () => {
    try {
      const item = await tasksApi.get(taskId)
      setTask(item)
      setForm({
        title: item.title,
        description: item.description ?? '',
        dueDate: item.dueDate?.slice(0, 10) ?? '',
        estimatedHours: item.estimatedHours?.toString() ?? '',
      })
      setPriority(item.priority ?? 'MEDIUM')
      setStatus(item.status ?? 'TODO')
      setAssignee(item.assignedToId ?? '')
      const taskComments = await tasksApi.comments(taskId)
      setComments(taskComments)
      const currentBoard = await boardsApi.get(item.boardId)
      setBoard(currentBoard)
      const currentProject = await projectsApi.get(currentBoard.projectId)
      setProject(currentProject)
      const [orgMembers, orgLabels] = await Promise.all([
        organizationsApi.members(currentProject.organizationId),
        organizationsApi.labels(currentProject.organizationId),
      ])
      setMembers(orgMembers)
      setLabels(orgLabels)
    } catch (cause) {
      setError(cause)
    }
  }, [taskId])
  useEffect(() => {
    queueMicrotask(() => {
      void loadTask()
    })
  }, [loadTask])
  async function saveTask(event: React.FormEvent) {
    event.preventDefault()
    try {
      const updated = await tasksApi.update(taskId, {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      })
      setTask((current) => (current ? { ...current, ...updated } : updated))
      await tasksApi.status(taskId, status)
      await tasksApi.priority(taskId, priority)
      setMessage('La tarea se actualizó correctamente.')
    } catch (cause) {
      setError(cause)
    }
  }
  async function deleteTask() {
    if (!canDelete || !window.confirm('¿Eliminar esta tarea?')) return
    try {
      await tasksApi.remove(taskId)
      navigate(`/app/boards/${task?.boardId}`)
    } catch (cause) {
      setError(cause)
    }
  }
  async function changeAssignee(value: string) {
    try {
      if (value) await tasksApi.assign(taskId, value)
      else await tasksApi.removeAssignee(taskId)
      setAssignee(value)
      setMessage('La asignación se actualizó.')
    } catch (cause) {
      setError(cause)
    }
  }
  async function addComment(event: React.FormEvent) {
    event.preventDefault()
    if (!commentText.trim()) return
    try {
      const comment = await tasksApi.addComment(taskId, commentText)
      setComments((current) => [...current, comment])
      setCommentText('')
    } catch (cause) {
      setError(cause)
    }
  }
  async function updateComment(comment: Comment) {
    try {
      const updated = await commentsApi.update(comment.id, editingCommentText)
      setComments((current) => current.map((item) => (item.id === comment.id ? updated : item)))
      setEditingComment(null)
    } catch (cause) {
      setError(cause)
    }
  }
  async function deleteComment(comment: Comment) {
    if (!window.confirm('¿Eliminar este comentario?')) return
    try {
      await commentsApi.remove(comment.id)
      setComments((current) => current.filter((item) => item.id !== comment.id))
    } catch (cause) {
      setError(cause)
    }
  }
  async function addLabel() {
    if (!labelId) return
    try {
      await labelsApi.assign(taskId, labelId)
      await loadTask()
      setLabelId('')
    } catch (cause) {
      setError(cause)
    }
  }
  async function removeLabel(id: string) {
    try {
      await labelsApi.removeFromTask(taskId, id)
      await loadTask()
    } catch (cause) {
      setError(cause)
    }
  }
  return (
    <>
      <div className="back-link">
        <Link to={board ? `/app/boards/${board.id}` : '/app'}>
          <ArrowLeft size={15} />
          Volver al tablero
        </Link>
      </div>
      <PageIntro
        eyebrow={project?.name || 'Tarea'}
        title={task?.title || 'Cargando tarea...'}
        description="Consulta el detalle, actualiza el progreso y coordina a las personas responsables."
      />
      {error && <ErrorMessage error={error} />}
      {message && (
        <div className="success-message">
          <Check size={16} />
          {message}
        </div>
      )}
      <div className="task-layout">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Detalles</span>
              <h2>Información de la tarea</h2>
            </div>
            {canDelete && (
              <button
                className="icon-action danger"
                onClick={deleteTask}
                title="Eliminar tarea"
                aria-label="Eliminar tarea"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <form onSubmit={saveTask} className="form-stack">
            <Field
              label="Título"
              value={form.title}
              onChange={(value) => setForm({ ...form, title: value })}
              placeholder="Título de la tarea"
            />
            <Field
              label="Descripción"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
              placeholder="Describe el trabajo"
            />
            <div className="form-grid">
              <label className="field">
                <span>Estado</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TaskStatus)}
                  disabled={!canEdit}
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {formatLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Prioridad</span>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as TaskPriority)}
                  disabled={!canEdit}
                >
                  {priorities.map((item) => (
                    <option key={item} value={item}>
                      {formatLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Fecha límite"
                type="date"
                value={form.dueDate}
                onChange={(value) => setForm({ ...form, dueDate: value })}
                placeholder="Fecha límite"
              />
              <Field
                label="Horas estimadas"
                type="number"
                value={form.estimatedHours}
                onChange={(value) => setForm({ ...form, estimatedHours: value })}
                placeholder="0"
              />
            </div>
            <button className="primary" disabled={!canEdit}>
              <Save size={16} />
              Guardar tarea
            </button>
          </form>
          <div className="assignment-section">
            <label className="field">
              <span>Persona asignada</span>
              <select
                value={assignee}
                onChange={(event) => changeAssignee(event.target.value)}
                disabled={!canEdit}
              >
                <option value="">Sin asignar</option>
                {members.map((member, index) => (
                  <option
                    key={`${getMemberIdentity(member) || 'member'}-${index}`}
                    value={getMemberIdentity(member)}
                  >
                    {member.user?.username || getMemberIdentity(member)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="labels-section">
            <div className="section-title">
              <span>Etiquetas</span>
              <div className="label-picker">
                <select value={labelId} onChange={(event) => setLabelId(event.target.value)}>
                  <option value="">Añadir etiqueta</option>
                  {labels
                    .filter((item) => !task?.labels?.some((label) => label.id === item.id))
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
                <button className="icon-action" onClick={addLabel} aria-label="Añadir etiqueta">
                  <Plus size={15} />
                </button>
              </div>
            </div>
            <div className="tag-list">
              {task?.labels?.map((item) => (
                <span className="tag" key={item.id} style={{ borderColor: item.color }}>
                  {item.name}
                  <button onClick={() => removeLabel(item.id)} aria-label={`Quitar ${item.name}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>
        <section className="panel comments-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Conversación</span>
              <h2>
                <MessageSquare size={18} /> Comentarios
              </h2>
            </div>
          </div>
          <form onSubmit={addComment} className="comment-form">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Escribe una actualización para el equipo..."
              required
            />
            <button className="primary">
              <Plus size={16} />
              Comentar
            </button>
          </form>
          <div className="comments-list">
            {comments.map((comment) => (
              <article className="comment" key={comment.id}>
                <div className="comment-head">
                  <strong>{comment.author?.username || comment.authorId}</strong>
                  <small>
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                  </small>
                </div>
                {editingComment === comment.id ? (
                  <div className="comment-edit">
                    <textarea
                      value={editingCommentText}
                      onChange={(event) => setEditingCommentText(event.target.value)}
                    />
                    <button className="primary" onClick={() => updateComment(comment)}>
                      <Save size={14} />
                      Guardar
                    </button>
                  </div>
                ) : (
                  <p>{comment.content}</p>
                )}
                {comment.authorId === user?.id && editingComment !== comment.id && (
                  <div className="comment-actions">
                    <button
                      className="text-button"
                      onClick={() => {
                        setEditingComment(comment.id)
                        setEditingCommentText(comment.content)
                      }}
                    >
                      <Pencil size={13} />
                      Editar
                    </button>
                    <button
                      className="text-button danger-text"
                      onClick={() => deleteComment(comment)}
                    >
                      <Trash2 size={13} />
                      Eliminar
                    </button>
                  </div>
                )}
              </article>
            ))}
            {!comments.length && (
              <div className="empty">
                <MessageSquare size={20} />
                <span>Aún no hay comentarios.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
