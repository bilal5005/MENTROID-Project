'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  LogOut, 
  Plus, 
  Trash2, 
  X, 
  FolderKanban, 
  Loader2,
  CalendarDays,
  Search,
  LayoutDashboard,
  Pencil,
  ExternalLink
} from 'lucide-react'

type User = {
  id: string
  email: string
  role: string
}

type Tenant = {
  id: string
  name: string
  slug: string
}

type Project = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  projectUrl: string | null
  createdAt: string
  createdById: string
  tenantId: string
  createdBy: {
    id: string
    email: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [meRes, projectsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/projects')
      ])

      if (meRes.status === 401 || projectsRes.status === 401) {
        router.push('/login')
        return
      }

      const meData = await meRes.json()
      const projectsData = await projectsRes.json()

      setUser(meData.user)
      setTenant(meData.tenant)
      
      if (Array.isArray(projectsData)) {
        setProjects(projectsData)
      } else {
        console.error('Projects API returned non-array:', projectsData)
        setError(projectsData.error || 'Failed to fetch projects')
        setProjects([])
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string
    const priority = formData.get('priority') as string
    const projectUrl = formData.get('projectUrl') as string

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status, priority, projectUrl: projectUrl || null })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create project')
      }

      const newProject = await res.json()
      
      if (user) {
        newProject.createdBy = { id: user.id, email: user.email }
      }
      
      setProjects([newProject, ...projects])
      setIsCreateModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleEditProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingProject) return
    
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string
    const priority = formData.get('priority') as string
    const projectUrl = formData.get('projectUrl') as string

    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status, priority, projectUrl: projectUrl || null })
      })

      if (!res.ok) {
        let errorMsg = 'Failed to update project'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {
          // not json
        }
        throw new Error(errorMsg)
      }

      const updatedProject = await res.json()
      
      // Preserve createdBy from previous state
      updatedProject.createdBy = editingProject.createdBy
      
      setProjects(projects.map(p => p.id === editingProject.id ? updatedProject : p))
      setIsEditModalOpen(false)
      setEditingProject(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) return
    
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete project')
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter(p => p.title.toLowerCase().includes(q))
  }, [projects, searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-tr from-slate-200 to-white rounded-lg flex items-center justify-center shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)]">
              <Building2 className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white tracking-tight">{tenant?.name}</span>
              <span className="text-[10px] font-medium text-blue-400 uppercase tracking-widest bg-blue-500/10 w-fit px-1.5 py-0.5 rounded">Tenant Workspace</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="hidden sm:flex items-center space-x-3 bg-slate-900/80 border border-slate-800/60 py-1.5 px-3 rounded-full">
              <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-slate-300">{user?.email}</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold tracking-wider">
                {user?.role}
              </span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-sm flex items-center text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10">
        
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Projects Overview</h1>
            <p className="text-slate-400 mt-1">Manage and track your active initiatives.</p>
          </div>
          
          <button 
            onClick={() => {
              setIsCreateModalOpen(true)
              setError(null)
            }}
            className="bg-white text-slate-950 hover:bg-slate-200 px-5 py-2.5 rounded-xl font-semibold flex items-center transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5 mr-1.5" />
            Add New Project
          </button>
        </div>

        {/* 1-Stat Summary Bar (Reduced bloat) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <LayoutDashboard className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Projects</p>
              <p className="text-2xl font-bold text-white tracking-tight">{projects.length}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search projects by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-500 text-sm"
          />
        </div>

        {projects.length === 0 ? (
          <div className="w-full border border-dashed border-slate-800/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-900/20">
            <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-800">
              <FolderKanban className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 max-w-sm mb-6">Create your first project to get started and collaborate securely within your tenant.</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-slate-800 text-white hover:bg-slate-700 px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              Create first project
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="w-full text-center py-12 text-slate-400">
            No projects found matching "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              
              let statusColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              if (project.status === 'IN_PROGRESS') statusColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              if (project.status === 'COMPLETED') statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              if (project.status === 'PLANNING') statusColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20'

              let priorityColor = 'text-slate-400 bg-slate-500/10 border-slate-500/20'
              if (project.priority === 'HIGH') priorityColor = 'text-red-400 bg-red-500/10 border-red-500/20'
              if (project.priority === 'MEDIUM') priorityColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              if (project.priority === 'LOW') priorityColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'

              return (
                <div key={project.id} className="group relative bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.15)] flex flex-col">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex gap-2">
                        <div className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                          {project.status.replace('_', ' ')}
                        </div>
                        {project.priority && (
                          <div className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${priorityColor}`}>
                            {project.priority}
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">{project.title}</h3>
                    </div>
                    
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => {
                          setEditingProject(project)
                          setIsEditModalOpen(true)
                          setError(null)
                        }}
                        className="text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded p-1.5 transition-colors"
                        title="Edit Project"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      
                      {user?.role === 'ADMIN' && (
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded p-1.5 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {project.projectUrl && (
                    <a 
                      href={project.projectUrl.startsWith('http') ? project.projectUrl : `https://${project.projectUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-1.5 mb-2 text-xs font-medium text-blue-400 bg-blue-950/40 border border-blue-800/50 rounded-md hover:bg-blue-900/50 hover:text-blue-300 transition-colors w-fit"
                    >
                      <span>🔗 {project.projectUrl.includes('youtube.com') || project.projectUrl.includes('youtu.be') ? 'Watch Video' : 'Open Resource / Link'}</span>
                      <ExternalLink className="w-3 h-3"/>
                    </a>
                  )}
                  
                  <p className="text-slate-400 text-sm mb-6 line-clamp-3 flex-grow mt-2">
                    {project.description || <span className="italic text-slate-600">No description provided.</span>}
                  </p>
                  
                  <div className="flex flex-col space-y-4 border-t border-slate-800/60 pt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center">
                        <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="truncate max-w-[120px]" title={project.createdBy?.email}>
                        By {project.createdBy?.email?.split('@')[0]}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">Add New Project</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Project Title <span className="text-red-400">*</span></label>
                <input
                  name="title"
                  type="text"
                  required
                  minLength={2}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-600"
                  placeholder="E.g., Q4 Marketing Campaign"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 ml-1">Status</label>
                  <select 
                    name="status"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-sm appearance-none"
                    defaultValue="PLANNING"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 ml-1">Priority</label>
                  <select 
                    name="priority"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-sm appearance-none"
                    defaultValue="MEDIUM"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Project URL</label>
                <input
                  name="projectUrl"
                  type="url"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-600"
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-none placeholder:text-slate-600"
                  placeholder="Optional details about this project..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-slate-950 hover:bg-slate-200 px-6 py-2.5 rounded-xl font-semibold flex items-center transition-all disabled:opacity-70 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">Edit Project</h2>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingProject(null)
                }}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditProject} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Project Title <span className="text-red-400">*</span></label>
                <input
                  name="title"
                  type="text"
                  required
                  minLength={2}
                  defaultValue={editingProject.title}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 ml-1">Status</label>
                  <select 
                    name="status"
                    defaultValue={editingProject.status}
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-sm appearance-none"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 ml-1">Priority</label>
                  <select 
                    name="priority"
                    defaultValue={editingProject.priority || 'MEDIUM'}
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-sm appearance-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Project URL</label>
                <input
                  name="projectUrl"
                  type="url"
                  defaultValue={editingProject.projectUrl || ''}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-600"
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingProject.description || ''}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-none placeholder:text-slate-600"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingProject(null)
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-2.5 rounded-xl font-semibold flex items-center transition-all disabled:opacity-70 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
