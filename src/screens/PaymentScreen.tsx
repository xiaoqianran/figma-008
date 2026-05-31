import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, CreditCard, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '../stores/useAppStore';

export function PaymentScreen() {
  const navigate = useNavigate();
  const { booking, updateBooking, startRide, user } = useAppStore();
  const [selectedMethod, setSelectedMethod] = useState<string>(
    booking.paymentMethod || 'card'
  );
  const [processing, setProcessing] = useState(false);

  // Add Card Sheet state (proper in-app flow instead of alert)
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '' });
  const [addedCards, setAddedCards] = useState<Array<{ id: string; last4: string; expiry: string }>>([]);

  const baseMethods = [
    { id: 'card' as const, label: 'Debit Card •••• 4242', sub: 'Expires 09/27' },
    { id: 'paypal' as const, label: 'PayPal', sub: user?.email || 'alex@hey.com' },
    { id: 'cash' as const, label: 'Cash', sub: 'Pay driver directly' },
  ];

  const dynamicCards = addedCards.map(c => ({
    id: `newcard-${c.id}` as const,
    label: `Debit Card •••• ${c.last4}`,
    sub: `Expires ${c.expiry}`,
  }));

  const methods = [...baseMethods, ...dynamicCards];

  const confirmBooking = async () => {
    setProcessing(true);
    updateBooking({ paymentMethod: selectedMethod as any });

    await new Promise((r) => setTimeout(r, 920));

    const driverPool = ['Maria S.', 'James K.', 'Priya N.', 'Carlos M.', 'Aisha K.'];
    const vehiclePool = ['Toyota Camry • ABC 123', 'Honda Accord • XYZ 789', 'Tesla Model 3 • EV 456'];

    const driver = driverPool[Math.floor(Math.random() * driverPool.length)];
    const vehicle = vehiclePool[Math.floor(Math.random() * vehiclePool.length)];

    // Start active ride for tracking
    startRide({
      id: 'ride_' + Date.now(),
      driver,
      vehicle,
      etaMinutes: booking.rideType === 'premium' ? 4 : 6,
      price: booking.estimatedPrice || 12,
      from: booking.pickupLocation,
      to: booking.destinationLocation || 'Downtown',
      rideType: booking.rideType || 'economy',
      startedAt: new Date().toISOString(),
    });

    setProcessing(false);

    // Go to beautiful tracking screen instead of alert
    navigate('/tracking');
  };

  const handleAddCard = () => {
    if (!newCard.number || !newCard.expiry) {
      toast.error('Please enter card number and expiry');
      return;
    }

    const last4 = newCard.number.slice(-4);
    const newId = Date.now().toString(36);

    setAddedCards(prev => [...prev, {
      id: newId,
      last4,
      expiry: newCard.expiry
    }]);

    // Auto-select the newly added card
    setSelectedMethod(`newcard-${newId}` as any);

    toast.success(`Card ending in ${last4} added successfully`);

    // Reset form and close sheet
    setNewCard({ number: '', expiry: '', cvv: '' });
    setShowAddCard(false);
  };

  return (
    <div className="screen overflow-auto bg-white text-black pb-10">
      <div className="px-4 pt-4">
        <div className="text-xl font-semibold">Payment</div>
        <div className="text-sm text-[#6C6C6E] mt-1">Confirm your trip details</div>
      </div>

      {/* Trip summary (Figma style) */}
      <div className="mx-4 mt-5 rounded-2xl border p-4 text-sm bg-[#F8F9FA]">
        <div className="flex justify-between py-1">
          <span className="text-[#6C6C6E]">From</span>
          <span className="font-medium text-right">{booking.pickupLocation}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-[#6C6C6E]">To</span>
          <span className="font-medium text-right">{booking.destinationLocation || '—'}</span>
        </div>
        <div className="h-px bg-[#E5E5EA] my-2" />
        <div className="flex justify-between font-semibold text-base pt-1">
          <span>Total</span>
          <span>${(booking.estimatedPrice || 0).toFixed(2)}</span>
        </div>
        {booking.promoCode && (
          <div className="text-[10px] text-[#34C759] mt-1">Promo {booking.promoCode} applied</div>
        )}
      </div>

      {/* Payment methods (Figma screen 17) */}
      <div className="px-4 mt-6">
        <div className="uppercase text-xs tracking-widest text-[#8E8E93] pl-1 mb-2">PAY WITH</div>

        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedMethod(m.id)}
            className={`w-full flex items-center gap-4 p-4 mb-2 rounded-2xl border text-left transition-all ${selectedMethod === m.id ? 'border-[#0A7CFF] bg-blue-50/40' : 'border-[#E5E5EA]'}`}
          >
            <div className="w-9 h-9 rounded-xl bg-white border flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <div className="flex-1">
              <div className="font-medium">{m.label}</div>
              <div className="text-xs text-[#6C6C6E]">{m.sub}</div>
            </div>
            {selectedMethod === m.id && <CheckCircle className="text-[#0A7CFF]" size={18} />}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowAddCard(true)}
          className="text-sm text-[#0A7CFF] mt-2 ml-1 flex items-center gap-1 active:opacity-70"
        >
          + Add new card or scan (Figma 18-19)
        </button>
      </div>

      <div className="px-4 mt-8">
        <button
          type="button"
          onClick={confirmBooking}
          disabled={processing}
          className="btn btn-primary w-full text-[17px] font-semibold h-[60px]"
        >
          {processing
            ? 'Processing payment…'
            : `Confirm & Pay $${(booking.estimatedPrice || 0).toFixed(2)}`}
        </button>
        <div className="text-[10px] text-center text-[#8E8E93] mt-3">
          You will not be charged until the ride is complete.
        </div>
      </div>

      {/* Proper Add Card Bottom Sheet - replaces ugly alert */}
      <AnimatePresence>
        {showAddCard && (
          <div className="fixed inset-0 z-[200] flex items-end bg-black/40" onClick={() => setShowAddCard(false)}>
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="w-full max-w-[375px] mx-auto bg-white rounded-t-3xl p-5 pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="font-semibold text-xl tracking-[-0.3px]">Add new card</div>
                <button type="button" onClick={() => setShowAddCard(false)} className="p-1">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-[#6C6C6E] mb-1.5 pl-1">CARD NUMBER</div>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={newCard.number}
                    onChange={(e) => setNewCard({ ...newCard, number: e.target.value.replace(/\s/g, '') })}
                    className="input w-full text-lg tracking-[2px]"
                    maxLength={16}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6C6C6E] mb-1.5 pl-1">EXPIRY DATE</div>
                    <input
                      type="text"
                      placeholder="09/27"
                      value={newCard.expiry}
                      onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                      className="input w-full"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-[#6C6C6E] mb-1.5 pl-1">CVV</div>
                    <input
                      type="text"
                      placeholder="123"
                      value={newCard.cvv}
                      onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, '') })}
                      className="input w-full"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCard}
                className="btn btn-primary w-full h-14 mt-6 text-[17px] font-semibold"
              >
                Add Card
              </button>

              <div className="text-center text-[10px] text-[#8E8E93] mt-4">
                Your card is securely stored. This is a high-fidelity demo.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
