import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { FormularioColaborador } from '@/components/rh/FormularioColaborador';
import { useCreateEmployee } from '@/hooks/useEmployees';
import { EmployeeFormData } from '@/types/database';

export default function NovoColaborador() {
  const navigate = useNavigate();
  const createEmployee = useCreateEmployee();

  const handleSubmit = (data: EmployeeFormData) => {
    createEmployee.mutate(data, {
      onSuccess: () => {
        navigate('/rh/colaboradores');
      },
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Novo Colaborador</h1>
            <p className="text-muted-foreground">
              Preencha os dados para cadastrar um novo colaborador
            </p>
          </div>
        </div>

        {/* Form */}
        <FormularioColaborador
          onSubmit={handleSubmit}
          isLoading={createEmployee.isPending}
          isEditing={false}
        />
      </div>
    </MainLayout>
  );
}
