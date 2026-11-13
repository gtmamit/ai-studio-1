import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useAtelier } from '../context/AtelierContext';
import { SHOE_ZONES, SIZE_CHART } from '../data/catalog';
import type { OrderRecord } from '../types/footwear';
import { StudioImage } from './StudioImage';

type DrawerStep = 'bag' | 'checkout' | 'receipt';

export const BagDrawer: React.FC = () => {
  const {
    isBagOpen,
    setIsBagOpen,
    bagItems,
    updateBagQty,
    removeFromBag,
    placeOrder,
    navigateTo,
  } = useAtelier();

  const [step, setStep] = useState<DrawerStep>('bag');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  // Checkout form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryTier, setDeliveryTier] = useState<'standard' | 'priority'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple-pay'>('card');
  const [cardLast4, setCardLast4] = useState('4242');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBagOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsBagOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBagOpen, setIsBagOpen]);

  // Reset back to bag step whenever reopened with items after a previous receipt
  useEffect(() => {
    if (isBagOpen && step === 'receipt' && bagItems.length > 0) {
      setStep('bag');
      setConfirmedOrder(null);
    }
  }, [isBagOpen, bagItems.length, step]);

  if (!isBagOpen) return null;

  const subtotal = bagItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const freeShippingThreshold = 450;
  const shippingCost =
    bagItems.length === 0
      ? 0
      : deliveryTier === 'priority'
      ? 25
      : subtotal >= freeShippingThreshold
      ? 0
      : 18;
  const estimatedTax = Math.round(subtotal * 0.0825);
  const grandTotal = subtotal + shippingCost + estimatedTax;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.includes('@') || !address.trim() || !city.trim() || !postalCode.trim()) {
      setFormError('Please complete all shipping and contact fields.');
      return;
    }
    setFormError(null);
    const order = placeOrder({
      recipientName: fullName.trim(),
      city: city.trim(),
      deliveryTier,
    });
    setConfirmedOrder(order);
    setStep('receipt');
  };

  const handleClose = () => {
    setIsBagOpen(false);
    if (step === 'receipt') {
      setStep('bag');
      setConfirmedOrder(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag and Checkout"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 w-full max-w-[460px] h-full bg-white border-l border-[#e5e5e5] flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="px-5 md:px-6 h-16 border-b border-[#e5e5e5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('bag')}
                aria-label="Back to bag"
                className="min-w-[36px] min-h-[36px] rounded-full border border-[#e5e5e5] flex items-center justify-center text-[#141414] hover:border-[#141414] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[#141414]">
              {step === 'bag'
                ? `Shopping Bag (${bagItems.reduce((s, i) => s + i.quantity, 0)})`
                : step === 'checkout'
                ? 'Atelier Checkout'
                : 'Order Confirmed'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close bag drawer"
            className="min-w-[40px] min-h-[40px] rounded-full hover:bg-[#f6f3f2] flex items-center justify-center text-[#141414] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">
          {step === 'bag' && (
            <>
              {bagItems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f6f3f2] border border-[#e5e5e5] mx-auto flex items-center justify-center text-[#737373]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-[#141414]">
                    Your shopping bag is empty
                  </p>
                  <p className="mt-1.5 text-sm text-[#737373] max-w-[32ch] mx-auto">
                    Explore studio silhouettes or build a custom pair in the 3D Studio.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      navigateTo('customizer');
                    }}
                    className="mt-6 min-h-[46px] px-6 py-2.5 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-[#2563eb] transition-colors cursor-pointer"
                  >
                    Open 3D Studio
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Free Courier Indicator */}
                  <div className="p-3.5 rounded-xl bg-[#f6f3f2] border border-[#e5e5e5]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#141414]">
                        {subtotal >= freeShippingThreshold
                          ? 'Complimentary Atelier Courier unlocked'
                          : `Add $${freeShippingThreshold - subtotal} for complimentary courier`}
                      </span>
                      <span className="font-mono tabular-nums text-[#737373]">
                        ${Math.min(subtotal, freeShippingThreshold)}/${freeShippingThreshold}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-[#e5e5e5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563eb] transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <ul className="divide-y divide-[#e5e5e5]">
                    {bagItems.map((item) => {
                      const sizeMeta = SIZE_CHART.find((s) => s.us === item.sizeUS);
                      return (
                        <li key={item.lineId} className="py-4 first:pt-0 flex gap-4">
                          <div className="w-20 h-20 rounded-xl bg-[#f6f3f2] border border-[#e5e5e5] overflow-hidden shrink-0">
                            <StudioImage
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-sm font-semibold text-[#141414] truncate">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-[#737373] mt-0.5 font-mono tabular-nums">
                                  US {item.sizeUS} / EU {sizeMeta?.eu ?? 44} ·{' '}
                                  {item.isBespoke ? 'Bespoke Build' : 'Studio Spec'}
                                </p>
                              </div>
                              <span className="font-mono tabular-nums text-sm font-medium text-[#141414]">
                                ${item.unitPrice * item.quantity}
                              </span>
                            </div>

                            {item.isBespoke && (
                              <div className="mt-2 flex items-center gap-1.5" aria-label="Custom material colors">
                                {SHOE_ZONES.map((z) => (
                                  <span
                                    key={z.id}
                                    title={`${z.label}: ${item.configSnapshot[z.id].colorName}`}
                                    className="w-3 h-3 rounded-full border border-black/15"
                                    style={{ backgroundColor: item.configSnapshot[z.id].color }}
                                  />
                                ))}
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between">
                              <div className="inline-flex items-center border border-[#e5e5e5] rounded-full">
                                <button
                                  type="button"
                                  onClick={() => updateBagQty(item.lineId, -1)}
                                  aria-label="Decrease quantity"
                                  className="w-8 h-8 flex items-center justify-center text-[#141414] hover:bg-[#f6f3f2] rounded-l-full cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center text-xs font-mono tabular-nums font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateBagQty(item.lineId, 1)}
                                  aria-label="Increase quantity"
                                  className="w-8 h-8 flex items-center justify-center text-[#141414] hover:bg-[#f6f3f2] rounded-r-full cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromBag(item.lineId)}
                                aria-label={`Remove ${item.name}`}
                                className="p-2 text-[#737373] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs font-medium"
                >
                  {formError}
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373] mb-2.5">
                  Recipient & Shipping
                </p>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#e5e5e5] text-sm text-[#141414] placeholder:text-[#737373] focus:outline-none focus:border-[#2563eb]"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#e5e5e5] text-sm text-[#141414] placeholder:text-[#737373] focus:outline-none focus:border-[#2563eb]"
                  />
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#e5e5e5] text-sm text-[#141414] placeholder:text-[#737373] focus:outline-none focus:border-[#2563eb]"
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-white border border-[#e5e5e5] text-sm text-[#141414] placeholder:text-[#737373] focus:outline-none focus:border-[#2563eb]"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-white border border-[#e5e5e5] text-sm text-[#141414] placeholder:text-[#737373] focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373] mb-2.5">
                  Courier Method
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryTier('standard')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      deliveryTier === 'standard'
                        ? 'border-[#2563eb] bg-[#dbe1ff]/30'
                        : 'border-[#e5e5e5] bg-white'
                    }`}
                  >
                    <p className="text-xs font-semibold text-[#141414]">Atelier Standard</p>
                    <p className="text-[11px] text-[#737373] mt-0.5 font-mono tabular-nums">
                      {subtotal >= freeShippingThreshold ? 'Complimentary' : '$18'} · 4–6 days
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryTier('priority')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      deliveryTier === 'priority'
                        ? 'border-[#2563eb] bg-[#dbe1ff]/30'
                        : 'border-[#e5e5e5] bg-white'
                    }`}
                  >
                    <p className="text-xs font-semibold text-[#141414]">Priority Air</p>
                    <p className="text-[11px] text-[#737373] mt-0.5 font-mono tabular-nums">
                      $25 · 1–2 days
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373] mb-2.5">
                  Payment
                </p>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`min-h-[44px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-[#141414] bg-[#141414] text-white'
                        : 'border-[#e5e5e5] bg-white text-[#141414]'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('apple-pay')}
                    className={`min-h-[44px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center cursor-pointer ${
                      paymentMethod === 'apple-pay'
                        ? 'border-[#141414] bg-[#141414] text-white'
                        : 'border-[#e5e5e5] bg-white text-[#141414]'
                    }`}
                  >
                    <span>Express Pay</span>
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <input
                    type="text"
                    maxLength={4}
                    aria-label="Card last 4 digits"
                    placeholder="Card ending digits (e.g. 4242)"
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#e5e5e5] font-mono text-sm text-[#141414] focus:outline-none focus:border-[#2563eb]"
                  />
                )}
              </div>
            </form>
          )}

          {step === 'receipt' && confirmedOrder && (
            <div className="py-4 space-y-5">
              <div className="p-5 rounded-2xl bg-[#f6f3f2] border border-[#e5e5e5]">
                <div className="flex items-center gap-2.5 text-[#006242]">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                    Order {confirmedOrder.orderNumber} Confirmed
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-[#141414]">
                  Preparing studio dispatch for {confirmedOrder.recipientName}
                </h3>
                <p className="mt-1 text-xs text-[#737373]">
                  Destination: {confirmedOrder.city} ·{' '}
                  {confirmedOrder.deliveryTier === 'priority'
                    ? 'Priority Air Courier'
                    : 'Atelier Standard Courier'}
                </p>
              </div>

              <div className="border-t border-[#e5e5e5] pt-4 space-y-3">
                {confirmedOrder.items.map((item) => (
                  <div key={item.lineId} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-[#141414]">
                        {item.name} × {item.quantity}
                      </p>
                      <p className="text-xs text-[#737373] font-mono tabular-nums">
                        US {item.sizeUS} · {item.isBespoke ? 'Bespoke Build' : 'Studio Spec'}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums font-medium text-[#141414]">
                      ${item.unitPrice * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#e5e5e5] pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-[#737373]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">${confirmedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-[#737373]">
                  <span>Courier</span>
                  <span className="font-mono tabular-nums">
                    {confirmedOrder.shipping === 0 ? 'Free' : `$${confirmedOrder.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-[#737373]">
                  <span>Estimated Tax</span>
                  <span className="font-mono tabular-nums">${confirmedOrder.tax}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#141414] pt-2 border-t border-[#e5e5e5]">
                  <span>Total Paid</span>
                  <span className="font-mono tabular-nums text-base">${confirmedOrder.total}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {(step === 'bag' && bagItems.length > 0) || step === 'checkout' || step === 'receipt' ? (
          <div className="px-5 md:px-6 py-4 border-t border-[#e5e5e5] bg-[#fcf9f8] shrink-0 space-y-3">
            {step !== 'receipt' && (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#737373]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">${subtotal}</span>
                </div>
                <div className="flex justify-between text-[#737373]">
                  <span>Estimated Courier & Tax</span>
                  <span className="font-mono tabular-nums">${shippingCost + estimatedTax}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-[#141414] pt-1">
                  <span>Total</span>
                  <span className="font-mono tabular-nums text-base">${grandTotal}</span>
                </div>
              </div>
            )}

            {step === 'bag' && (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full min-h-[52px] rounded-full bg-[#141414] text-white text-sm font-semibold hover:bg-[#2563eb] transition-colors cursor-pointer"
              >
                Proceed to Checkout
              </button>
            )}

            {step === 'checkout' && (
              <button
                type="submit"
                form="checkout-form"
                className="w-full min-h-[52px] rounded-full bg-[#2563eb] text-white text-sm font-semibold hover:bg-[#141414] transition-colors cursor-pointer"
              >
                Confirm Order · ${grandTotal}
              </button>
            )}

            {step === 'receipt' && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigateTo('home');
                }}
                className="w-full min-h-[52px] rounded-full bg-[#141414] text-white text-sm font-semibold hover:bg-[#2563eb] transition-colors cursor-pointer"
              >
                Continue Exploring
              </button>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
};
