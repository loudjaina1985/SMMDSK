import React, { useState, useRef } from 'react';
import { Plus, Search, Trash2, Edit, AlertCircle, RefreshCw, Eye, Check, Upload } from 'lucide-react';
import { Product, AppState } from '../types';
import { translations } from '../translations';
import { generateBarcode, formatCurrency } from '../utils';

interface ProductsProps {
  state: AppState;
  t: typeof translations['ar' | 'fr' | 'en'];
  onSaveProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const defaultImagesList = [
  'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200&auto=format&fit=crop&q=80', // smartwatch
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80', // headphones
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80', // keyboard
  'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=200&auto=format&fit=crop&q=80', // charger
  'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200&auto=format&fit=crop&q=80', // mouse
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&auto=format&fit=crop&q=80', // glasses
];

export default function Products({ state, t, onSaveProduct, onDeleteProduct }: ProductsProps) {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndSetImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_DIM = 250;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setEditingProduct((prev) => prev ? { ...prev, image: compressedBase64 } : null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      compressAndSetImage(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      compressAndSetImage(file);
    }
  };

  const filteredProducts = state.products.filter((p) => {
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.barcode.includes(term);
  });

  const handleStartAdd = () => {
    setEditingProduct({
      id: '',
      name: '',
      barcode: '',
      buyPrice: 0,
      sellPrice: 0,
      quantity: 10,
      minStockLevel: 2,
      image: defaultImagesList[0],
    });
    setValidationError(null);
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setValidationError(null);
  };

  const handleGenerateBarcode = () => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        barcode: generateBarcode(),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const { name, barcode, buyPrice, sellPrice, quantity, minStockLevel, image } = editingProduct;

    if (!name || !barcode) {
      setValidationError('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    if ((buyPrice ?? 0) >= (sellPrice ?? 0)) {
      setValidationError(t.invalidPrices);
      return;
    }

    const payload: Product = {
      id: editingProduct.id || 'P-' + Math.floor(1000 + Math.random() * 9000),
      name: name!,
      barcode: barcode!,
      buyPrice: Number(buyPrice ?? 0),
      sellPrice: Number(sellPrice ?? 0),
      quantity: Number(quantity ?? 0),
      minStockLevel: Number(minStockLevel ?? 2),
      image: image || defaultImagesList[0],
    };

    onSaveProduct(payload);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" dir="rtl">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{t.products}</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">إدارة المنتجات المتوفرة والمباعة في بوت تيليجرام الخاص بك</p>
        </div>
        <button
          onClick={handleStartAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addProduct}</span>
        </button>
      </div>

      {/* Filter and Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t.searchProducts}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-right"
            dir="rtl"
          />
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right" dir="rtl">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-right">الصورة والكود</th>
                <th className="px-4 py-3 text-right">{t.productName}</th>
                <th className="px-4 py-3 text-right">{t.buyPrice}</th>
                <th className="px-4 py-3 text-right">{t.sellPrice}</th>
                <th className="px-4 py-3 text-right">{t.stockQuantity}</th>
                <th className="px-4 py-3 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredProducts.map((p) => {
                const isLow = p.quantity <= p.minStockLevel && p.quantity > 0;
                const isOut = p.quantity === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || defaultImagesList[0]}
                          alt={p.name}
                          className="w-10 h-10 rounded object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded inline-block border border-slate-200/50 dark:border-slate-700/50">
                            {p.barcode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400 dark:text-slate-500">
                      {formatCurrency(p.buyPrice, state.settings.currency, state.settings.primaryLanguage)}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(p.sellPrice, state.settings.currency, state.settings.primaryLanguage)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold ${
                            isOut ? 'text-rose-600 dark:text-rose-450' : isLow ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {p.quantity}
                        </span>
                        {isOut && <span className="text-[9px] bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold">{t.outOfStock}</span>}
                        {isLow && <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">{t.lowStock}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                          title={t.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    لم يتم العثور على أي منتج يطابق عملية البحث الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Product Dialog Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-xl flex flex-col max-h-[90vh] animate-scale-up" dir="rtl">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct.id ? t.editProduct : t.addProduct}
              </h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">{t.productName} *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="مثال: لوحة مفاتيح لاسلكية"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-right"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">{t.productBarcode} *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                      title={t.generateBarcode}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>توليد</span>
                    </button>
                    <input
                      type="text"
                      required
                      value={editingProduct.barcode || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                      placeholder="الكود التعريفي (EAN/UPC)"
                      className="flex-grow px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">{t.stockQuantity} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.quantity ?? 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">{t.buyPrice} ({state.settings.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.buyPrice ?? 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, buyPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">{t.sellPrice} ({state.settings.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.sellPrice ?? 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-right"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">{t.minStock} *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingProduct.minStockLevel ?? 2}
                  onChange={(e) => setEditingProduct({ ...editingProduct, minStockLevel: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-right"
                />
              </div>

              {/* Product Image Section: Upload (Drag & Drop / Click) or URL */}
              <div className="space-y-2 pt-2 border-t border-dashed border-slate-150">
                <label className="block text-xs font-black text-slate-600">🌅 صورة المنتج (تحميل ملف أو رابط)</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* File Upload Dropzone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all duration-200 ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-50/50 scale-[0.98]' 
                        : 'border-slate-200 dark:border-slate-700/60 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-indigo-500" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تحميل ملف من جهازك 📁</span>
                    <span className="text-[9px] text-slate-400 font-medium font-bold">اسحب وأسقط الصورة هنا، أو اضغط للاختيار</span>
                  </div>

                  {/* Image Link Input and Preview */}
                  <div className="flex flex-col justify-between p-3.5 bg-slate-50 dark:bg-slate-800/10 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center gap-3">
                      {editingProduct.image && (
                        <img 
                          src={editingProduct.image} 
                          alt="Preview" 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 block text-right">رابط عنوان الصورة / Base64</span>
                        <input
                          type="text"
                          value={editingProduct.image || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                          placeholder="ضع رابط صورة خارجي..."
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-left"
                        />
                      </div>
                    </div>
                    {editingProduct.image && editingProduct.image.startsWith('data:') ? (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black self-end bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                        ✓ صورة مرفوعة محلياً
                      </span>
                    ) : editingProduct.image ? (
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black self-end bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
                        ✓ صورة نشطة من رابط
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Ready Preset Images selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500">{t.selectDefaultImage}</label>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {defaultImagesList.map((img, idx) => {
                    const isSelected = editingProduct.image === img;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, image: img })}
                        className={`relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border-2 transition ${
                          isSelected ? 'border-indigo-600 scale-95' : 'border-transparent opacity-80'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center text-white">
                            <Check className="w-4 h-4 font-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-slate-500 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
