import React from 'react';
import realFoodsGrid from '../assets/foods.webp';
import realSaladPizzaGrid from '../assets/salad-pizza.webp';

interface RealFoodPhotoProps {
  id: string;
  size?: number;
  className?: string;
}

/**
 * RealFoodPhoto renders genuine, high-resolution food photography for all 10 items:
 * - 8 Wheel Items from realFoodsGrid (Tomato, Shrimp, Fish, Steak, Chicken, Carrot, Broccoli, Corn)
 * - 2 Special Items from realSaladPizzaGrid (Salad, Pizza)
 * 
 * Precisely mapped coordinates ensure the food item appears 100% complete and unclipped (بدون تقطيع).
 */
export const RealFoodPhoto: React.FC<RealFoodPhotoProps> = ({ id, size = 52, className = '' }) => {
  const getStyle = (): React.CSSProperties => {
    switch (id) {
      // 1. Tomato (طماطم حقيقية) - Row 1, Col 1
      case 'tomato':
        return {
          backgroundImage: `url(${realFoodsGrid})`,
          backgroundPosition: '1.5% 4%',
          backgroundSize: '430% 215%',
          backgroundRepeat: 'no-repeat',
        };

      // 2. Shrimp / Gambari (جنبري / روبيان حقيقي) - Row 1, Col 2
      case 'shrimp':
        return {
          backgroundImage: `url(${realFoodsGrid})`,
          backgroundPosition: '33.8% 3.5%',
          backgroundSize: '430% 215%',
          backgroundRepeat: 'no-repeat',
        };

      // 3. Fish (سمك حقيقي) - Row 1, Col 3
      case 'fish':
        return {
          backgroundImage: `url(${realFoodsGrid})`,
          backgroundPosition: '66.2% 4.5%',
          backgroundSize: '430% 215%',
          backgroundRepeat: 'no-repeat',
        };

      // 4. Steak / Meat (ستيك / لحم حقيقي) - Row 1, Col 4
      case 'meat':
        return {
          backgroundImage: `url(${realFoodsGrid})`,
          backgroundPosition: '98.5% 3.5%',
          backgroundSize: '430% 215%',
          backgroundRepeat: 'no-repeat',
        };

      // 5. Chicken (دجاج حقيقي) - Row 2, Col 1
      case 'chicken':
        return {
          backgroundImage: `url(${realFoodsGrid})`,
          backgroundPosition: '1.5% 95%',
          backgroundSize: '430% 215%',
          backgroundRepeat: 'no-repeat',
        };

      // 6. Carrot (جزر حقيقي) - Row 2, Col 2
      case 'carrot':
        return {
          backgroundImage: `url(${realFoodsGrid})`,
          backgroundPosition: '33.8% 95%',
          backgroundSize: '430% 215%',
          backgroundRepeat: 'no-repeat',
        };

      // 7. Broccoli (بروكلي حقيقي) - Row 2, Col 3
      case 'broccoli':
        return {
          backgroundImage: `url(${realFoodsGrid})`,
          backgroundPosition: '66.2% 95%',
          backgroundSize: '430% 215%',
          backgroundRepeat: 'no-repeat',
        };

      // 8. Sweet Corn (ذرة حقيقي) - Row 2, Col 4
      case 'corn':
        return {
          backgroundImage: `url(${realFoodsGrid})`,
          backgroundPosition: '98.5% 95%',
          backgroundSize: '430% 215%',
          backgroundRepeat: 'no-repeat',
        };

      // 9. Salad Bowl (سلطة حقيقية) - Left half of realSaladPizzaGrid
      case 'salad':
        return {
          backgroundImage: `url(${realSaladPizzaGrid})`,
          backgroundPosition: '7% 50%',
          backgroundSize: '215% 108%',
          backgroundRepeat: 'no-repeat',
        };

      // 10. Pizza (بيتزا حقيقية) - Right half of realSaladPizzaGrid
      case 'pizza':
        return {
          backgroundImage: `url(${realSaladPizzaGrid})`,
          backgroundPosition: '93% 50%',
          backgroundSize: '215% 108%',
          backgroundRepeat: 'no-repeat',
        };

      default:
        return {
          backgroundImage: `url(${realFoodsGrid})`,
          backgroundPosition: '66.2% 4.5%',
          backgroundSize: '430% 215%',
          backgroundRepeat: 'no-repeat',
        };
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div
        className="w-full h-full rounded-xl overflow-hidden select-none filter contrast-110 brightness-105 shadow-md drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] transition-transform"
        style={getStyle()}
      />
    </div>
  );
};
