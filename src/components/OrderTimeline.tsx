import { CheckCircle2, XCircle } from "lucide-react";
import { formatTime } from "@/lib/formatters";

interface Props {
  created_at?: string | null;
  paid_at?: string | null;
  shipped_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export default function OrderTimeline({ created_at, paid_at, shipped_at, completed_at, cancelled_at }: Props) {
  if (cancelled_at) {
    return (
      <div className="space-y-3">
        {created_at ? (
          <TimelineStep icon={CheckCircle2} color="text-info" label="Criado" time={formatTime(created_at)} />
        ) : null}
        <TimelineStep icon={XCircle} color="text-destructive" label="Cancelado" time={formatTime(cancelled_at)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {created_at ? (
        <TimelineStep icon={CheckCircle2} color="text-info" label="Criado" time={formatTime(created_at)} />
      ) : null}
      <TimelineStep icon={CheckCircle2} color={paid_at ? "text-success" : "text-muted-foreground/40"} label="Pago" time={paid_at ? formatTime(paid_at) : "Pendente"} />
      <TimelineStep icon={CheckCircle2} color={shipped_at ? "text-success" : "text-muted-foreground/40"} label="Enviado" time={shipped_at ? formatTime(shipped_at) : "Pendente"} />
      <TimelineStep icon={CheckCircle2} color={completed_at ? "text-success" : "text-muted-foreground/40"} label="Entregue" time={completed_at ? formatTime(completed_at) : "Pendente"} />
    </div>
  );
}

function TimelineStep({ icon: Icon, color, label, time }: { icon: React.ComponentType<{ className?: string }>; color: string; label: string; time: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
