import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { rangePresets } from '@/lib/dashboard';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface Props {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DateRangePicker({ range, onRangeChange }: Props) {
  const [open, setOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const presets = rangePresets();
  const activePreset = presets.find(
    (p) => range.from && range.to && p.range.from && p.range.to && sameDay(p.range.from, range.from) && sameDay(p.range.to, range.to),
  );

  function applyPreset(preset: DateRange) {
    onRangeChange(preset);
    setPendingStart(null);
    setOpen(false);
  }

  function handleSelect(selected: { from?: Date | null; to?: Date | null } | undefined) {
    if (!selected?.from) return;
    if (selected.from && selected.to) {
      onRangeChange({ from: selected.from, to: selected.to });
      setPendingStart(null);
      setOpen(false);
      return;
    }
    if (pendingStart && !sameDay(pendingStart, selected.from)) {
      const from = selected.from < pendingStart ? selected.from : pendingStart;
      const to = selected.from < pendingStart ? pendingStart : selected.from;
      onRangeChange({ from, to });
      setPendingStart(null);
      setOpen(false);
      return;
    }
    onRangeChange({ from: selected.from, to: selected.from });
    setPendingStart(selected.from);
  }

  const isSingleDay = range.from && range.to && sameDay(range.from, range.to);
  const label = activePreset
    ? activePreset.label
    : range.from && range.to
    ? isSingleDay
      ? format(range.from, 'dd/MM/yyyy', { locale: ptBR })
      : `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} — ${format(range.to, 'dd/MM/yyyy', { locale: ptBR })}`
    : 'Selecionar período';

  const selectedValue = range.from && range.to
    ? { from: range.from, to: range.to }
    : pendingStart
      ? { from: pendingStart, to: pendingStart }
      : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start text-left font-normal sm:w-[260px]', !range.from && !range.to && 'text-muted-foreground')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="end">
        <div className="flex flex-wrap gap-1 border-b p-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant={activePreset?.label === preset.label ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => applyPreset(preset.range)}
            >
              {preset.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => { onRangeChange({ from: null, to: null }); setPendingStart(null); setOpen(false); }}>
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        </div>
        <Calendar
          mode="range"
          selected={selectedValue}
          onSelect={handleSelect}
          numberOfMonths={2}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}
