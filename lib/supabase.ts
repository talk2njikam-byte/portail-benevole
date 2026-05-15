import { createClient } from '@supabase/supabase-js'

// On récupère les variables d'environnement définies dans ton fichier .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// On crée le client Supabase
// Le mot "export" devant est CRUCIAL pour que les autres fichiers puissent l'utiliser
export const supabase = createClient(supabaseUrl, supabaseAnonKey)