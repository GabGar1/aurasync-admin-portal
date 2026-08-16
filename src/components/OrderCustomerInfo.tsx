import { User } from "lucide-react";

interface Props {
  customer_name: string | null;
  customer_email?: string | null;
}

export default function OrderCustomerInfo({ customer_name, customer_email }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-primary/10 p-2">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold">{customer_name ?? '-'}</p>
        {customer_email ? (
          <a href={`mailto:${customer_email}`} className="text-sm text-muted-foreground hover:underline">
            {customer_email}
          </a>
        ) : null}
      </div>
    </div>
  );
}
