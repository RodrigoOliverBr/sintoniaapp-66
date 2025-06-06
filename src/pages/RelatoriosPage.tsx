
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilterSection from "@/components/relatorios/FilterSection";
import DiagnosticoIndividual from "@/components/relatorios/DiagnosticoIndividual";
import MapaRiscoPsicossocial from "@/components/relatorios/MapaRiscoPsicossocial";
import RelatorioPGR from "@/components/relatorios/RelatorioPGR";
import { useQuery } from "@tanstack/react-query";
import { getCompanies } from "@/services/company/companyService";
import { getEmployeesByCompany } from "@/services/employee/employeeService";
import { Question, FormResult } from "@/types/form";
import { Company, Employee } from "@/types/cadastro";
import { AvaliacaoResposta, AvaliacaoRisco } from "@/types/avaliacao";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const RelatoriosPage: React.FC = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("diagnostico");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Sample questions and answers for demonstration
  const sampleQuestions: Question[] = [
    {
      id: "q1",
      texto: "Você se sente sobrecarregado no trabalho?",
      secao_id: "s1",
      formulario_id: "f1",
      risco_id: "r1"
    },
    {
      id: "q2",
      texto: "Você tem autonomia para tomar decisões no seu trabalho?",
      secao_id: "s1",
      formulario_id: "f1",
      risco_id: "r2"
    },
    {
      id: "q3",
      texto: "Seu ambiente de trabalho é adequado para suas necessidades?",
      secao_id: "s2",
      formulario_id: "f1",
      risco_id: "r3"
    }
  ];

  const sampleAnswers = {
    q1: true,
    q2: false,
    q3: true
  };

  // Sample risk for demonstration
  const sampleRisco: AvaliacaoRisco = {
    id: "r1",
    texto: "Risco de Estresse",
    severidade: 3
  };
  
  // Sample respostas for demonstration
  const sampleRespostas: AvaliacaoResposta[] = [
    {
      id: "resp1",
      perguntaId: "q1",
      resposta: true,
      observacao: "O funcionário relatou excesso de tarefas"
    },
    {
      id: "resp2",
      perguntaId: "q2",
      resposta: false,
      observacao: "Decisões sempre precisam de aprovação superior"
    },
    {
      id: "resp3",
      perguntaId: "q3",
      resposta: true,
      observacao: ""
    }
  ];

  // Load companies
  useEffect(() => {
    const loadCompaniesData = async () => {
      try {
        const companiesData = await getCompanies();
        setCompanies(companiesData || []);
      } catch (error) {
        console.error("Erro ao carregar empresas:", error);
        toast.error("Erro ao carregar empresas");
      }
    };
    
    loadCompaniesData();
  }, []);

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees", selectedCompanyId],
    queryFn: () => selectedCompanyId ? getEmployeesByCompany(selectedCompanyId) : Promise.resolve([]),
    enabled: !!selectedCompanyId
  });

  // Fetch employee evaluations when employee is selected
  const { data: evaluations = [], isLoading: isLoadingEvaluations } = useQuery({
    queryKey: ["employeeEvaluations", selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return [];
      
      console.log("Fetching evaluations for employee:", selectedEmployeeId);
      try {
        const { data, error } = await supabase
          .from('avaliacoes')
          .select('*, formularios(*)')
          .eq('funcionario_id', selectedEmployeeId);
        
        if (error) throw error;
        console.log("Evaluations fetched:", data);
        return data;
      } catch (error) {
        console.error("Error fetching evaluations:", error);
        toast.error("Erro ao carregar avaliações do funcionário");
        return [];
      }
    },
    enabled: !!selectedEmployeeId
  });

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedEmployeeId("");
    setReportGenerated(false);
  };

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setReportGenerated(false);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setReportGenerated(false);
  };

  const handleGenerateReport = () => {
    if (!selectedCompanyId) {
      toast.warning("Por favor, selecione uma empresa primeiro");
      return;
    }
    
    setIsGenerating(true);
    // Simulate report generation (in a real app, this would fetch data from the API)
    setTimeout(() => {
      setIsGenerating(false);
      setReportGenerated(true);
      toast.success("Relatório gerado com sucesso!");
    }, 1500);
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) || null;

  return (
    <Layout title="Relatórios">
      <div className="space-y-4 px-4 py-6">
        <FilterSection
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          selectedEmployeeId={selectedEmployeeId}
          onCompanyChange={handleCompanyChange}
          onEmployeeChange={handleEmployeeChange}
          onPeriodChange={handlePeriodChange}
          isGenerating={isGenerating}
        />
        
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleGenerateReport} 
            disabled={!selectedCompanyId || isGenerating}
          >
            {isGenerating ? "Gerando..." : "Gerar Relatório"}
          </Button>
        </div>

        {reportGenerated && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="diagnostico">Diagnóstico Individual</TabsTrigger>
              <TabsTrigger value="mapa">Mapa de Risco</TabsTrigger>
              <TabsTrigger value="pgr">Relatório PGR</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnostico" className="mt-0">
              <DiagnosticoIndividual
                risco={sampleRisco}
                respostas={sampleRespostas}
                companyId={selectedCompanyId}
              />
            </TabsContent>

            <TabsContent value="mapa" className="mt-0">
              <MapaRiscoPsicossocial 
                companyId={selectedCompanyId}
                departmentId=""
                dateRange={{ from: new Date(), to: new Date() }}
              />
            </TabsContent>

            <TabsContent value="pgr" className="mt-0">
              {selectedCompany && selectedEmployee ? (
                <RelatorioPGR
                  company={selectedCompany}
                  employee={selectedEmployee}
                  questions={sampleQuestions}
                  answers={sampleAnswers}
                />
              ) : (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  Selecione uma empresa e um funcionário para gerar o relatório PGR.
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {!reportGenerated && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Selecione uma empresa e clique em "Gerar Relatório" para visualizar os resultados.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RelatoriosPage;
