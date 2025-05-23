
import React from "react";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ContractForm from "./ContractForm";
import { ClienteSistema, Plano, StatusContrato } from "@/types/admin";
import { toast } from "sonner";
import { supabase, ensureAuthenticated } from "@/integrations/supabase/client";

interface EditContractModalProps {
  formClienteId: string;
  setFormClienteId: (value: string) => void;
  formPlanoId: string;
  setFormPlanoId: (value: string) => void;
  formDataInicio: Date;
  setFormDataInicio: (value: Date) => void;
  formDataFim: Date;
  setFormDataFim: (value: Date) => void;
  formDataPrimeiroVencimento: Date;
  setFormDataPrimeiroVencimento: (value: Date) => void;
  formValorMensal: number;
  setFormValorMensal: (value: number) => void;
  formStatus: StatusContrato;
  setFormStatus: (value: StatusContrato) => void;
  formTaxaImplantacao: number;
  setFormTaxaImplantacao: (value: number) => void;
  formObservacoes: string;
  setFormObservacoes: (value: string) => void;
  formNumeroContrato: string;
  setFormNumeroContrato: (value: string) => void;
  clientes: ClienteSistema[];
  planos: Plano[];
  isLoading: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditContractModal: React.FC<EditContractModalProps> = ({
  formClienteId,
  setFormClienteId,
  formPlanoId,
  setFormPlanoId,
  formDataInicio,
  setFormDataInicio,
  formDataFim,
  setFormDataFim,
  formDataPrimeiroVencimento,
  setFormDataPrimeiroVencimento,
  formValorMensal,
  setFormValorMensal,
  formStatus,
  setFormStatus,
  formTaxaImplantacao,
  setFormTaxaImplantacao,
  formObservacoes,
  setFormObservacoes,
  formNumeroContrato,
  setFormNumeroContrato,
  clientes,
  planos,
  isLoading,
  onClose,
  onSave
}) => {
  const validateForm = () => {
    if (!formClienteId) {
      toast.error("Por favor, selecione um cliente");
      return false;
    }
    if (!formPlanoId) {
      toast.error("Por favor, selecione um plano");
      return false;
    }
    if (!formNumeroContrato) {
      toast.error("Por favor, informe o número do contrato");
      return false;
    }
    if (!formDataInicio) {
      toast.error("Por favor, selecione a data de início");
      return false;
    }
    if (!formDataFim) {
      toast.error("Por favor, selecione a data de fim");
      return false;
    }
    if (!formValorMensal || formValorMensal <= 0) {
      toast.error("Por favor, informe um valor mensal válido");
      return false;
    }
    if (!formStatus) {
      toast.error("Por favor, selecione um status");
      return false;
    }
    if (formTaxaImplantacao < 0) {
      toast.error("A taxa de implantação não pode ser negativa");
      return false;
    }
    return true;
  };
  
  const handleSave = async () => {
    console.log("Tentando salvar edição de contrato com dados:", {
      cliente: formClienteId,
      plano: formPlanoId,
      dataInicio: formDataInicio,
      dataFim: formDataFim,
      valor: formValorMensal,
      status: formStatus
    });
    
    // Verificar autenticação antes de salvar
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.error("Usuário não autenticado para salvar contrato");
      toast.error("Você precisa estar autenticado para salvar o contrato");
      return;
    }
    
    // Log da sessão atual para debug
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Sessão atual durante handleSave (EditContractModal):", sessionData?.session?.user?.id);
    
    if (!validateForm()) return;
    onSave();
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Editar Contrato</DialogTitle>
        <DialogDescription>
          Atualize as informações do contrato. Campos com * são obrigatórios.
        </DialogDescription>
      </DialogHeader>
      <ContractForm
        formClienteId={formClienteId}
        setFormClienteId={setFormClienteId}
        formPlanoId={formPlanoId}
        setFormPlanoId={setFormPlanoId}
        formDataInicio={formDataInicio}
        setFormDataInicio={setFormDataInicio}
        formDataFim={formDataFim}
        setFormDataFim={setFormDataFim}
        formDataPrimeiroVencimento={formDataPrimeiroVencimento}
        setFormDataPrimeiroVencimento={setFormDataPrimeiroVencimento}
        formValorMensal={formValorMensal}
        setFormValorMensal={setFormValorMensal}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        formTaxaImplantacao={formTaxaImplantacao}
        setFormTaxaImplantacao={setFormTaxaImplantacao}
        formObservacoes={formObservacoes}
        setFormObservacoes={setFormObservacoes}
        formNumeroContrato={formNumeroContrato}
        setFormNumeroContrato={setFormNumeroContrato}
        clientes={clientes}
        planos={planos}
        isLoading={isLoading}
        validateForm={validateForm}
      />
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default EditContractModal;
