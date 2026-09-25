'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, LayoutDashboard, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  boardsApi,
  organizationsApi,
  projectsApi,
  type Board,
  type Member,
  type Project,
  type ProjectStatus,
} from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Empty, ErrorMessage, Field, PageIntro } from '@/shared/ui'

export function ProjectPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Project>()
  const [boards, setBoards] = useState<Board[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('PLANNING')
  const [boardName, setBoardName] = useState('')
  const [editingProject, setEditingProject] = useState(false)
  const [editingBoard, setEditingBoard] = useState<string | null>(null)
  const [error, setError] = useState<unknown>()
  const currentMember = members.find((member) => member.userId === user?.id)
  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN'

  useEffect(() => {
    projectsApi
      .get(projectId)
      .then((item) => {
        setProject(item)
        setName(item.name)
        setDescription(item.description ?? '')
        setStatus(item.status ?? 'PLANNING')
      })
      .catch(setError)
    projectsApi.boards(projectId).then(setBoards).catch(setError)
  }, [projectId])

  useEffect(() => {
    if (project?.organizationId)
      organizationsApi.members(project.organizationId).then(setMembers).catch(setError)
  }, [project?.organizationId])

  async function createBoard(event: React.FormEvent) {
    event.preventDefault()
    if (!boardName.trim()) return
    try {
      const board = await boardsApi.create(projectId, { name: boardName })
      setBoards((current) => [...current, board])
      setBoardName('')
    } catch (cause) {
      setError(cause)
    }
  }

  async function saveProject(event: React.FormEvent) {
    event.preventDefault()
    try {
      const updated = await projectsApi.update(projectId, { name, description, status })
      setProject(updated)
      setEditingProject(false)
    } catch (cause) {
      setError(cause)
    }
  }

  async function deleteProject() {
    if (!project || !window.confirm('¿Eliminar este proyecto y sus tableros?')) return
    try {
      await projectsApi.remove(project.id)
      navigate(`/app/organizations/${project.organizationId}/projects`)
    } catch (cause) {
      setError(cause)
    }
  }

  async function saveBoard(board: Board) {
    try {
      const updated = await boardsApi.update(board.id, { name: boardName })
      setBoards((current) => current.map((item) => (item.id === board.id ? updated : item)))
      setEditingBoard(null)
      setBoardName('')
    } catch (cause) {
      setError(cause)
    }
  }

  async function deleteBoard(board: Board) {
    if (!window.confirm('¿Eliminar este tablero y sus tareas?')) return
    try {
      await boardsApi.remove(board.id)
      setBoards((current) => current.filter((item) => item.id !== board.id))
    } catch (cause) {
      setError(cause)
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="Proyecto"
        title={project?.name || 'Cargando proyecto...'}
        description={project?.description || 'Tableros y tareas de este proyecto.'}
      />
      {error && <ErrorMessage error={error} />}
      <section className="panel form-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Detalles</span>
            <h2>Configuración del proyecto</h2>
          </div>
          {canManage && (
            <div className="action-row">
              <button
                className="icon-action"
                onClick={() => setEditingProject((value) => !value)}
                title="Editar proyecto"
                aria-label="Editar proyecto"
              >
                <Pencil size={15} />
              </button>
              <button
                className="icon-action danger"
                onClick={deleteProject}
                title="Eliminar proyecto"
                aria-label="Eliminar proyecto"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
        {editingProject && (
          <form onSubmit={saveProject} className="form-stack">
            <Field
              label="Nombre"
              value={name}
              onChange={setName}
              placeholder="Nombre del proyecto"
            />
            <Field
              label="Descripción"
              value={description}
              onChange={setDescription}
              placeholder="Describe el proyecto"
            />
            <label className="field">
              <span>Estado</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              >
                <option value="PLANNING">Planificación</option>
                <option value="ACTIVE">Activo</option>
                <option value="COMPLETED">Completado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </label>
            <button className="primary">
              <Save size={16} />
              Guardar proyecto
            </button>
          </form>
        )}
      </section>
      <section className="panel form-panel">
        <form onSubmit={createBoard} className="inline-form">
          <Field
            label="Nuevo tablero"
            value={boardName}
            onChange={setBoardName}
            placeholder="Ej. Desarrollo"
          />
          <button className="primary">
            <Plus size={16} />
            Crear tablero
          </button>
        </form>
      </section>
      <div className="card-grid">
        {boards.map((board) => (
          <div className="resource-card" key={board.id}>
            <Link to={`/app/boards/${board.id}`}>
              <span className="square large">
                <LayoutDashboard size={20} />
              </span>
              <h2>{board.name}</h2>
              <p>{board.description || 'Tablero de trabajo'}</p>
              <span className="card-footer">
                Abrir tablero <ArrowRight size={15} />
              </span>
            </Link>
            {canManage && (
              <div className="card-actions">
                {editingBoard === board.id && (
                  <button className="primary" onClick={() => saveBoard(board)}>
                    <Save size={14} />
                    Guardar
                  </button>
                )}
                <button
                  className="icon-action"
                  onClick={() => {
                    setEditingBoard(board.id)
                    setBoardName(board.name)
                  }}
                  title="Editar tablero"
                  aria-label="Editar tablero"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-action danger"
                  onClick={() => deleteBoard(board)}
                  title="Eliminar tablero"
                  aria-label="Eliminar tablero"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
        {!boards.length && <Empty text="No hay tableros en este proyecto." />}
      </div>
    </>
  )
}
