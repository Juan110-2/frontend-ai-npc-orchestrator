'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Pencil, Check, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { adminListUsers, adminUpdateUser, type BackendUserProfile } from '@/lib/backend-api'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  teacher: 'Profesor/a',
  student: 'Estudiante',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  teacher: 'bg-blue-100 text-blue-800 border-blue-200',
  student: 'bg-green-100 text-green-800 border-green-200',
}

type EditingState = {
  userId: string
  role: 'student' | 'teacher' | 'admin'
  fullName: string
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const { userRole, isLoading: authLoading } = useAuth()

  const [users, setUsers] = useState<BackendUserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [saving, setSaving] = useState(false)

  // Guardar solo si es admin
  useEffect(() => {
    if (!authLoading && userRole !== 'admin') {
      router.replace('/')
    }
  }, [authLoading, userRole, router])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const data = await adminListUsers()
      setUsers(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error cargando usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && userRole === 'admin') fetchUsers()
  }, [authLoading, userRole])

  const startEditing = (user: BackendUserProfile) => {
    setEditing({
      userId: user.id,
      role: user.role,
      fullName: user.full_name ?? '',
    })
  }

  const cancelEditing = () => setEditing(null)

  const saveEditing = async () => {
    if (!editing) return
    try {
      setSaving(true)
      const updated = await adminUpdateUser(editing.userId, {
        role: editing.role,
        full_name: editing.fullName || undefined,
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setEditing(null)
      toast.success('Usuario actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error guardando cambios')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || userRole !== 'admin') return null

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <Shield className="h-5 w-5 text-red-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gestión de usuarios</h1>
            <p className="text-sm text-muted-foreground">{users.length} usuarios registrados</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Correo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registrado</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  Cargando usuarios...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isEditing = editing?.userId === user.id
                return (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    {/* Nombre */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input
                          value={editing.fullName}
                          onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                          placeholder="Nombre completo"
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="font-medium">{user.full_name || '—'}</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>

                    {/* Rol */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Select
                          value={editing.role}
                          onValueChange={(v) =>
                            setEditing({ ...editing, role: v as 'student' | 'teacher' | 'admin' })
                          }
                        >
                          <SelectTrigger className="h-8 w-36 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Estudiante</SelectItem>
                            <SelectItem value="teacher">Profesor/a</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      )}
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={saveEditing}
                            disabled={saving}
                            className="h-8"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {saving ? 'Guardando...' : 'Guardar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            disabled={saving}
                            className="h-8"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(user)}
                          className="h-8"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
