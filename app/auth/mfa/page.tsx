'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function VerifyMFAPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const verifyCode = async () => {
    // 1. Récupérer les facteurs MFA de l'utilisateur
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const factor = factors?.all[0] // On prend le premier facteur trouvé

    if (!factor) return

    // 2. Créer un challenge
    const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id })
    
    // 3. Vérifier le code
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.data!.id,
      code
    })

    if (verifyError) {
      setError("Code incorrect")
    } else {
      router.push('/dashboard') // Succès ! Direction le dashboard
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Vérification 2FA</h1>
        <p className="text-sm text-gray-500 mb-6">Entrez le code de votre application Authenticator.</p>
        <input 
          type="text" 
          value={code} 
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest mb-4"
          maxLength={6}
        />
        <button onClick={verifyCode} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
          Vérifier
        </button>
        {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
      </div>
    </div>
  )
}