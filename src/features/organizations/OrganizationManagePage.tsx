'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Crown, Pencil, Plus, Save, Trash2, UserMinus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  labelsApi,
  organizationAdminApi,
  organizationsApi,
  type Label,
  type Member,
  type Organization,
  type Role,
} from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Empty, ErrorMessage, Field, PageIntro } from '@/shared/ui'

const getMemberIdentity = (member: Member) => member.userId || member.user?.id || member.id || ''

export function OrganizationManagePage() {
  const { organizationId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [organization, setOrganization] = useState<Organization>()
  const [members, setMembers] = useState<Member[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [userId, setUserId] = useState('')
  const [labelName, setLabelName] = useState('')
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState('')
  const [organizationDescription, setOrganizationDescription] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<unknown>()
  const currentMember = useMemo(
    () => members.find((member) => getMemberIdentity(member) === user?.id),
    [members, user?.id],
  )
  const canManageMembers = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN'
  const isOwner = currentMember?.role === 'OWNER'
  useEffect(() => {
    organizationsApi
      .get(organizationId)
      .then((item) => {
        setOrganization(item)
        setOrganizationName(item.name)
        setOrganizationDescription(item.description ?? '')
      })
      .catch(setError)
    organizationsApi.members(organizationId).then(setMembers).catch(setError)
    organizationsApi.labels(organizationId).then(setLabels).catch(setError)
  }, [organizationId])
  async function updateOrganization(event: React.FormEvent) {
    event.preventDefault()
    try {
      const updated = await organizationsApi.update(organizationId, {
        name: organizationName,
        description: organizationDescription,
      })
      setOrganization(updated)
      setMessage('La organización se actualizó correctamente.')
    } catch (cause) {
      setError(cause)
    }
  }
  async function addMember(event: React.FormEvent) {
    event.preventDefault()
    if (!canManageMembers || !userId.trim()) return
    try {
      const member = await organizationAdminApi.addMember(organizationId, userId)
      setMembers((current) => [...current, member])
      setUserId('')
    } catch (cause) {
      setError(cause)
    }
  }
  async function addLabel(event: React.FormEvent) {
    event.preventDefault()
    try {
      const item = await organizationAdminApi.createLabel(organizationId, {
        name: labelName,
        color: '#83D6C5',
      })
      setLabels((current) => [...current, item])
      setLabelName('')
    } catch (cause) {
      setError(cause)
    }
  }
  async function updateLabel(item: Label) {
    try {
      const updated = await labelsApi.update(item.id, { name: item.name, color: item.color })
      setLabels((current) => current.map((label) => (label.id === item.id ? updated : label)))
      setEditingLabel(null)
    } catch (cause) {
      setError(cause)
    }
  }
  async function deleteLabel(item: Label) {
    if (!window.confirm(`¿Eliminar la etiqueta ${item.name}?`)) return
    try {
      await labelsApi.remove(item.id)
      setLabels((current) => current.filter((label) => label.id !== item.id))
    } catch (cause) {
      setError(cause)
    }
  }
  async function deleteOrganization() {
    if (!isOwner || !window.confirm('¿Eliminar esta organización y todo su contenido?')) return
    try {
      await organizationsApi.remove(organizationId)
      navigate('/app/organizations')
    } catch (cause) {
      setError(cause)
    }
  }
  async function updateRole(member: Member, role: Role) {
    try {
      const updated = await organizationAdminApi.updateMemberRole(
        organizationId,
        member.userId,
        role,
      )
      setMembers((current) =>
        current.map((item) => (item.userId === member.userId ? updated : item)),
      )
    } catch (cause) {
      setError(cause)
    }
  }
  async function removeMember(member: Member) {
    if (!canManageMembers || !window.confirm('¿Quieres retirar a esta persona de la organización?'))
      return
    try {
      await organizationAdminApi.removeMember(organizationId, member.userId)
      setMembers((current) => current.filter((item) => item.userId !== member.userId))
    } catch (cause) {
      setError(cause)
    }
  }
  async function transferOwnership(member: Member) {
    if (
      !isOwner ||
      !window.confirm(`¿Transferir la propiedad a ${member.user?.username ?? member.userId}?`)
    )
      return
    try {
      await organizationAdminApi.transferOwnership(organizationId, member.userId)
      const updated = await organizationsApi.members(organizationId)
      setMembers(updated)
      setMessage('La propiedad se transfirió correctamente.')
    } catch (cause) {
      setError(cause)
    }
  }
  async function leaveOrganization() {
    if (isOwner || !window.confirm('¿Quieres abandonar esta organización?')) return
    try {
      await organizationsApi.leave(organizationId)
      navigate('/app/organizations')
    } catch (cause) {
      setError(cause)
    }
  }
  return (
    <>
      <PageIntro
        eyebrow="Gestión del equipo"
        title="Miembros y etiquetas"
        description="Administra las personas y etiquetas de esta organización."
      />
      {error && <ErrorMessage error={error} />}
      {message && (
        <div className="success-message">
          <Check size={16} />
          {message}
        </div>
      )}
      <section className="panel organization-settings">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Configuración</span>
            <h2>{organization?.name || 'Organización'}</h2>
          </div>
          {isOwner && (
            <button
              className="icon-action danger"
              onClick={deleteOrganization}
              title="Eliminar organización"
              aria-label="Eliminar organización"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
        <form onSubmit={updateOrganization} className="settings-form">
          <Field
            label="Nombre"
            value={organizationName}
            onChange={setOrganizationName}
            placeholder="Nombre de la organización"
          />
          <Field
            label="Descripción"
            value={organizationDescription}
            onChange={setOrganizationDescription}
            placeholder="Describe este espacio"
          />
          <button className="primary" disabled={!canManageMembers}>
            <Save size={16} />
            Guardar cambios
          </button>
        </form>
        <div className="danger-actions">
          <button className="secondary-action" disabled={isOwner} onClick={leaveOrganization}>
            <UserMinus size={15} />
            Abandonar organización
          </button>
          {isOwner && <span className="muted">Transfiere la propiedad antes de abandonar.</span>}
        </div>
      </section>
      <div className="section-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Equipo</span>
              <h2>Miembros</h2>
            </div>
          </div>
          <form onSubmit={addMember} className="inline-form">
            <Field
              label="Identificador de usuario"
              value={userId}
              onChange={setUserId}
              placeholder="ID del usuario"
            />
            <button className="primary" disabled={!canManageMembers}>
              <Plus size={16} />
              Añadir
            </button>
          </form>
          {members.map((member, index) => (
            <div className="list-row" key={`${getMemberIdentity(member) || 'member'}-${index}`}>
              <span className="avatar">
                {(member.user?.username || member.userId).slice(0, 2).toUpperCase()}
              </span>
              <span>
                <strong>{member.user?.username || member.userId}</strong>
                <small>{member.role}</small>
              </span>
              <select
                value={member.role}
                disabled={!canManageMembers || member.userId === user?.id}
                onChange={(event) => updateRole(member, event.target.value as Role)}
                aria-label={`Rol de ${member.user?.username || member.userId}`}
              >
                <option value="OWNER">Propietario</option>
                <option value="ADMIN">Administrador</option>
                <option value="MEMBER">Miembro</option>
                <option value="VIEWER">Lector</option>
              </select>
              {isOwner && member.userId !== user?.id && (
                <button
                  className="icon-action"
                  onClick={() => transferOwnership(member)}
                  title="Transferir propiedad"
                  aria-label="Transferir propiedad"
                >
                  <Crown size={15} />
                </button>
              )}
              {canManageMembers && member.userId !== user?.id && (
                <button
                  className="icon-action danger"
                  onClick={() => removeMember(member)}
                  title="Retirar miembro"
                  aria-label="Retirar miembro"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
          {!members.length && <Empty text="No hay miembros visibles." />}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Etiquetas</span>
              <h2>Etiquetas</h2>
            </div>
          </div>
          <form onSubmit={addLabel} className="inline-form">
            <Field
              label="Nueva etiqueta"
              value={labelName}
              onChange={setLabelName}
              placeholder="Nombre"
            />
            <button className="primary" disabled={!canManageMembers}>
              <Plus size={16} />
              Crear
            </button>
          </form>
          {labels.map((item) => (
            <div className="list-row" key={item.id}>
              <span className="square" style={{ background: item.color }}>
                {item.name.slice(0, 1)}
              </span>
              {editingLabel === item.id ? (
                <input
                  value={item.name}
                  onChange={(event) =>
                    setLabels((current) =>
                      current.map((label) =>
                        label.id === item.id ? { ...label, name: event.target.value } : label,
                      ),
                    )
                  }
                  aria-label="Nombre de etiqueta"
                />
              ) : (
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.color}</small>
                </span>
              )}
              <div className="action-row">
                <button
                  className="icon-action"
                  disabled={!canManageMembers}
                  onClick={() =>
                    editingLabel === item.id ? updateLabel(item) : setEditingLabel(item.id)
                  }
                  aria-label={editingLabel === item.id ? 'Guardar etiqueta' : 'Editar etiqueta'}
                >
                  {editingLabel === item.id ? <Save size={14} /> : <Pencil size={14} />}
                </button>
                <button
                  className="icon-action danger"
                  disabled={!canManageMembers}
                  onClick={() => deleteLabel(item)}
                  aria-label="Eliminar etiqueta"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {!labels.length && <Empty text="No hay etiquetas visibles." />}
        </section>
      </div>
    </>
  )
}
