'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Boxes, Check, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { organizationsApi, type Organization, type Project } from '@/lib/api'
import { Empty, ErrorMessage, Metric, PageIntro } from '@/shared/ui'

export function DashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    organizationsApi
      .list()
      .then((items) => {
        setOrganizations(items)
        if (items[0]) organizationsApi.projects(items[0].id).then(setProjects).catch(setError)
      })
      .catch(setError)
  }, [])
  return (
    <>
      <PageIntro
        eyebrow="Resumen del espacio"
        title="Un lugar claro para hacer avanzar el trabajo."
        description="Una vista rápida de tus organizaciones y proyectos activos."
      />
      <div className="metric-grid">
        <Metric label="Organizaciones" value={organizations.length} icon={<Users size={17} />} />
        <Metric label="Proyectos visibles" value={projects.length} icon={<Boxes size={17} />} />
        <Metric
          label="Proyectos activos"
          value={projects.filter((project) => project.status === 'ACTIVE').length}
          icon={<Check size={17} />}
        />
      </div>
      {error && <ErrorMessage error={error} />}
      <section className="section-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Organizaciones</span>
              <h2>Tus espacios</h2>
            </div>
            <Link className="text-link" to="/app/organizations">
              Ver todas <ArrowRight size={15} />
            </Link>
          </div>
          {organizations.length ? (
            organizations.map((organization) => (
              <Link
                className="list-row"
                key={organization.id}
                to={`/app/organizations/${organization.id}/projects`}
              >
                <span className="square">{organization.name.slice(0, 1)}</span>
                <span>
                  <strong>{organization.name}</strong>
                  <small>{organization.description || 'Sin descripción'}</small>
                </span>
                <ArrowRight size={16} />
              </Link>
            ))
          ) : (
            <Empty text="No hay organizaciones disponibles." />
          )}
        </div>
        <div className="panel accent-panel">
          <span className="pill">Tu espacio de trabajo</span>
          <h2>Todo el trabajo de tu equipo, en un solo lugar.</h2>
          <p className="muted">
            Consulta tus proyectos, organiza tareas y mantén a tu equipo alineado.
          </p>
        </div>
      </section>
    </>
  )
}
