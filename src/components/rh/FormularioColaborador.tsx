import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { 
  formatDocument, 
  formatPhone, 
  validateDocument, 
  validatePhone, 
  cleanDocument 
} from '@/utils/cpfValidator';
import { validatePin, generateRandomPin, formatPin, maskPin } from '@/utils/pinHash';

const formSchema = z.object({
  employee_code: z.string().max(20).optional(),
  first_name: z.string().min(1, 'Nome é obrigatório').max(100),
  last_name: z.string().min(1, 'Sobrenome é obrigatório').max(100),
  email: z.string().email('Email inválido').max(150),
  phone: z.string()
    .optional()
    .refine((val) => !val || validatePhone(val), {
      message: 'Telefone deve ter 11 dígitos (DDD + número)',
    }),
  birth_date: z.string().optional(),
  hire_date: z.string().min(1, 'Data de admissão é obrigatória'),
  department_id: z.string().optional(),
  position_id: z.string().optional(),
  manager_id: z.string().optional(),
  salary: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'on_leave', 'terminated']),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  pin: z.string()
    .optional()
    .refine((val) => !val || validatePin(val), {
      message: 'PIN deve ter exatamente 4 dígitos numéricos',
    }),
  // FMS new fields
  cpf_cnpj: z.string()
    .min(1, 'CPF/CNPJ é obrigatório')
    .refine((val) => {
      const cleaned = cleanDocument(val);
      return cleaned.length === 11 || cleaned.length === 14;
    }, { message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos' }),
  document_type: z.enum(['cpf', 'cnpj']),
  contract_type: z.enum(['clt', 'pj']),
  payment_type: z.enum(['hourly', 'fixed']),
  work_schedule: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FormularioColaboradorProps {
  employee?: Employee | null;
  onSubmit: (data: EmployeeFormData) => void;
  isLoading?: boolean;
}

export function FormularioColaborador({ employee, onSubmit, isLoading }: FormularioColaboradorProps) {
  const [showPin, setShowPin] = useState(false);
  
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
      cpf_cnpj: '',
      document_type: 'cpf',
      contract_type: 'clt',
      payment_type: 'fixed',
      work_schedule: '',
    },
  });

  const documentType = form.watch('document_type');
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
        pin: '', // Never show existing PIN
        cpf_cnpj: employee.cpf_cnpj || '',
        document_type: employee.document_type || 'cpf',
        contract_type: employee.contract_type || 'clt',
        payment_type: employee.payment_type || 'fixed',
        work_schedule: employee.work_schedule || '',
      });
    }
  }, [employee, form]);

  // Handle CPF/CNPJ formatting
  const handleDocumentChange = (value: string, onChange: (val: string) => void) => {
    const formatted = formatDocument(value, documentType);
    onChange(formatted);
  };

  // Handle phone formatting
  const handlePhoneChange = (value: string, onChange: (val: string) => void) => {
    const formatted = formatPhone(value);
    onChange(formatted);
  };

  // Handle PIN formatting
  const handlePinChange = (value: string, onChange: (val: string) => void) => {
    const formatted = formatPin(value);
    onChange(formatted);
  };

  const handleSubmit = (values: FormValues) => {
    // Validate CPF/CNPJ before submitting
    const cleanedDoc = cleanDocument(values.cpf_cnpj);
    if (!validateDocument(cleanedDoc, values.document_type)) {
      form.setError('cpf_cnpj', { 
        message: values.document_type === 'cpf' ? 'CPF inválido' : 'CNPJ inválido' 
      });
      return;
    }

    const data: EmployeeFormData = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      hire_date: values.hire_date,
      status: values.status,
      employee_code: values.employee_code || undefined,
      phone: values.phone ? cleanDocument(values.phone) : undefined,
      birth_date: values.birth_date || undefined,
      department_id: values.department_id || undefined,
      position_id: values.position_id || undefined,
      manager_id: values.manager_id || undefined,
      salary: values.salary || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
      pin: values.pin || undefined,
      cpf_cnpj: cleanedDoc,
      document_type: values.document_type,
      contract_type: values.contract_type,
      payment_type: values.payment_type,
      work_schedule: values.work_schedule || undefined,
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

            {/* Document Type Selection */}
            <FormField
              control={form.control}
              name="document_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Documento *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cpf" id="cpf" />
                        <label htmlFor="cpf" className="text-sm font-medium cursor-pointer">
                          CPF (Pessoa Física)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cnpj" id="cnpj" />
                        <label htmlFor="cnpj" className="text-sm font-medium cursor-pointer">
                          CNPJ (Pessoa Jurídica)
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CPF/CNPJ Field */}
            <FormField
              control={form.control}
              name="cpf_cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{documentType === 'cpf' ? 'CPF' : 'CNPJ'} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                      value={field.value}
                      onChange={(e) => handleDocumentChange(e.target.value, field.onChange)}
                      maxLength={documentType === 'cpf' ? 14 : 18}
                    />
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
                  <FormLabel>Telefone *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={field.value}
                      onChange={(e) => handlePhoneChange(e.target.value, field.onChange)}
                      maxLength={15}
                    />
                  </FormControl>
                  <FormDescription>11 dígitos com DDD</FormDescription>
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

        {/* Dados Contratuais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Contratuais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contract_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contrato *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="clt">CLT</SelectItem>
                      <SelectItem value="pj">PJ (Pessoa Jurídica)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Pagamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">Salário Fixo</SelectItem>
                      <SelectItem value="hourly">Horista</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="work_schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário de Trabalho</FormLabel>
                  <FormControl>
                    <Input placeholder="08:00 às 17:00" {...field} />
                  </FormControl>
                  <FormDescription>Ex: 08:00 às 17:00 (1h almoço)</FormDescription>
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
            
            {/* PIN Field - Only visible to RH */}
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN (Ponto Tablet) *</FormLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FormControl>
                        <Input
                          type={showPin ? 'text' : 'password'}
                          inputMode="numeric"
                          maxLength={4}
                          placeholder={employee ? '****' : '0000'}
                          className="font-mono tracking-widest pr-10"
                          value={field.value}
                          onChange={(e) => handlePinChange(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const randomPin = generateRandomPin();
                        field.onChange(randomPin);
                        setShowPin(true); // Show the generated PIN
                      }}
                      title="Gerar PIN aleatório"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    Exatamente 4 dígitos numéricos
                    {employee && ' (deixe vazio para manter o atual)'}
                  </FormDescription>
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
