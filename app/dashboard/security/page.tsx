'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { QRCodeSVG } from 'qrcode.react'

export default function SecurityPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [factorId, setFactorId] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [message, setMessage] = useState('')

  const onEnroll = async () => {
    setMessage("Génération en cours...")
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'Portail Bénévolat',
      friendlyName: 'Mobile ' + Math.floor(Math.random() * 1000)
    })

    if (error) {
      setMessage(`Erreur : ${error.message}`)
      return
    }

    setFactorId(data.id)
    // Supabase renvoie parfois le SVG directement dans data.totp.qr_code
    setQrCodeUrl(data.totp.qr_code)
    setMessage("Code généré. Scannez-le pour continuer.")
  }

  const onVerify = async () => {
    const challenge = await supabase.auth.mfa.challenge({ factorId })
    if (challenge.error) {
      setMessage(`Erreur : ${challenge.error.message}`)
      return
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: verifyCode
    })

    if (error) {
      setMessage("Code incorrect.")
    } else {
      setMessage("✅ Double authentification activée !")
      setQrCodeUrl('')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 border border-gray-200">
      <h1 className="text-xl font-bold mb-6 text-center">Sécurité & 2FA</h1>
      
      {!qrCodeUrl ? (
        <button onClick={onEnroll} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
          Activer le 2FA
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500 text-center">
            Scannez ce code avec Google Authenticator
          </p>

          <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
            {/* Si c'est une URL otpauth, on dessine le QR Code */}
            {qrCodeUrl.startsWith('otpauth://') ? (
              <QRCodeSVG value={qrCodeUrl} size={180} />
            ) : (
              /* Si Supabase envoie déjà du SVG (ce qui arrive souvent), on l'affiche directement */
              <div dangerouslySetInnerHTML={{ __html: qrCodeUrl }} className="w-[180px] h-[180px]" />
            )}
          </div>

          <input 
            type="text"
            placeholder="Entrez le code à 6 chiffres"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            className="w-full mt-4 border border-gray-300 p-3 rounded-lg text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
            maxLength={6}
          />

          <button onClick={onVerify} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
            Vérifier et Valider
          </button>
        </div>
      )}
      
      {message && <p className="mt-4 text-center text-sm font-medium text-blue-600">{message}</p>}
    </div>
  )
}