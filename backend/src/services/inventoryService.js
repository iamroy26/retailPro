import { prisma } from '../db/prisma.js';
import { AppError } from '../lib/errors.js';
import { finiteNumber, optionalText, requiredText } from '../lib/validation.js';

const MOVEMENT_TYPES = new Set(['purchase', 'adjustment', 'return', 'damage']);

export async function adjustStock(ownerId, actor, body) {
  const productId = requiredText(body?.product_id, 'Product ID', { max: 80 });
  const reason = requiredText(body?.reason, 'Reason', { min: 3, max: 500 });
  const mode = body?.mode === 'delta' ? 'delta' : 'set';
  const quantity = finiteNumber(body?.quantity, 'Quantity', { integer: true });
  const type = MOVEMENT_TYPES.has(body?.type) ? body.type : 'adjustment';
  const reference = optionalText(body?.reference, 'Reference', 80);

  return prisma.$transaction(async (tx) => {
    const records = await tx.$queryRaw`
      SELECT id, owner_id, name, sku, stock_quantity
      FROM products
      WHERE id = ${productId}::uuid AND owner_id = ${ownerId}::uuid
      FOR UPDATE
    `;
    const product = records[0];
    if (!product) throw new AppError('That product no longer exists.', 404);

    let supplierId = null;
    if (body?.supplier_id) {
      const supplier = await tx.supplier.findFirst({
        where: { id: String(body.supplier_id), owner_id: ownerId },
        select: { id: true },
      });
      if (!supplier) throw new AppError('The selected supplier is not available.');
      supplierId = supplier.id;
    }

    const before = Number(product.stock_quantity);
    const after = mode === 'delta' ? before + quantity : quantity;
    if (after < 0) throw new AppError(`${product.name} only has ${before} in stock; quantity cannot go below zero.`);

    const updated = await tx.product.update({
      where: { id: product.id },
      data: { stock_quantity: after },
    });
    const movement = await tx.stockMovement.create({
      data: {
        owner_id: ownerId,
        product_id: product.id,
        supplier_id: supplierId,
        product_name: product.name,
        sku: product.sku ?? '',
        type,
        quantity_change: after - before,
        quantity_before: before,
        quantity_after: after,
        reason,
        reference,
        recorded_by: actor.full_name || actor.email,
      },
    });
    return { product: updated, movement };
  });
}
