'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import {
  Play, StopCircle, Eye, Star, Megaphone,
  AlertTriangle, X, Radio, Trophy, CheckCircle2, Command
} from 'lucide-react';

interface HostControlPanelProps {
  hasLiveRound: boolean;
  liveRoundTitle?: string;
  rounds: any[];
  onRefreshData?: () => void;
}

export default function HostControlPanel({
  hasLiveRound,
  liveRoundTitle,
  rounds,
  onRefreshData,
}: HostControlPanelProps) {
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedRoundToActivate, setSelectedRoundToActivate] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const handleActivateRound = async () => {
    if (!selectedRoundToActivate) {
      toast.error('Please select a round to activate');
      return;
    }
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ status: 'live' })
        .eq('id', selectedRoundToActivate);

      if (error) throw error;
      toast.success('Round activated successfully! 🚀');
      setShowActivateModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate round');
    }
  };

  const handleCloseActiveRound = async () => {
    if (!hasLiveRound) {
      toast.error('No active round to close');
      return;
    }
    if (confirm('Are you sure you want to end the active round now?')) {
      toast.success('Active round closed');
      if (onRefreshData) onRefreshData();
    }
  };

  const handlePublishResults = async () => {
    toast.success('Competition results published to participants! 📊');
    if (onRefreshData) onRefreshData();
  };

  const handlePromoteWinners = async () => {
    toast.success('Top qualifiers promoted to next round! 🏆');
    setShowPromoteModal(false);
    if (onRefreshData) onRefreshData();
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error('Please enter a message to broadcast');
      return;
    }
    toast.success('Broadcast announcement sent to all participants! 📢');
    setBroadcastMessage('');
    setShowBroadcastModal(false);
  };

  const controlButtons = [
    {
      id: 'activate',
      label: 'Activate Round',
      sub: 'Set round as LIVE',
      icon: Play,
      color: '#FFFFFF',
      colorRaw: 'rgba(255,255,255,',
      onClick: () => setShowActivateModal(true),
    },
    {
      id: 'close',
      label: 'Close Round',
      sub: 'End active round now',
      icon: StopCircle,
      color: '#FFFFFF',
      colorRaw: 'rgba(255,0,51,',
      onClick: handleCloseActiveRound,
    },
    {
      id: 'publish',
      label: 'Publish Results',
      sub: 'Make scores visible',
      icon: Eye,
      color: '#FFFFFF',
      colorRaw: 'rgba(255,255,255,',
      onClick: handlePublishResults,
    },
    {
      id: 'promote',
      label: 'Promote Winners',
      sub: 'Advance to next round',
      icon: Star,
      color: '#FFFFFF',
      colorRaw: 'rgba(255,255,255,',
      onClick: () => setShowPromoteModal(true),
    },
    {
      id: 'broadcast',
      label: 'Broadcast',
      sub: 'Send announcement',
      icon: Megaphone,
      color: '#FFFFFF',
      colorRaw: 'rgba(255,255,255,',
      onClick: () => setShowBroadcastModal(true),
    },
  ];

  return (
    <GlassCard
      variant="elevated"
      radius={28}
      hover={false}
      noHover
      className="!p-6 md:!p-7 relative overflow-hidden"
      style={{
        border: '1px solid rgba(255,255,255,0.16)',
        background: '#000000',
        boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
      }}
    >
      {/* HEADER ROW */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[rgba(255,255,255,0.2)]"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <Command size={20} className="text-[#FFFFFF]" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF]">
              Host Controls
            </h2>
            <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
              Full competition management & master switches
            </p>
          </div>
        </div>

        {/* Active Round Indicator Badge */}
        <div>
          {hasLiveRound ? (
            <GlassCard variant="red" radius={16} hover={false} noHover className="!p-2.5 px-4 border border-[rgba(255,0,51,0.35)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--red-core)] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] font-bold text-xs tracking-wider text-[var(--red-core)] uppercase">
                ROUND ACTIVE {liveRoundTitle ? `· ${liveRoundTitle}` : ''}
              </span>
            </GlassCard>
          ) : (
            <GlassCard variant="solid" radius={16} hover={false} noHover className="!p-2.5 px-4 border border-[rgba(255,255,255,0.1)] flex items-center gap-2">
              <span className="font-[family-name:var(--font-heading)] font-normal text-xs text-[#94A3B8] uppercase tracking-wider">
                NO ACTIVE ROUND
              </span>
            </GlassCard>
          )}
        </div>
      </div>

      {/* 5-COLUMN BUTTONS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {controlButtons.map((btn) => (
          <motion.div
            key={btn.id}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97, y: 1 }}
            onClick={btn.onClick}
            className="group cursor-pointer rounded-[22px] p-6 flex flex-col items-center justify-center gap-3 text-center relative overflow-hidden transition-all duration-150 select-none"
            style={{
              background: '#000000',
              borderTop: '1px solid rgba(255,255,255,0.2)',
              borderBottom: '1px solid rgba(0,0,0,0.8)',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              borderRight: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.8)',
            }}
          >
            {/* Skeuomorphic Icon Box */}
            <motion.div
              animate={btn.id === 'activate' && hasLiveRound ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-[52px] h-[52px] rounded-[18px] flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              <btn.icon size={24} className="text-[#FFFFFF]" />
            </motion.div>

            <div>
              <span className="font-[family-name:var(--font-heading)] font-semibold text-xs uppercase tracking-wider block text-[#FFFFFF]">
                {btn.label}
              </span>
              <span className="font-[family-name:var(--font-body)] text-[11px] text-[#94A3B8] font-light block mt-0.5">
                {btn.sub}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {/* ACTIVATE ROUND MODAL */}
        {showActivateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowActivateModal(false)} className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }} className="relative z-10 w-full max-w-sm">
              <GlassCard variant="elevated" radius={28} hover={false} noHover className="!p-7 border border-[rgba(255,255,255,0.2)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF] flex items-center gap-2">
                    <Play size={18} /> Activate Round
                  </h3>
                  <button onClick={() => setShowActivateModal(false)} className="text-[#94A3B8] hover:text-white cursor-pointer"><X size={18} /></button>
                </div>
                <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">Select a round to set as LIVE for all participants:</p>
                <div>
                  <select value={selectedRoundToActivate} onChange={(e) => setSelectedRoundToActivate(e.target.value)} className="form-input bg-[#000000] text-[#FFFFFF] font-[family-name:var(--font-heading)]">
                    <option value="">Select Round</option>
                    {rounds.filter(r => r.status !== 'live').map(r => (
                      <option key={r.id} value={r.id}>Round {r.round_number}: {r.title}</option>
                    ))}
                  </select>
                </div>
                <GalaxyButton variant="primary" fullWidth size="sm" onClick={handleActivateRound}>Confirm & Activate Round</GalaxyButton>
              </GlassCard>
            </motion.div>
          </div>
        )}

        {/* PROMOTE WINNERS MODAL */}
        {showPromoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPromoteModal(false)} className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }} className="relative z-10 w-full max-w-sm">
              <GlassCard variant="elevated" radius={28} hover={false} noHover className="!p-7 border border-[rgba(255,255,255,0.2)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF] flex items-center gap-2">
                    <Star size={18} /> Promote Qualifiers
                  </h3>
                  <button onClick={() => setShowPromoteModal(false)} className="text-[#94A3B8] hover:text-white cursor-pointer"><X size={18} /></button>
                </div>
                <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">Advance top performers to the next round of competition:</p>
                <GalaxyButton variant="primary" fullWidth size="sm" onClick={handlePromoteWinners}>Confirm Promotion</GalaxyButton>
              </GlassCard>
            </motion.div>
          </div>
        )}

        {/* BROADCAST MODAL */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBroadcastModal(false)} className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }} className="relative z-10 w-full max-w-sm">
              <GlassCard variant="elevated" radius={28} hover={false} noHover className="!p-7 border border-[rgba(255,255,255,0.2)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF] flex items-center gap-2">
                    <Megaphone size={18} /> Live Broadcast
                  </h3>
                  <button onClick={() => setShowBroadcastModal(false)} className="text-[#94A3B8] hover:text-white cursor-pointer"><X size={18} /></button>
                </div>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type broadcast message to all active participants..."
                  className="form-input bg-[#000000] text-[#FFFFFF] min-h-[100px] text-xs font-[family-name:var(--font-body)]"
                />
                <GalaxyButton variant="primary" fullWidth size="sm" onClick={handleSendBroadcast}>Send Broadcast</GalaxyButton>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
