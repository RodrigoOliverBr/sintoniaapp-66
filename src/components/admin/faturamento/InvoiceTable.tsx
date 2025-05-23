
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Fatura } from '@/types/admin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from 'react-router-dom';

interface InvoiceTableProps {
  invoices: Fatura[];
  onEdit?: (invoice: Fatura) => void;
  onDelete?: (invoice: Fatura) => void;
  onStatusChange?: (invoice: Fatura, newStatus: string) => void;
  isLoading?: boolean;
  selectedInvoices?: Record<string, boolean>;
  onSelectInvoice?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  allSelected?: boolean;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ 
  invoices, 
  onEdit,
  onDelete,
  onStatusChange,
  isLoading,
  selectedInvoices = {},
  onSelectInvoice,
  onSelectAll,
  allSelected 
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Data de Emissão</TableHead>
            <TableHead>Data de Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const status = invoice.status;
            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.numero}</TableCell>
                <TableCell>{invoice.clienteName}</TableCell>
                <TableCell>{format(new Date(invoice.dataEmissao), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                <TableCell>{format(new Date(invoice.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                <TableCell>{invoice.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                <TableCell>
                  <Badge variant={
                    status === 'pago' ? 'default' :
                      status === 'atrasado' ? 'destructive' :
                        "secondary"
                  }
                    className={status === 'programada' ? "bg-yellow-500 hover:bg-yellow-600" : ""}>
                    {status === 'programada' ? 'Programada' : status === 'pendente' ? 'Pendente' : status === 'pago' ? 'Pago' : 'Atrasado'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <DotsHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate(`/admin/faturas/${invoice.id}`)}>
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit && onEdit(invoice)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete && onDelete(invoice)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceTable;
