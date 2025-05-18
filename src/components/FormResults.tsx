
import React, { useEffect, useState, useCallback } from "react";
import { FormResult, Question } from "@/types/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ResultsActions } from "./results/ResultsActions";
import { AnswersChart } from "./charts/AnswersChart";
import { SeverityChart } from "./charts/SeverityChart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { updateAnalystNotes } from "@/services/form/evaluations";
import { toast as sonnerToast } from "sonner";
import { useNavigate } from "react-router-dom";

interface FormResultsProps {
  result: FormResult;
  questions?: Question[];
  onNotesChange: (notes: string) => void;
  isReadOnly?: boolean;
}

const FormResults: React.FC<FormResultsProps> = ({ 
  result, 
  questions = [], 
  onNotesChange, 
  isReadOnly = false 
}) => {
  const [severityCounts, setSeverityCounts] = useState({
    light: 0,
    medium: 0,
    high: 0
  });
  
  const navigate = useNavigate();
  const [notes, setNotes] = useState(result.notas_analista || result.analyistNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Synchronize notes when result changes
  useEffect(() => {
    setNotes(result.notas_analista || result.analyistNotes || '');
  }, [result]);

  const saveNotes = async (value: string) => {
    if (!result.id || isReadOnly) return false;
    
    try {
      setIsSaving(true);
      console.log(`Salvando notas para avaliação ${result.id}: "${value}"`);
      
      // Call API to update notes
      await updateAnalystNotes(result.id, value);
      
      // Update local state through callback
      onNotesChange(value);
      
      sonnerToast.success("Observações salvas com sucesso!");
      console.log("Notas salvas com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
      sonnerToast.error("Não foi possível salvar as observações.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSave = useCallback(async (value: string) => {
    if (!result.id || isReadOnly) return;
    await saveNotes(value);
  }, [result.id, isReadOnly]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setNotes(newValue);
    
    // Update local state immediately
    onNotesChange(newValue);
    
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    if (!isReadOnly) {
      // Debounce to auto-save after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        debouncedSave(newValue);
      }, 2000);
      setSaveTimeout(timeout);
    }
  };

  const handleBlur = async () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    
    if (!isReadOnly && result.id) {
      await debouncedSave(notes);
    }
  };

    // Save pending notes if the component unmounts before the debounced save runs
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      if (!isReadOnly && result.id && notes !== (result.notas_analista || '')) {
        // Persist the latest notes on unmount
        saveNotes(notes);
      }
    };
  }, [saveTimeout, isReadOnly, result.id, notes]);
  
  const calculateActualCounts = () => {
    let yes = 0;
    let no = 0;

    if (result.answers) {
      Object.values(result.answers).forEach(answer => {
        if (answer.answer === true) yes++;
        if (answer.answer === false) no++;
      });
    }
    
    return { yes, no };
  };

  const actualCounts = calculateActualCounts();

  const getYesQuestions = () => {
    if (!result.answers || !questions.length) return [];
    
    const yesQuestions: Question[] = [];
    
    Object.entries(result.answers).forEach(([questionId, answer]) => {
      if (answer.answer === true) {
        const question = questions.find(q => q.id === questionId);
        if (question) {
          yesQuestions.push(question);
        }
      }
    });
    
    return yesQuestions;
  };
  
  const yesQuestions = getYesQuestions();
  
  useEffect(() => {
    const counts = {
      light: 0,
      medium: 0,
      high: 0
    };
    
    if (questions && result.answers) {
      yesQuestions.forEach(question => {
        if (question.risco?.severidade?.nivel) {
          const level = question.risco.severidade.nivel;
          if (level === "LEVEMENTE PREJUDICIAL") {
            counts.light += 1;
          } else if (level === "PREJUDICIAL") {
            counts.medium += 1;
          } else if (level === "EXTREMAMENTE PREJUDICIAL") {
            counts.high += 1;
          }
        }
      });
    }
    
    setSeverityCounts(counts);
  }, [questions, result.answers, yesQuestions]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Data desconhecida";
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Data inválida";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:pt-0">
      <ResultsActions onPrint={handlePrint} />

      {isReadOnly && (
        <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você está visualizando os resultados em modo somente leitura. Para fazer alterações, use o botão "Editar" ou clique em "Sair" para retornar ao formulário.
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Informações da Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de criação</p>
              <p>{formatDate(result.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Última atualização</p>
              <p>{formatDate(result.last_updated || result.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo das Respostas</CardTitle>
          </CardHeader>
          <CardContent>
            <AnswersChart yesCount={actualCounts.yes} noCount={actualCounts.no} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Níveis de Severidade</CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityChart severityCounts={severityCounts} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questões com Resposta "Sim"</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[300px] overflow-y-auto">
          {yesQuestions.length > 0 ? (
            <ul className="space-y-3">
              {yesQuestions.map((question, index) => (
                <li key={question.id} className={index > 0 ? "pt-3 border-t" : ""}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{question.texto}</span>
                  </div>
                  {result.answers?.[question.id]?.observation && (
                    <div className="ml-7 mt-1 text-sm text-gray-600 italic">
                      Observação: {result.answers[question.id].observation}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma questão foi respondida com "Sim".
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Observações e Recomendações do Analista</span>
            {isSaving && !isReadOnly && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>Salvando...</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Digite aqui suas observações e recomendações para melhorar o ambiente psicossocial..."
            className="min-h-[200px]"
            value={notes}
            onChange={handleNotesChange}
            onBlur={handleBlur}
            readOnly={isReadOnly}
          />
          
          {!isReadOnly && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500">
                As observações são salvas automaticamente após você parar de digitar ou ao sair do campo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormResults;
