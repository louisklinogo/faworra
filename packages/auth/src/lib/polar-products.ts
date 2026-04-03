export const POLAR_PRO_PRODUCT_SLUG = "pro";

const POLAR_PRODUCT_ID_PLACEHOLDER = "your-product-id";

export const getPolarCheckoutProducts = (proProductId: string) => {
	const normalizedProductId = proProductId.trim();

	if (normalizedProductId === POLAR_PRODUCT_ID_PLACEHOLDER) {
		throw new Error(
			"Set POLAR_PRO_PRODUCT_ID to a real Polar product id before enabling checkout"
		);
	}

	return [
		{
			productId: normalizedProductId,
			slug: POLAR_PRO_PRODUCT_SLUG,
		},
	];
};
