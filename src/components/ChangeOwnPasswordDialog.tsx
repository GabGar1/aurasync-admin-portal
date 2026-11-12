import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi, getFriendlyError } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PasswordForm from '@/components/PasswordForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Any signed-in user changes their own password; other devices are signed out, this one stays. */
export default function ChangeOwnPasswordDialog({ open, onOpenChange }: Props) {
  const mutation = useMutation({
    mutationFn: authApi.changeMyPassword,
    onSuccess: () => {
      toast.success('Senha alterada. As sessões em outros dispositivos foram encerradas.');
      onOpenChange(false);
    },
    onError: (err) => toast.error(`Falha ao alterar a senha: ${getFriendlyError(err)}`),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar minha senha</DialogTitle>
          <DialogDescription>Informe a senha atual e escolha uma nova.</DialogDescription>
        </DialogHeader>
        {open ? (
          <PasswordForm
            requireCurrent
            isPending={mutation.isPending}
            onSubmit={(values) => mutation.mutate({ current_password: values.current_password ?? '', new_password: values.new_password })}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
