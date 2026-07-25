import { Truck } from "lucide-react";

interface Props {
  shipping_city?: string | null;
  shipping_province?: string | null;
  shipping_carrier?: string | null;
}

export default function OrderShippingInfo({ shipping_city, shipping_province, shipping_carrier }: Props) {
  if (!shipping_city && !shipping_province && !shipping_carrier) {
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
    </div>
  );
}
