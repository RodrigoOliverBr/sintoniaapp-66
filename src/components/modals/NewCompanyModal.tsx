
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NewCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyAdded?: () => void;
}

const NewCompanyModal: React.FC<NewCompanyModalProps> = ({
  open,
  onOpenChange,
  onCompanyAdded,
}) => {
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Clear form and error when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setName("");
      setPassword("");
      setErrorMessage("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("O nome da empresa é obrigatório");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Você precisa estar autenticado para adicionar uma empresa");
      }
      
      console.log("Usuário autenticado:", session.user.id);
      console.log("Iniciando processo de cadastro da empresa:", name.trim());
      
      // Adicionar a empresa diretamente via Supabase
      const { data, error } = await supabase
        .from('empresas')
        .insert([{ 
          nome: name.trim(),
          tipo: 'juridica'
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Se uma senha foi fornecida, também criar um registro na tabela clientes_sistema
      if (password.trim() && data) {
        await supabase
          .from('clientes_sistema')
          .insert([{ 
            id: data.id,
            razao_social: name.trim(),
            cnpj: data.cpf_cnpj || '',
            senha: password.trim() 
          }]);
      }
      
      toast.success("Empresa cadastrada com sucesso!");
      
      setName("");
      setPassword("");
      
      // Automatically close the modal after success
      onOpenChange(false);
      
      // Refresh the companies list if callback provided
      if (onCompanyAdded) onCompanyAdded();
    } catch (error: any) {
      console.error("Erro ao cadastrar empresa:", error);
      
      // Set more user-friendly error message
      if (error?.message?.includes("perfil não foi encontrado")) {
        setErrorMessage("Seu perfil não está configurado corretamente. Entre em contato com o suporte.");
      } else if (error?.message?.includes("row-level security")) {
        setErrorMessage("Você não tem permissão para cadastrar empresas. Apenas clientes podem cadastrar empresas.");
      } else {
        setErrorMessage(error?.message || "Não foi possível cadastrar a empresa");
      }
      
      toast.error(error?.message || "Não foi possível cadastrar a empresa");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
            <DialogDescription>
              Preencha o nome da empresa para cadastrá-la
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-sm">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 text-sm"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right text-sm">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3 text-sm"
                placeholder="Digite a senha"
                disabled={isSubmitting}
              />
            </div>
            {errorMessage && (
              <div className="text-red-500 text-sm px-4">{errorMessage}</div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewCompanyModal;
