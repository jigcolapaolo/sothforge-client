'use client'

import { useCallback, useEffect, useState } from 'react'
import { CircleDot, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { boardsApi, tasksApi, type Board, type Task, type TaskStatus } from '@/lib/api'
import { ErrorMessage, Field, formatLabel, PageIntro } from '@/shared/ui'

const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED']
export function BoardPage() {
  const { boardId = '' } = useParams()
  const [board, setBoard] = useState<Board>()
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState<unknown>()
  const load = useCallback(
    () =>
      Promise.all([
        boardsApi.get(boardId).then(setBoard),
        boardsApi.tasks(boardId).then(setTasks),
      ]).catch(setError),
    [boardId],
  )
  useEffect(() => {
    void load()
  }, [load])
  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    try {
      const task = await tasksApi.create(boardId, { title })
      setTasks((current) => [...current, task])
      setTitle('')
    } catch (cause) {
      setError(cause)
    }
  }
  async function move(task: Task, status: TaskStatus) {
    try {
      await tasksApi.status(task.id, status)
      await load()
    } catch (cause) {
      setError(cause)
    }
  }
  return (
    <>
      <PageIntro
        eyebrow="Tablero de trabajo"
        title={board?.name || 'Cargando tablero...'}
        description={
          board?.description || 'Organiza el trabajo por estado y mantén el ritmo del equipo.'
        }
      />
      <div className="panel form-panel">
        <form onSubmit={create} className="inline-form">
          <Field
            label="Nueva tarea"
            value={title}
            onChange={setTitle}
            placeholder="¿Qué hay que hacer?"
          />
          <button className="primary">
            <Plus size={16} />
            Crear tarea
          </button>
        </form>
      </div>
      {error && <ErrorMessage error={error} />}
      <div className="kanban">
        {statuses.map((status) => (
          <section className="column" key={status}>
            <div className="column-head">
              <span>
                <CircleDot size={15} />
                {formatLabel(status)}
              </span>
              <b>{tasks.filter((task) => task.status === status).length}</b>
            </div>
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <article className="task-card" key={task.id}>
                  <Link className="task-link" to={`/app/tasks/${task.id}`}>
                    <h3>{task.title}</h3>
                  </Link>
                  <p>{task.description || 'Sin descripción'}</p>
                  {task.assignedToId && (
                    <small className="task-assignee">Responsable: {task.assignedToId}</small>
                  )}
                  {!!task.labels?.length && (
                    <div className="task-tags">
                      {task.labels.map((item) => (
                        <span className="tag" key={item.id} style={{ borderColor: item.color }}>
                          {item.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="task-meta">
                    <span className={`priority ${task.priority?.toLowerCase()}`}>
                      {formatLabel(task.priority)}
                    </span>
                    {task.dueDate && <small>{new Date(task.dueDate).toLocaleDateString()}</small>}
                  </div>
                  <select
                    value={task.status || 'TODO'}
                    onChange={(event) => move(task, event.target.value as TaskStatus)}
                    aria-label={`Estado de ${task.title}`}
                  >
                    {statuses.map((option) => (
                      <option key={option} value={option}>
                        {formatLabel(option)}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
          </section>
        ))}
      </div>
    </>
  )
}
