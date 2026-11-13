import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authApi, getFriendlyError } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AxiosError } from "axios";
import type { LoginPayload } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const mutation = useMutation({
    mutationFn: (payload: LoginForm) => authApi.login(payload as LoginPayload),
    onSuccess: (data) => {
      toast.success("Bem-vindo de volta!");
      login(data.user); // login() already redirects to "/"
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
    <div className="grid h-full overflow-y-auto bg-background lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-[hsl(285_45%_42%)] p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <img src="/brand/logo-mark.png" alt="" className="h-10 w-10 rounded-lg bg-white/90 p-1" />
          <span className="text-xl font-semibold tracking-tight">AuraSync</span>
        </div>
        <div className="max-w-md space-y-5">
          <h2 className="text-3xl font-semibold leading-tight">A gestão da sua loja Nuvemshop em um só lugar.</h2>
          <ul className="space-y-3 text-sm text-primary-foreground/90">
            <li>Pedidos e estoque sincronizados com a loja em tempo real.</li>
            <li>Custo e lucro de cada venda, inclusive as feitas em feiras.</li>
            <li>Painel com receita, ticket médio e margem do período.</li>
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/70">© {new Date().getFullYear()} AuraSync</p>
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center p-6 motion-safe:animate-fade-in-up">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <img src="/brand/logo-mark.png" alt="" className="mx-auto h-12 w-12 lg:hidden" />
            <h1 className="text-2xl font-semibold tracking-tight">Entrar no AuraSync</h1>
            <p className="text-sm text-muted-foreground">Use o e-mail e a senha cadastrados pelo administrador.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    {/* FormControl must wrap the input itself so the label and error messages are linked to it */}
                    <div className="relative">
                      <Mail aria-hidden className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
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
                    <div className="relative">
                      <Lock aria-hidden className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Sua senha"
                          className="pl-10 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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
        </div>
      </main>
    </div>
  );
}
