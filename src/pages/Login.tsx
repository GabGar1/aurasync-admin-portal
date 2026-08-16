import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, LogIn, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authApi, getFriendlyError } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AxiosError } from "axios";
import type { LoginPayload } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Informe um email válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const mutation = useMutation({
    mutationFn: (payload: LoginForm) => authApi.login(payload as LoginPayload),
    onSuccess: (data) => {
      toast.success("Bem-vindo de volta!");
      login(data.token, data.user);
      navigate("/");
    },
    onError: (error) => {
      form.clearErrors("root");
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          setCooldownSeconds(60);
          form.setError("root", { message: "Muitas tentativas. Tente novamente em instantes." });
        } else if (error.response?.status === 401) {
          form.setError("root", { message: getFriendlyError(error) });
        } else if (!error.response) {
          form.setError("root", { message: "Erro de conexão. Verifique sua internet." });
        } else {
          form.setError("root", { message: "Ocorreu um erro inesperado. Tente novamente." });
        }
      } else {
        form.setError("root", { message: "Ocorreu um erro inesperado. Tente novamente." });
      }
    },
  });

  const onSubmit = (data: LoginForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background motion-safe:animate-fade-in-up">
      <Card className="w-full max-w-md border-t-4 border-t-primary">
        <div className="text-center mt-6 mb-2">
          <h1 className="text-2xl font-bold" style={{ color: "#9966CC" }}>AuraSync</h1>
          <p className="text-sm text-muted-foreground">Sistema de gerenciamento de e-commerce</p>
        </div>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Email"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Senha"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending || cooldownSeconds > 0}>
                {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Entrando...</> : cooldownSeconds > 0 ? `Aguarde ${cooldownSeconds}s` : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
