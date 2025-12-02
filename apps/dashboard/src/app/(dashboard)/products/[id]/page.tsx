import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { ProductDetailsView } from "./_components/product-details-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params;
  const teamId = await getCurrentTeamId(); // Verify auth
  if (!teamId) {
    // In case layout didn't redirect
    return null;
  }

  // Server-side initial data (parity with initialData pattern)
  const {
    products: productsTbl,
    productVariants,
    productMedia,
    and,
    eq,
    isNull,
    asc,
  } = await import("@Faworra/database/schema");

  const productRows = await db
    .select({
      id: productsTbl.id,
      teamId: productsTbl.teamId,
      name: productsTbl.name,
      status: productsTbl.status,
      type: productsTbl.type,
      categorySlug: productsTbl.categorySlug,
      description: productsTbl.description,
      updatedAt: productsTbl.updatedAt,
      createdAt: productsTbl.createdAt,
    })
    .from(productsTbl)
    .where(and(eq(productsTbl.teamId, teamId), eq(productsTbl.id, id), isNull(productsTbl.deletedAt)))
    .limit(1);
  const product = productRows[0] || null;

  let initialData: any = null;
  if (product) {
    const variants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        name: productVariants.name,
        sku: productVariants.sku,
        barcode: productVariants.barcode,
        price: productVariants.price,
        currency: productVariants.currency,
        status: productVariants.status,
        fulfillmentType: productVariants.fulfillmentType,
        stockManaged: productVariants.stockManaged,
        leadTimeDays: productVariants.leadTimeDays,
        updatedAt: productVariants.updatedAt,
      })
      .from(productVariants)
      .where(and(eq(productVariants.teamId, teamId), eq(productVariants.productId, id)));

    const media = await db
      .select({
        id: productMedia.id,
        productId: productMedia.productId,
        path: productMedia.path,
        alt: productMedia.alt,
        isPrimary: productMedia.isPrimary,
        position: productMedia.position,
        width: productMedia.width,
        height: productMedia.height,
      })
      .from(productMedia)
      .where(eq(productMedia.productId, id))
      .orderBy(asc(productMedia.position));

    initialData = { product, variants, media } as const;
  }

  return <ProductDetailsView initialData={initialData || undefined} productId={id} />;
}
