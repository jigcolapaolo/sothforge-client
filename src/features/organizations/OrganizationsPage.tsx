'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { organizationsApi, type Organization } from '@/lib/api'
import { Empty, ErrorMessage, Field, PageIntro } from '@/shared/ui'

export function OrganizationsPage() {
  const [items, setItems] = useState<Organization[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState<unknown>()
  const load = () => {
    void organizationsApi.list().then(setItems).catch(setError)
  }
  useEffect(load, [])
  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    try {
      await organizationsApi.create({ name })
      setName('')
      load()
    } catch (cause) {
      setError(cause)
    }
  }
  return (
    <>
      <PageIntro
        eyebrow="Tus espacios de trabajo"
        title="Organizaciones"
        description="Crea y cambia de espacio sin perder el contexto de proyectos y miembros."
      />
      <div className="panel form-panel">
        <form onSubmit={create} className="inline-form">
          <Field
            label="Nueva organización"
            value={name}
            onChange={setName}
            placeholder="Nombre del equipo"
          />
          <button className="primary">
            <Plus size={16} />
            Crear
          </button>
        </form>
      </div>
      {error && <ErrorMessage error={error} />}
      <div className="card-grid">
        {items.map((organization) => (
          <Link
            className="resource-card"
            key={organization.id}
            to={`/app/organizations/${organization.id}/projects`}
          >
            <span className="square large">{organization.name.slice(0, 1)}</span>
            <h2>{organization.name}</h2>
            <p>{organization.description || 'Sin descripción añadida.'}</p>
            <span className="card-footer">
              Abrir organización <ArrowRight size={15} />
            </span>
          </Link>
        ))}
        {!items.length && <Empty text="Todavía no tienes organizaciones." />}
      </div>
    </>
  )
}
