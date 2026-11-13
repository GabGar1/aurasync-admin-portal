import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ComponentsTab from '@/components/costs/ComponentsTab';
import SubgroupsTab from '@/components/costs/SubgroupsTab';
import CreditFeeTab from '@/components/costs/CreditFeeTab';
import CostClosingTab from '@/components/costs/CostClosingTab';
import { PageHeader } from '@/components/PageHeader';
import { CostFlowGuide } from '@/components/costs/CostFlowGuide';

export default function Costs() {
  return (
    <div className="flex flex-col space-y-6 p-4 motion-safe:animate-fade-in-up sm:p-6">
      <PageHeader title="Custos" description="Como o AuraSync calcula o custo e o lucro de cada venda" />
      <CostFlowGuide />
      <Tabs defaultValue="components" className="w-full">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="subgroups">Subgrupos</TabsTrigger>
          <TabsTrigger value="credit-fee">Taxa de crédito</TabsTrigger>
          <TabsTrigger value="closing">Fechamento mensal</TabsTrigger>
        </TabsList>
        <TabsContent value="components"><ComponentsTab /></TabsContent>
        <TabsContent value="subgroups"><SubgroupsTab /></TabsContent>
        <TabsContent value="credit-fee"><CreditFeeTab /></TabsContent>
        <TabsContent value="closing"><CostClosingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
