import { useState, useEffect, useRef, useMemo } from 'react';
import type { Flight, StoredHold } from '../../types';
import { Card, Button } from '../common';
import { Zap, Plane, Crown, Rocket, Timer, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { confirmHold, releaseHold } from '../../services/api';
import { removeHold } from '../../utils/holdStorage';
import { useUser } from '../../hooks/useUser';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface HoldCardProps {
  storedHold: StoredHold;
  flight?: Flight;
  onAction: () => void;
}

export const HoldCard = ({ storedHold, flight, onAction }: HoldCardProps) => {
  const { user } = useUser();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  
  // 1. Store the interval ID in a ref to ensure clean management
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const update = () => {
      const remaining = new Date(storedHold.reservedUntil).getTime() - Date.now();
      const calculatedTime = isNaN(remaining) ? 0 : Math.max(0, remaining);
      
      setTimeLeft(calculatedTime);

      // 2. Clear interval automatically when it hits zero
      if (calculatedTime === 0 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    update();
    timerRef.current = setInterval(update, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [storedHold.reservedUntil]);

  // Derived values
  const isExpired = timeLeft === 0;
  const isLoading = isConfirming || isReleasing;

  const timerDisplay = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timeLeft]);

  const seatConfig = useMemo(() => {
    switch (storedHold.seatClass) {
      case 'business':
        return { icon: <Crown size={16} className="text-purple-400" />, label: 'Business' };
      case 'galaxium':
        return { icon: <Rocket size={16} className="text-alien-green" />, label: 'Galaxium Class' };
      default:
        return { icon: <Plane size={16} className="text-blue-400" />, label: 'Economy' };
    }
  }, [storedHold.seatClass]);

  const handleConfirm = async () => {
    if (!user || isLoading) return;
    setIsConfirming(true);
    try {
      const confirmed = await confirmHold(storedHold.holdId);
      removeHold(user.user_id, storedHold.holdId);
      toast.success(`Booking confirmed! Reference: #${confirmed.externalBookingReference}`);
      onAction();
    } catch {
      toast.error('Failed to confirm booking');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRelease = async () => {
    if (!user || isLoading) return;
    setIsReleasing(true);
    try {
      await releaseHold(storedHold.holdId);
      removeHold(user.user_id, storedHold.holdId);
      toast.success('Hold released');
      onAction();
    } catch {
      toast.error('Failed to release hold');
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border ${isExpired ? 'border-red-500/30' : 'border-solar-orange/30'}`}>
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isExpired ? 'bg-red-500/20' : 'bg-solar-orange/20'}`}>
              <Zap className={isExpired ? 'text-red-400' : 'text-solar-orange'} size={20} />
            </div>
            <div>
              <p className="text-xs text-star-white/60 font-mono">{storedHold.holdId}</p>
              <div className="flex items-center gap-2 mt-1">
                {isExpired ? (
                  <>
                    <XCircle className="text-red-500" size={16} />
                    <span className="text-sm font-semibold text-red-500">Expired</span>
                  </>
                ) : (
                  <>
                    <Timer className="text-solar-orange" size={16} />
                    <span className="text-sm font-semibold text-solar-orange">
                      Held · {timerDisplay}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {flight ? (
            <div>
              <h3 className="text-xl font-bold text-star-white mb-1">
                {flight.origin} → {flight.destination}
              </h3>
              <p className="text-sm text-star-white/60">Flight #{flight.flight_id}</p>
            </div>
          ) : (
            <p className="text-sm text-star-white/60">Flight #{storedHold.flightId}</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              {seatConfig.icon}
              <span className="text-sm text-star-white/70">{seatConfig.label}</span>
            </div>
            <span className="text-lg font-bold text-star-white">
              {storedHold.totalPrice != null && !isNaN(storedHold.totalPrice)
                ? formatCurrency(storedHold.totalPrice)
                : '—'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {!isExpired ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRelease}
                isLoading={isReleasing}
                disabled={isLoading}
                className="flex-1"
              >
                Release
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                isLoading={isConfirming}
                disabled={isLoading}
                className="flex-1"
              >
                <CheckCircle size={14} /> Confirm
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (user) removeHold(user.user_id, storedHold.holdId);
                onAction();
              }}
              className="w-full"
            >
              Dismiss
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
