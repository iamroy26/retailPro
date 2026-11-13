import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PaymentMethodBadge from '@/components/common/PaymentMethodBadge';
import ReceiptView from '@/components/pos/ReceiptView';

export default function SaleDetailDialog({ open, onOpenChange, sale, settings }) {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale {sale.receipt_number}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <PaymentMethodBadge method={sale.payment_method} />
            <span>{sale.item_count || 0} items</span>
          </DialogDescription>
        </DialogHeader>

        <ReceiptView sale={sale} settings={settings} />

        <DialogFooter>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}