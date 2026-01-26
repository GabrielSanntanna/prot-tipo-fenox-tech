import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormularioColaborador } from '@/components/rh/FormularioColaborador';
import { useEmployee, useUpdateEmployee } from '@/hooks/useEmployees';
import { EmployeeFormData } from '@/types/database';

export default function EditarColaborador() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id);
  const updateEmployee = useUpdateEmployee();

  const handleSubmit = (data: EmployeeFormData) => {
    if (!id) return;
    updateEmployee.mutate(
      { id, data },
      {
        onSuccess: () => {
          navigate(`/rh/colaboradores/${id}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!employee) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Colaborador não encontrado.</p>
              <Button className="mt-4" onClick={() => navigate('/rh/colaboradores')}>
                Voltar para Lista
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Colaborador</h1>
            <p className="text-muted-foreground">
              {employee.first_name} {employee.last_name}
            </p>
          </div>
        </div>

        {/* Form */}
        <FormularioColaborador
          employee={employee}
          onSubmit={handleSubmit}
          isLoading={updateEmployee.isPending}
        />
      </div>
    </MainLayout>
  );
}
