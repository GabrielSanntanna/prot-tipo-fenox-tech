import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee, EmployeeFormData } from '@/types/database';
import { Loader2, RefreshCw } from 'lucide-react';

const formSchema = z.object({
  employee_code: z.string().max(20).optional(),
  first_name: z.string().min(1, 'Nome é obrigatório').max(100),
  last_name: z.string().min(1, 'Sobrenome é obrigatório').max(100),
  email: z.string().email('Email inválido').max(150),
  phone: z.string().max(20).optional(),
  birth_date: z.string().optional(),
  hire_date: z.string().min(1, 'Data de admissão é obrigatória'),
  department_id: z.string().optional(),
  position_id: z.string().optional(),
  manager_id: z.string().optional(),
  salary: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'on_leave', 'terminated']),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN deve ter 4 a 6 dígitos numéricos').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface FormularioColaboradorProps {
  employee?: Employee | null;
  onSubmit: (data: EmployeeFormData) => void;
  isLoading?: boolean;
}

export function FormularioColaborador({ employee, onSubmit, isLoading }: FormularioColaboradorProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_code: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      birth_date: '',
      hire_date: new Date().toISOString().split('T')[0],
      department_id: '',
      position_id: '',
      manager_id: '',
      salary: undefined,
      status: 'active',
      address: '',
      notes: '',
      pin: '',
    },
  });

  const departmentId = form.watch('department_id');
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions(departmentId || undefined);
  const { data: employees } = useEmployees({ status: 'active' });

  // Filter out current employee from managers list
  const availableManagers = employees?.filter(e => e.id !== employee?.id);

  useEffect(() => {
    if (employee) {
      form.reset({
        employee_code: employee.employee_code || '',
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || '',
        birth_date: employee.birth_date || '',
        hire_date: employee.hire_date,
        department_id: employee.department_id || '',
        position_id: employee.position_id || '',
        manager_id: employee.manager_id || '',
        salary: employee.salary || undefined,
        status: employee.status,
        address: employee.address || '',
        notes: employee.notes || '',
        pin: employee.pin || '',
      });
    }
  }, [employee, form]);

  const handleSubmit = (values: FormValues) => {
    const data: EmployeeFormData = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      hire_date: values.hire_date,
      status: values.status,
      employee_code: values.employee_code || undefined,
      phone: values.phone || undefined,
      birth_date: values.birth_date || undefined,
      department_id: values.department_id || undefined,
      position_id: values.position_id || undefined,
      manager_id: values.manager_id || undefined,
      salary: values.salary || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
      pin: values.pin || undefined,
    };
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="João" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sobrenome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="joao.silva@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade - UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Dados Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="employee_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Colaborador</FormLabel>
                  <FormControl>
                    <Input placeholder="EMP001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hire_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Admissão *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions?.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gestor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um gestor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableManagers?.map((mgr) => (
                        <SelectItem key={mgr.id} value={mgr.id}>
                          {mgr.first_name} {mgr.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salário</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="5000.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="on_leave">Afastado</SelectItem>
                      <SelectItem value="terminated">Desligado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN (Ponto Tablet)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="1234"
                        className="font-mono tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                        field.onChange(randomPin);
                      }}
                      title="Gerar PIN aleatório"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o colaborador..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {employee ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
