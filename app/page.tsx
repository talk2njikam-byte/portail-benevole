'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [nom, setNom] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAuth() {
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      // ÉTAPE 1 : créer le compte auth
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      
      if (authError) {
        setMessage('Erreur auth: ' + authError.message)
        setLoading(false)
        return
      }

      console.log('User créé:', data.user)

      // ÉTAPE 2 : créer le profil
      if (data.user) {
        const { error: profilError } = await supabase
          .from('profils')
          .insert({
            id: data.user.id,
            nom_complet: nom,
            role: 'benevole'
          })

        if (profilError) {
          // Affiche l'erreur exacte
          setMessage('Erreur profil: ' + profilError.message + ' | Code: ' + profilError.code + ' | Détail: ' + profilError.details)
          setLoading(false)
          return
        }

        setMessage('Compte créé avec succès !')
        setTimeout(() => router.push('/dashboard'), 1000)
      }

    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage('Erreur connexion: ' + error.message); setLoading(false); return }
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Portail Bénévolat</h1>
        <p className="text-gray-500 text-sm mb-8">
          {isSignUp ? 'Créer un compte bénévole' : 'Connectez-vous à votre compte'}
        </p>

        {isSignUp && (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Nom complet</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              placeholder="Jean Tremblay"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            placeholder="jean@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-1">Mot de passe</label>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {message && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 break-all">
            {message}
          </div>
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
        </button>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
        </button>
      </div>
    </main>
  )
}