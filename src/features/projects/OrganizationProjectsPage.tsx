'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { organizationsApi, projectsApi, type Organization, type Project } from '@/lib/api'
import { Empty, ErrorMessage, Field, formatLabel, PageIntro } from '@/shared/ui'

export function OrganizationProjectsPage() {
  const { organizationId = '' } = useParams()
  const [organization, setOrganization] = useState<Organization>()
  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    organizationsApi
      .list()
      .then((items) => setOrganization(items.find((item) => item.id === organizationId)))
      .catch(setError)
    organizationsApi.projects(organizationId).then(setProjects).catch(setError)
  }, [organizationId])
  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    try {
      const project = await projectsApi.create(organizationId, { name })
      setProjects((current) => [...current, project])
      setName('')
    } catch (cause) {
      setError(cause)
    }
  }
  return (
    <>
      <PageIntro
        eyebrow={organization?.name || 'Organización'}
        title="Proyectos"
        description="Cada proyecto contiene sus tableros y mantiene el trabajo dentro de su organización."
      />
      <div className="panel form-panel">
        <form onSubmit={create} className="inline-form">
          <Field
            label="Nuevo proyecto"
            value={name}
            onChange={setName}
            placeholder="Nombre del proyecto"
          />
          <button className="primary">
            <Plus size={16} />
            Crear proyecto
          </button>
        </form>
      </div>
      {error && <ErrorMessage error={error} />}
      <div className="card-grid">
        {projects.map((project) => (
          <Link className="resource-card" key={project.id} to={`/app/projects/${project.id}`}>
            <div className="card-top">
              <span className="square large">{project.name.slice(0, 1)}</span>
              {project.status && <span className="status">{formatLabel(project.status)}</span>}
            </div>
            <h2>{project.name}</h2>
            <p>{project.description || 'Este proyecto todavía no tiene descripción.'}</p>
            <span className="card-footer">
              Ver tableros <ArrowRight size={15} />
            </span>
          </Link>
        ))}
        {!projects.length && <Empty text="No hay proyectos en esta organización." />}
      </div>
    </>
  )
}
