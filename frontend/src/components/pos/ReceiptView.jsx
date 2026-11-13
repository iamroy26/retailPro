import { formatCurrency, formatDateTime, paymentMethodLabel } from '@/lib/format';

/**
 * The printable receipt. `id="receipt-print"` is what the print stylesheet
 * lifts onto the paper, so the on-screen page never prints behind it.
 */
export default function ReceiptView({ sale, settings }) {
  if (!sale) return null;
  const items = sale.items ?? [];
  const currency = settings?.currency ?? 'GHS';

  return (
    <div id="receipt-print" className="mx-auto w-full max-w-sm rounded-xl border border-border bg-white p-5 font-mono text-[12px] leading-relaxed text-slate-900">
      <div className="text-center">
        <p className="font-heading text-base font-semibold tracking-tight">{settings?.store_name || 'RetailPro'}</p>
        {settings?.store_tagline && <p className="text-[11px] text-slate-600">{settings.store_tagline}</p>}
        {settings?.store_address && <p className="text-[11px] text-slate-600">{settings.store_address}</p>}
        {settings?.store_phone && <p className="text-[11px] text-slate-600">Tel: {settings.store_phone}</p>}
        {settings?.tin && <p className="text-[11px] text-slate-600">TIN: {settings.tin}</p>}
      </div>

      <div className="my-3 border-t border-dashed border-slate-300" />

      <div className="flex justify-between">
        <span>Receipt</span>
        <span className="font-semibold">{sale.receipt_number}</span>
      </div>
      <div className="flex justify-between">
        <span>Date</span>
        <span>{formatDateTime(sale.sale_date)}</span>
      </div>
      <div className="flex justify-between">
        <span>Served by</span>
        <span>{sale.cashier_name || '—'}</span>
      </div>
      <div className="flex justify-between">
        <span>Customer</span>
        <span>{sale.customer_name || 'Walk-in'}</span>
      </div>

      <div className="my-3 border-t border-dashed border-slate-300" />

      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th className="pb-1 font-normal">Item</th>
            <th className="pb-1 text-right font-normal">Qty</th>
            <th className="pb-1 text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.product_id ?? item.name}-${index}`} className="align-top">
              <td className="pr-2">
                {item.name}
                <span className="block text-[10px] text-slate-500">
                  {formatCurrency(item.unit_price, currency)} each
                </span>
              </td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">{formatCurrency(item.line_total, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-3 border-t border-dashed border-slate-300" />

      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(sale.subtotal, currency)}</span>
        </div>
        {Number(sale.discount) > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(sale.discount, currency)}</span>
          </div>
        )}
        {Number(sale.tax) > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(sale.tax, currency)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-300 pt-1 text-[13px] font-semibold">
          <span>TOTAL</span>
          <span>{formatCurrency(sale.total, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid by</span>
          <span>{paymentMethodLabel(sale.payment_method)}</span>
        </div>
        <div className="flex justify-between">
          <span>Received</span>
          <span>{formatCurrency(sale.amount_received, currency)}</span>
        </div>
        {Number(sale.change_due) > 0 && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{formatCurrency(sale.change_due, currency)}</span>
          </div>
        )}
      </div>

      <div className="my-3 border-t border-dashed border-slate-300" />
      <p className="text-center text-[11px] text-slate-600">
        {settings?.receipt_footer || 'Thank you for shopping with us.'}
      </p>
    </div>
  );
}