import { Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  shipping_city?: string | null;
  shipping_province?: string | null;
  shipping_carrier?: string | null;
  has_free_shipping?: boolean | null;
}

export default function OrderShippingInfo({ shipping_city, shipping_province, shipping_carrier, has_free_shipping }: Props) {
  if (!shipping_city && !shipping_province && !shipping_carrier && !has_free_shipping) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
        <Truck className="h-8 w-8" />
        <p className="text-sm">Nenhuma informação de frete disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-sm">
      {shipping_city || shipping_province ? (
        <p className="font-medium">
          {[shipping_city, shipping_province].filter(Boolean).join(', ')}
        </p>
      ) : null}
      {shipping_carrier ? (
        <p className="text-muted-foreground">
          Transportadora: {shipping_carrier}
        </p>
      ) : null}
      {has_free_shipping ? (
        <div className="flex items-center gap-1.5 pt-1">
          <Truck className="h-4 w-4 text-green-600" />
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent">
            Frete Grátis
          </Badge>
        </div>
      ) : null}
    </div>
  );
}
