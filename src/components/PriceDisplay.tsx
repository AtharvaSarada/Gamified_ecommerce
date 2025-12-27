import React from 'react'
import { calculatePrice, formatPrice } from '../utils/pricing'

interface PriceDisplayProps {
    basePrice: number
    discountPercentage?: number
    size?: 'sm' | 'md' | 'lg'
    showBadge?: boolean
    className?: string
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
    basePrice,
    discountPercentage = 0,
    size = 'md',
    showBadge = true,
    className = ''
}) => {
    const {
        originalPrice,
        finalPrice,
        hasDiscount,
        discountPercentage: actualDiscount
    } = calculatePrice(basePrice, discountPercentage)

    const sizeClasses = {
        sm: {
            current: 'text-sm',
            original: 'text-xs',
            badge: 'text-[10px] px-1.5 py-0.5'
        },
        md: {
            current: 'text-lg',
            original: 'text-sm',
            badge: 'text-xs px-2 py-1'
        },
        lg: {
            current: 'text-2xl',
            original: 'text-lg',
            badge: 'text-sm px-2.5 py-1'
        }
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {hasDiscount ? (
                <>
                    <span className={`${sizeClasses[size].original} line-through text-gray-400`}>
                        {formatPrice(originalPrice)}
                    </span>
                    <span className={`${sizeClasses[size].current} font-bold text-cyan-400`}>
                        {formatPrice(finalPrice)}
                    </span>
                    {showBadge && (
                        <span className={`${sizeClasses[size].badge} bg-pink-600 text-white rounded font-medium`}>
                            -{actualDiscount}% OFF
                        </span>
                    )}
                </>
            ) : (
                <span className={`${sizeClasses[size].current} font-bold text-cyan-400`}>
                    {formatPrice(finalPrice)}
                </span>
            )}
        </div>
    )
}
