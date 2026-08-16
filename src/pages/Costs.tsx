import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ComponentsTab from '@/components/costs/ComponentsTab';
import SubgroupsTab from '@/components/costs/SubgroupsTab';
import CreditFeeTab from '@/components/costs/CreditFeeTab';
import CostClosingTab from '@/components/costs/CostClosingTab';

export default function Costs() {
  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Custos</h1>
        <p className="text-sm text-muted-foreground">Componentes, subgrupos e apuração mensal de custos</p>
      </div>
      <Tabs defaultValue="components" className="w-full">
        <TabsList>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="subgroups">Subgrupos</TabsTrigger>
          <TabsTrigger value="credit-fee">Taxa de Crédito</TabsTrigger>
          <TabsTrigger value="closing">Fechamento Mensal</TabsTrigger>
        </TabsList>
        <TabsContent value="components"><ComponentsTab /></TabsContent>
        <TabsContent value="subgroups"><SubgroupsTab /></TabsContent>
        <TabsContent value="credit-fee"><CreditFeeTab /></TabsContent>
        <TabsContent value="closing"><CostClosingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
