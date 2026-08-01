import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface Props {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const presets: { label: string; days: number }[] = [
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '60 dias', days: 60 },
  { label: '90 dias', days: 90 },
];

export default function DateRangePicker({ range, onRangeChange }: Props) {
  const [open, setOpen] = useState(false);

  function applyPreset(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));
    onRangeChange({ from, to });
    setOpen(false);
  }

  const label = range.from && range.to
    ? `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} — ${format(range.to, 'dd/MM/yyyy', { locale: ptBR })}`
    : 'Selecionar período';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('justify-start text-left font-normal w-[260px]', !range.from && !range.to && 'text-muted-foreground')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex gap-1 p-2 border-b">
          {presets.map((preset) => (
            <Button key={preset.days} variant="ghost" size="sm" onClick={() => applyPreset(preset.days)}>
              {preset.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={range.from && range.to ? { from: range.from, to: range.to } : undefined}
          onSelect={(selected) => {
            if (selected?.from && selected?.to) {
              onRangeChange({ from: selected.from, to: selected.to });
            }
          }}
          numberOfMonths={2}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}
