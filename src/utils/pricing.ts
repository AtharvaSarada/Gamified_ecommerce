export interface PriceCalculation {
    originalPrice: number
    discountPercentage: number
    discountAmount: number
    finalPrice: number
    hasDiscount: boolean
}

/**
 * Calculates the final price based on base price and discount percentage.
 * @param basePrice The original price of the product
 * @param discountPercentage The discount percentage (0-100)
 * @returns Object containing price details
 */
export const calculatePrice = (basePrice: number, discountPercentage: number): PriceCalculation => {
    // Input validation and clamping
    const safeBasePrice = Math.max(0, basePrice || 0)
    const safeDiscount = Math.min(100, Math.max(0, discountPercentage || 0))

    const discountAmount = safeBasePrice * (safeDiscount / 100)
    const finalPrice = Math.round(safeBasePrice - discountAmount)

    return {
        originalPrice: Math.round(safeBasePrice),
        discountPercentage: safeDiscount,
        discountAmount: Math.round(discountAmount),
        finalPrice,
        hasDiscount: safeDiscount > 0
    }
}

/**
 * Formats a number as INR currency without decimals.
 * @param price The price to format
 * @returns Formatted string (e.g. "₹1,500")
 */
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    }).format(price)
}
