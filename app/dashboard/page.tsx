'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Profil = {
  nom_complet: string
  role: string
  departement_id: string | null
}

type Departement = {
  id: string
  nom: string
  organismes: { nom: string } | { nom: string }[] | null
}

export default function Dashboard() {
  const [profil, setProfil] = useState<Profil | null>(null)
  const [departements, setDepartements] = useState<Departement[]>([])
  const [selectedDep, setSelectedDep] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function getOrganismeNom(org: { nom: string } | { nom: string }[] | null): string {
    if (!org) return ''
    if (Array.isArray(org)) return org[0]?.nom || ''
    return org.nom
  }

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profilData } = await supabase
        .from('profils')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfil(profilData)
      if (profilData?.departement_id) setSelectedDep(profilData.departement_id)

      const { data: deps } = await supabase
        .from('departements')
        .select('id, nom, organismes(nom)')
      setDepartements((deps as Departement[]) || [])
    }
    loadData()
  }, [])

  async function sauvegarderDepartement() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profils')
      .update({ departement_id: selectedDep })
      .eq('id', user.id)
    setMessage(error ? 'Erreur lors de la sauvegarde.' : 'Département sauvegardé !')
    setTimeout(() => setMessage(''), 3000)
  }

  async function seDeconnecter() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!profil) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              Bonjour, {profil.nom_complet} 👋
            </h1>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 capitalize">
              {profil.role}
            </span>
          </div>
          <button
            onClick={seDeconnecter}
            className="text-sm text-gray-400 hover:text-gray-700"
          >
            Déconnexion
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Choisir mon département
          </h2>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 mb-4"
            value={selectedDep}
            onChange={e => setSelectedDep(e.target.value)}
          >
            <option value="">-- Sélectionner un département --</option>
            {departements.map(dep => (
              <option key={dep.id} value={dep.id}>
                {getOrganismeNom(dep.organismes)} — {dep.nom}
              </option>
            ))}
          </select>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
              {message}
            </div>
          )}

          <button
            onClick={sauvegarderDepartement}
            disabled={!selectedDep}
            className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            Sauvegarder
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Départements disponibles
          </h2>
          <div className="space-y-2">
            {departements.map(dep => (
              <div key={dep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{dep.nom}</span>
                <span className="text-xs text-gray-400">{getOrganismeNom(dep.organismes)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}