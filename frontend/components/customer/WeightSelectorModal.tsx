import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { X, Scale } from 'lucide-react';
import { formatCurrency } from '@/utils';

interface WeightSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  initialWeight?: number; // in grams
  onSave: (grams: number) => void;
}

export default function WeightSelectorModal({
  isOpen,
  onClose,
  product,
  initialWeight = 0,
  onSave
}: WeightSelectorModalProps) {
  const [kg, setKg] = useState<string>('');
  const [grams, setGrams] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialWeight > 0) {
        const initialKg = Math.floor(initialWeight / 1000);
        const initialG = initialWeight % 1000;
        setKg(initialKg > 0 ? initialKg.toString() : '');
        setGrams(initialG > 0 ? initialG.toString() : '');
      } else {
        // Default to 1 Kg if no initial weight
        setKg('1');
        setGrams('');
      }
    }
  }, [isOpen, initialWeight]);

  if (!isOpen) return null;

  const currentGrams = (parseInt(kg || '0') * 1000) + parseInt(grams || '0');
  const totalPrice = (currentGrams * product.price) / 1000;

  const exceedsStock = product.available_stock !== null && product.available_stock !== undefined && currentGrams > product.available_stock;

  const handleSave = () => {
    if (currentGrams > 0 && !exceedsStock) {
      onSave(currentGrams);
      onClose();
    }
  };

  const getMainUnitLabel = () => {
    switch(product.unit?.toLowerCase()) {
      case 'kg': return 'Kilograms (Kg)';
      case 'litre': case 'l': return 'Litres (L)';
      case 'gram': case 'g': return 'Grams (g)';
      default: return `${product.unit || 'Unit'}`;
    }
  };

  const getSubUnitLabel = () => {
    switch(product.unit?.toLowerCase()) {
      case 'kg': return 'Grams (g)';
      case 'litre': case 'l': return 'Milliliters (ml)';
      case 'gram': case 'g': return 'Milligrams (mg)';
      default: return 'Fraction (1/1000)';
    }
  };

  const getMainUnitShort = () => {
    switch(product.unit?.toLowerCase()) {
      case 'kg': return 'Kg';
      case 'litre': case 'l': return 'L';
      case 'gram': case 'g': return 'g';
      default: return product.unit || 'Unit';
    }
  };

  const getSubUnitShort = () => {
    switch(product.unit?.toLowerCase()) {
      case 'kg': return 'g';
      case 'litre': case 'l': return 'ml';
      case 'gram': case 'g': return 'mg';
      default: return 'frac';
    }
  };

  const presetWeights = [
    { label: `250${getSubUnitShort()}`, k: '0', g: '250' },
    { label: `500${getSubUnitShort()}`, k: '0', g: '500' },
    { label: `1 ${getMainUnitShort()}`, k: '1', g: '0' },
    { label: `2 ${getMainUnitShort()}`, k: '2', g: '0' },
    { label: `5 ${getMainUnitShort()}`, k: '5', g: '0' },
  ];

  const applyPreset = (k: string, g: string) => {
    setKg(k === '0' ? '' : k);
    setGrams(g === '0' ? '' : g);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Select Quantity</h3>
              <p className="text-sm text-gray-500">{product.name} ({formatCurrency(product.price)} / {product.unit})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{getMainUnitLabel()}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={kg}
                  onChange={(e) => setKg(e.target.value)}
                  className="w-full text-center text-2xl font-bold px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{getMainUnitShort()}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{getSubUnitLabel()}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="w-full text-center text-2xl font-bold px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  placeholder="000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{getSubUnitShort()}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              {presetWeights.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.k, preset.g)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center mb-6">
            <span className="text-gray-600 font-medium">Item Total</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
          </div>

          {exceedsStock && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 font-medium text-center">The selected quantity is currently unavailable. Please choose a lower quantity.</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={currentGrams === 0 || exceedsStock}
            className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Confirm & Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
