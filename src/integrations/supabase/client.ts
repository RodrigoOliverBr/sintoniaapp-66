
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from 'sonner';

const SUPABASE_URL = "https://pwkzatbaxdvedrwfyyof.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3phdGJheGR2ZWRyd2Z5eW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNDIzMzEsImV4cCI6MjA1OTcxODMzMX0.5IHPciyaEVstcqcmAHZQUa9zXCzJeo36JERrXeEUpaA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  }
});

// Verificar se o usuário está autenticado e tem o perfil correto
export const checkAdminAuth = async () => {
  try {
    // Verificar sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Erro ao verificar sessão:", sessionError);
      return false;
    }
    
    if (!session) {
      console.error("Sessão não encontrada");
      return false;
    }
    
    // Verificar se o usuário é admin
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('tipo')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (perfilError) {
      console.error("Erro ao verificar perfil:", perfilError);
      return false;
    }
    
    if (!perfil || perfil.tipo !== 'admin') {
      console.error("Usuário não é administrador ou perfil não encontrado");
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Erro ao verificar autenticação:", err);
    return false;
  }
};

// Helper para lidar com erros de RLS
export const handleSupabaseError = (error: any): string => {
  console.error("Erro Supabase detalhado:", error);
  
  if (error?.code === '42501' || error?.message?.includes('permission denied')) {
    return 'Erro de permissão: você não tem autorização para realizar esta ação. Verifique se você está autenticado como administrador.';
  } else if (error?.code === 'auth/email-already-in-use' || error?.message?.includes('already registered')) {
    return 'Este e-mail já está registrado. Por favor, use outro e-mail.';
  } else if (error?.message?.includes('violates row-level security policy')) {
    return 'Erro de permissão: você não tem autorização para realizar esta ação devido às políticas de segurança.';
  } else if (error?.message?.includes('duplicate key')) {
    return 'Um registro com estas informações já existe.';
  } else if (error?.message?.includes('password')) {
    return 'Erro relacionado à senha. Verifique se ela atende aos critérios de segurança.';
  } else {
    return `Erro ao processar solicitação: ${error?.message || 'Desconhecido'}`;
  }
};

// Verificar se há sessão ativa e reconectar se necessário
export const ensureAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log("Não há sessão ativa. Tentando recuperar...");
      
      // Tentar obter sessão atual novamente com refresh
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshResult.session) {
        console.error("Erro ao recuperar sessão:", refreshError);
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return false;
      }
      
      console.log("Sessão recuperada com sucesso após refresh!", refreshResult.session.user.id);
      return true;
    }
    
    console.log("Sessão já estava ativa:", session.user.id);
    
    // Verificar se o usuário é admin para operações de admin
    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (window.location.pathname.includes('/admin/') && (!perfil || perfil.tipo !== 'admin')) {
      console.error("Usuário não é administrador mas está acessando área admin");
      toast.error("Você não tem permissão para acessar esta área");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    toast.error("Erro ao verificar autenticação. Por favor, faça login novamente.");
    return false;
  }
};

// Função auxiliar para debug de autenticação
export const logAuthStatus = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    console.log("Usuário autenticado:", session.user.id);
    
    const { data: perfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
      
    console.log("Perfil do usuário:", perfil);
    
    // Se for cliente, verificar também o status no clientes_sistema
    if (perfil && perfil.tipo.toLowerCase() === 'client') {
      const { data: clienteData } = await supabase
        .from('clientes_sistema')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();
        
      console.log("Dados do cliente:", clienteData);
      console.log("Status do cliente:", clienteData?.situacao);
      
      // Verificar se o status é permitido
      const statusPermitidos = ['liberado', 'ativo'];
      console.log("Cliente pode acessar?", clienteData && statusPermitidos.includes(clienteData.situacao));
    }
    
    return true;
  } else {
    console.log("Usuário não autenticado");
    return false;
  }
};
