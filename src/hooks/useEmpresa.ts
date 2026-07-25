import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Empresa {
  id: string
  nome: string
  cnpj: string | null
  endereco: string | null
  logo_url: string | null
}

// Carrega os dados da empresa do usuario logado (multi-tenant).
export function useEmpresa() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const perfil = await supabase.auth.getUser()
        const userId = perfil.data.user?.id
        if (!userId) {
          setCarregando(false)
          return
        }
        // 1. empresa_id do usuario
        const { data: usuarioRow } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', userId)
          .single()
        if (!usuarioRow?.empresa_id) {
          setCarregando(false)
          return
        }
        // 2. dados da empresa
        const { data: empresaRow } = await supabase
          .from('empresas')
          .select('id, nome, cnpj, endereco, logo_url')
          .eq('id', usuarioRow.empresa_id)
          .single()
        if (empresaRow) setEmpresa(empresaRow as Empresa)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  return { empresa, carregando }
}
