'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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

  useEffect(() => {
    if (isSignUp && (window as any).turnstile) {
      setTimeout(() => {
        (window as any).turnstile.render('.cf-turnstile');
      }, 100);
    }
  }, [isSignUp]);

  async function handleAuth() {
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      // Logic d'inscription (inchangée)
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
        setMessage('CAPTCHA invalide')
        setLoading(false)
        return
      }

      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) { setMessage('Erreur: ' + authError.message); setLoading(false); return }
      
      if (data.user) {
        await supabase.from('profils').insert({ id: data.user.id, nom_complet: nom, role: 'benevole' })
        setMessage('Compte créé !')
        setTimeout(() => router.push('/dashboard'), 1000)
      }
    } else {
      // --- LOGIQUE DE CONNEXION AVEC VÉRIFICATION 2FA ---
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) { 
        setMessage('Erreur connexion: ' + error.message)
        setLoading(false)
        return 
      }

      if (data?.user) {
        // On vérifie si l'utilisateur possède des facteurs MFA activés
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()

        if (factorsError) {
          console.error("Erreur MFA:", factorsError.message)
          router.push('/dashboard') // Par défaut on laisse passer si erreur technique
          return
        }

        // On cherche les facteurs "toto" qui sont vérifiés
        const verifiedFactors = factors.all.filter(f => f.status === 'verified')

        if (verifiedFactors.length > 0) {
          // L'utilisateur a le 2FA -> On l'envoie vers la page de saisie du code
          setMessage('Vérification 2FA requise...')
          router.push('/auth/mfa') 
        } else {
          // Pas de 2FA -> Accès direct
          router.push('/dashboard')
        }
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Portail Bénévolat</h1>
        <p className="text-gray-500 text-sm mb-8">
          {isSignUp ? 'Créer un compte' : 'Connexion'}
        </p>

        {isSignUp && (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Nom complet</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-1">Mot de passe</label>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {isSignUp && (
          <div className="mb-4 flex justify-center">
            <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}></div>
          </div>
        )}

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Erreur') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
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
          onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
        </button>
      </div>
    </main>
  )
}