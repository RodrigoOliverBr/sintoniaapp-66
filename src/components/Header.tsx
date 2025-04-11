
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getPageTitle = () => {
    if (title) return title;
    
    switch (location.pathname) {
      case "/":
        return "Formulário ISTAS21-BR";
      case "/como-preencher":
        return "Como Preencher o Formulário";
      case "/como-avaliar":
        return "Como Avaliar o Resultado";
      case "/sobre":
        return "Sobre o Formulário ISTAS21-BR";
      case "/mitigacoes":
        return "Guia de Mitigações";
      default:
        return "Formulário ISTAS21-BR";
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("sintonia:userType");
    localStorage.removeItem("sintonia:currentCliente");
    navigate("/login");
  };

  return (
    <header className="bg-white shadow print:hidden relative">
      <div className="mx-auto md:ml-64 px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <img
              src="/lovable-uploads/5fbfce9a-dae3-444b-99c8-9b92040ef7e2.png"
              alt="Sintonia Logo"
              className="h-8 mr-2 md:hidden"
            />
            <h1 className="text-2xl font-bold text-esocial-darkGray">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </Button>
            <div className="p-2">
              <img 
                src="/lovable-uploads/55c55435-602d-4685-ade6-6d83d636842d.png" 
                alt="eSocial Brasil Logo" 
                className="h-12" 
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
