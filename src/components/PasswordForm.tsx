import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

const MIN_LENGTH = 8;

export interface PasswordFormValues {
  current_password?: string;
  new_password: string;
}

interface Props {
  /** true: user changing their own password; false: admin reset (no current password). */
  requireCurrent: boolean;
  isPending: boolean;
  onSubmit: (values: PasswordFormValues) => void;
  submitLabel?: string;
}

export default function PasswordForm({ requireCurrent, isPending, onSubmit, submitLabel = 'Alterar senha' }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const valid =
    (!requireCurrent || currentPassword.length > 0) &&
    newPassword.length >= MIN_LENGTH &&
    newPassword === confirmPassword;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit(requireCurrent ? { current_password: currentPassword, new_password: newPassword } : { new_password: newPassword });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {requireCurrent ? (
        <div className="space-y-2">
          <Label htmlFor="password-current">Senha atual</Label>
          <Input
            id="password-current"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="password-new">Nova senha</Label>
        <Input
          id="password-new"
          type="password"
          autoComplete="new-password"
          placeholder={`Mínimo ${MIN_LENGTH} caracteres`}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={MIN_LENGTH}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-confirm">Confirmar nova senha</Label>
        <Input
          id="password-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={MIN_LENGTH}
        />
        {mismatch ? <p className="text-sm text-destructive">As senhas não coincidem</p> : null}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending || !valid}>
          {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
