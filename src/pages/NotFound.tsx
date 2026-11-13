import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { homePathFor } from '@/lib/permissions';

/** Rendered inside the app layout (with the menu), so a wrong link never strands the user. */
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Compass className="h-7 w-7" aria-hidden />
        </span>
        <p className="text-sm font-medium text-primary">Erro 404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{location.pathname}</code> não existe ou foi movido.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button asChild>
            <Link to={homePathFor(user?.role)}>Ir para o início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
