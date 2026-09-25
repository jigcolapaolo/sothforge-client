'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Boxes, ChevronRight, LayoutDashboard, LogOut, Menu, Search, Users, X } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { boardsApi, organizationsApi, projectsApi, type Organization } from '@/lib/api'
import { useAuth } from '@/lib/auth'

type SearchResult = { id: string; title: string; kind: string; href: string; searchableText: string }

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobile, setMobile] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [orgId, setOrgId] = useState('')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchPath, setSearchPath] = useState(location.pathname)
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchCache = useRef(new Map<string, Promise<SearchResult[]>>())
  const searchWrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    organizationsApi
      .list()
      .then((items) => {
        setOrganizations(items)
        setOrgId(items[0]?.id ?? '')
      })
      .catch(() => undefined)
  }, [])
  useEffect(() => {
    function closeSearch(event: MouseEvent) {
      if (searchWrap.current && !searchWrap.current.contains(event.target as Node))
        setSearchOpen(false)
    }
    document.addEventListener('mousedown', closeSearch)
    return () => document.removeEventListener('mousedown', closeSearch)
  }, [])

  useEffect(() => {
    if (!orgId) return
    let active = true
    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        let request = searchCache.current.get(orgId)
        if (!request) {
          request = (async () => {
            const projects = await organizationsApi.projects(orgId)
            const projectResults: SearchResult[] = projects.map((project) => ({
              id: project.id,
              title: project.name,
              kind: 'Proyecto',
              href: `/app/projects/${project.id}`,
              searchableText: `${project.name} ${project.description ?? ''}`.toLowerCase(),
            }))
            const boardGroups = await Promise.all(
              projects.map(async (project) => ({
                project,
                boards: await projectsApi.boards(project.id),
              })),
            )
            const boardResults: SearchResult[] = boardGroups.flatMap(({ project, boards }) =>
              boards.map((board) => ({
                id: board.id,
                title: board.name,
                kind: `Tablero · ${project.name}`,
                href: `/app/boards/${board.id}`,
                searchableText: `${board.name} ${board.description ?? ''}`.toLowerCase(),
              })),
            )
            const taskGroups = await Promise.all(
              boardGroups
                .flatMap(({ boards }) => boards)
                .map(async (board) => ({ board, tasks: await boardsApi.tasks(board.id) })),
            )
            const taskResults: SearchResult[] = taskGroups.flatMap(({ board, tasks }) =>
              tasks.map((task) => ({
                id: task.id,
                title: task.title,
                kind: `Tarea · ${board.name}`,
                href: `/app/tasks/${task.id}`,
                searchableText: `${task.title} ${task.description ?? ''}`.toLowerCase(),
              })),
            )
            return [...projectResults, ...boardResults, ...taskResults]
          })()
          searchCache.current.set(orgId, request)
        }
        if (active) setSearchIndex(await request)
      } catch {
        if (active) setSearchIndex([])
      } finally {
        if (active) setSearching(false)
      }
    }, 260)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [orgId])
  const activeQuery = searchPath === location.pathname ? query : ''
  const searchResults = useMemo(() => {
    const normalizedQuery = activeQuery.trim().toLowerCase()
    if (normalizedQuery.length < 2) return []
    return searchIndex
      .filter((result) => result.searchableText.includes(normalizedQuery))
      .slice(0, 12)
  }, [activeQuery, searchIndex])
  return (
    <div className="shell">
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-top">
          <Link to="/app" className="brand">
            <span className="brand-mark">S</span>
            <span>SothForge</span>
          </Link>
          <button
            className="icon mobile-only"
            onClick={() => setMobile(false)}
            aria-label="Cerrar menu"
          >
            <X size={18} />
          </button>
        </div>
        <label className="org-select">
          <span>Organización activa</span>
          <select value={orgId} onChange={(event) => setOrgId(event.target.value)}>
            <option value="">Sin organizaciones</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
        <nav>
          <p className="nav-label">Espacio de trabajo</p>
          <Link className={location.pathname === '/app' ? 'nav-link active' : 'nav-link'} to="/app">
            <LayoutDashboard size={17} />
            Resumen
          </Link>
          {orgId && (
            <>
              <Link
                className={location.pathname.includes('/projects') ? 'nav-link active' : 'nav-link'}
                to={`/app/organizations/${orgId}/projects`}
              >
                <Boxes size={17} />
                Proyectos
              </Link>
              <Link
                className={location.pathname.includes('/manage') ? 'nav-link active' : 'nav-link'}
                to={`/app/organizations/${orgId}/manage`}
              >
                <Users size={17} />
                Equipo y etiquetas
              </Link>
            </>
          )}
          <Link className="nav-link" to="/app/organizations">
            <Users size={17} />
            Organizaciones
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <Link to="/app/profile" className="profile-link">
              <span className="avatar">{user?.username.slice(0, 2).toUpperCase()}</span>
              <span>
                <strong>{user?.username}</strong>
                <small>{user?.email}</small>
              </span>
            </Link>
          </div>
          <button className="nav-link logout" onClick={logout}>
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      {mobile && (
        <button className="overlay" onClick={() => setMobile(false)} aria-label="Cerrar menu" />
      )}
      <div className="content">
        <header className="topbar">
          <button
            className="icon mobile-only"
            onClick={() => setMobile(true)}
            aria-label="Abrir menu"
          >
            <Menu size={19} />
          </button>
          <div className="crumb">
            SothForge <ChevronRight size={14} />{' '}
            <span>
              {location.pathname.includes('boards')
                ? 'Tablero'
                : location.pathname.includes('projects')
                  ? 'Proyectos'
                  : 'Resumen'}
            </span>
          </div>
          <div className="top-actions">
            <div className="search-wrap" ref={searchWrap}>
              <div className="search">
                <Search size={15} />
                <input
                  value={activeQuery}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => {
                    setSearchPath(location.pathname)
                    setSearchOpen(true)
                  }}
                  placeholder="Buscar en tu espacio"
                  aria-label="Buscar en tu espacio"
                />
              </div>
              {searchOpen && searchPath === location.pathname && activeQuery.trim().length >= 2 && (
                <div className="search-results">
                  {searching ? (
                    <div className="search-state">Buscando...</div>
                  ) : searchResults.length ? (
                    searchResults.map((result) => (
                      <Link
                        key={`${result.kind}-${result.id}`}
                        to={result.href}
                        className="search-result"
                        onClick={() => setQuery('')}
                      >
                        <span className="search-result-kind">{result.kind}</span>
                        <strong>{result.title}</strong>
                      </Link>
                    ))
                  ) : (
                    <div className="search-state">No encontramos resultados.</div>
                  )}
                </div>
              )}
            </div>
            <span className="avatar">{user?.username.slice(0, 2).toUpperCase()}</span>
          </div>
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
