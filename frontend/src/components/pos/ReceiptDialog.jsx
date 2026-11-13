import { CheckCircle2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReceiptView from './ReceiptView';

export default function ReceiptDialog({ open, onOpenChange, sale, settings, onStartNext }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Sale {sale?.receipt_number ? `#${sale.receipt_number}` : ''} recorded
          </DialogTitle>
        </DialogHeader>

        <ReceiptView sale={sale} settings={settings} />

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          This receipt reflects the sale and stock changes saved in the store database. Card and Mobile Money
          payments are recorded here; payment processing is handled separately by your payment provider.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print receipt
          </Button>
          <Button onClick={onStartNext}>Start next sale</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
