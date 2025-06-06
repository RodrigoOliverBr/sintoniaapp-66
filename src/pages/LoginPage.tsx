
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Verificar se já existe uma sessão ativa
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("Sessão existente encontrada:", session.user.id);
        // Verificar o tipo de usuário para redirecionar
        const { data: perfilData } = await supabase
          .from('perfis')
          .select('tipo')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (perfilData) {
          localStorage.setItem("sintonia:userType", perfilData.tipo.toLowerCase());
          
          if (perfilData.tipo.toLowerCase() === 'admin') {
            navigate('/admin/dashboard');
          } else {
            // Buscar dados do cliente
            const { data: clienteData } = await supabase
              .from('clientes_sistema')
              .select('*')
              .eq('email', session.user.email)
              .maybeSingle();
              
            if (clienteData) {
              localStorage.setItem("sintonia:currentCliente", JSON.stringify(clienteData));
            }
            
            navigate('/');
          }
        }
      }
    };
    
    checkExistingSession();
  }, [navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("Tentando login com:", email);
      
      // Fazer login com as credenciais fornecidas
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (authError) {
        console.error("Erro de autenticação Supabase:", authError);
        throw new Error(authError.message);
      }
      
      if (!authData?.user) {
        throw new Error("Não foi possível autenticar o usuário");
      }
      
      console.log("Usuário autenticado com sucesso:", authData.user);
      console.log("Sessão completa:", authData.session);
      
      // Buscar o perfil do usuário para confirmar seu tipo (admin ou client)
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      
      if (perfilError) {
        console.error("Erro ao obter perfil:", perfilError);
        await supabase.auth.signOut();
        throw new Error("Erro ao buscar perfil de usuário");
      }
      
      console.log("Perfil encontrado:", perfilData);
      
      if (!perfilData) {
        await supabase.auth.signOut();
        throw new Error("Seu perfil não foi encontrado no sistema. Por favor, contate o suporte.");
      }
      
      // Normalizar o tipo de usuário (garantindo case-insensitive)
      const userType = perfilData.tipo?.toLowerCase();
      console.log("Tipo de usuário normalizado:", userType);
      
      if (!userType || (userType !== 'admin' && userType !== 'client')) {
        console.error("Tipo de usuário inválido:", userType);
        await supabase.auth.signOut();
        throw new Error("Tipo de usuário inválido. Por favor, contate o suporte.");
      }
      
      // Definir tipo de usuário no local storage
      localStorage.setItem("sintonia:userType", userType);
      
      if (userType === 'client') {
        // Se for cliente, verificar status
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes_sistema')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        
        console.log("Dados do cliente:", clienteData);
        
        if (clienteError) {
          console.error("Erro ao buscar dados do cliente:", clienteError);
          await supabase.auth.signOut();
          throw new Error("Erro ao verificar status do cliente");
        }
        
        if (!clienteData) {
          await supabase.auth.signOut();
          throw new Error("Dados do cliente não encontrados. Verifique se o email está correto.");
        }
        
        // Array com status permitidos para login
        const statusPermitidos = ['liberado', 'ativo'];
        console.log("Status do cliente:", clienteData.situacao);
        console.log("Status permitidos:", statusPermitidos);
        console.log("Cliente pode logar?", statusPermitidos.includes(clienteData.situacao));
        
        if (!statusPermitidos.includes(clienteData.situacao)) {
          await supabase.auth.signOut();
          throw new Error(`Seu acesso está ${clienteData.situacao}. Entre em contato com o administrador.`);
        }
        
        localStorage.setItem("sintonia:currentCliente", JSON.stringify(clienteData));
      }
      
      toast.success(`Login realizado com sucesso como ${userType === 'admin' ? 'Administrador' : 'Cliente'}`);
      
      // Redirecionar com pequeno delay para garantir que o toast seja exibido
      setTimeout(() => {
        if (userType === 'admin') {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
        setIsLoading(false);
      }, 1000);
      
    } catch (error: any) {
      console.error("Erro no processo de login:", error);
      toast.error(error.message || "Credenciais inválidas. Verifique seu e-mail e senha.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/5fbfce9a-dae3-444b-99c8-9b92040ef7e2.png" 
              alt="Logo" 
              className="h-16" 
            />
          </div>
          <p className="text-gray-500 mt-2">Faça login para acessar o sistema</p>
        </div>

        <Card>
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Acesse o sistema com suas credenciais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="Digite seu e-mail" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Digite sua senha" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Carregando..." : "Entrar"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">© 2025 eSocial Brasil. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
