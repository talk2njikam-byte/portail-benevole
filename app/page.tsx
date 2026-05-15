'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [nom, setNom] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // On vérifie si la clé est bien chargée dans la console du navigateur
  console.log("DEBUG - Clé Turnstile actuelle :", process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  // Force le rendu du Turnstile quand on bascule sur l'inscription
  useEffect(() => {
    if (isSignUp && (window as any).turnstile) {
      // On laisse un tout petit délai pour que la div soit bien dans le DOM
      setTimeout(() => {
        (window as any).turnstile.render('.cf-turnstile');
      }, 100);
    }
  }, [isSignUp]);

  async function handleAuth() {
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const captchaToken = (window as any).turnstile?.getResponse()
      if (!captchaToken) {
        setMessage('Veuillez compléter le CAPTCHA')
        setLoading(false)
        return
      }

      const verif = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken })
      })
      const verifData = await verif.json()
      if (!verifData.success) {
        setMessage('CAPTCHA invalide, veuillez réessayer')
        setLoading(false)
        return
      }

      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) { setMessage('Erreur: ' + authError.message); setLoading(false); return }
      if (data.user) {
        const { error: profilError } = await supabase
          .from('profils')
          .insert({ id: data.user.id, nom_complet: nom, role: 'benevole' })
        if (profilError) { setMessage('Erreur profil: ' + profilError.message); setLoading(false); return }
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
      {/* Chargement du script Cloudflare */}
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
        strategy="afterInteractive"
      />
      
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

        {/* Zone du CAPTCHA */}
        {isSignUp && (
          <div className="mb-4 flex justify-center">
            <div
              className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            ></div>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
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
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage('');
          }}
          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
        </button>
      </div>
    </main>
  )
}