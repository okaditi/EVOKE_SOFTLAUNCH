import React from 'react';
import { InteractiveObjectId, DISCOVERY_ITEMS } from '../types';

interface InteractiveTooltipProps {
  activeId: InteractiveObjectId | null;
  isDraggingController: boolean;
  isDraggingChair: boolean;
  isDraggingMouse?: boolean;
  isMonitorPowered: boolean;
  isPCPowered: boolean;
}

export const InteractiveTooltip: React.FC<InteractiveTooltipProps> = ({
  activeId,
  isDraggingController,
  isDraggingChair,
  isDraggingMouse,
  isMonitorPowered,
  isPCPowered,
}) => {
  if (!activeId) return null;

  const item = DISCOVERY_ITEMS[activeId];
  if (!item) return null;

  // Compute clean, minimal status string
  let statusText = '';
  if (isDraggingMouse) {
    statusText = 'Dragging mouse • Cursor tracking on monitor screen';
  } else if (isDraggingChair) {
    statusText = 'Spinning & moving chair • 360° dynamic swivel';
  } else if (isDraggingController) {
    statusText = 'Moving controller • Release to place on desk';
  } else if (activeId === 'monitor_power') {
    statusText = isMonitorPowered ? 'Display Power [ON]' : 'Display Power [OFF]';
  } else if (activeId === 'monitor') {
    statusText = 'Click to zoom into 240Hz screen';
  } else if (activeId === 'pc') {
    statusText = isPCPowered ? 'Apex Rig CPU [ON] • Click to turn OFF' : 'Apex Rig CPU [OFF] • Click to turn ON';
  } else if (activeId === 'chair') {
    statusText = 'Click to spin 360° or drag across floor';
  } else if (activeId === 'controller') {
    statusText = 'Click & drag controller';
  } else if (activeId === 'mouse') {
    statusText = 'Click & drag mouse to move cursor on monitor screen';
  } else if (activeId === 'headset') {
    statusText = 'Headphones • Click "PUT ON HEADPHONES" below for audio';
  } else {
    statusText = item.label;
  }

  return (
    <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#120F16]/90 border border-[#F4F0EA]/15 backdrop-blur-md shadow-2xl">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E66A3A] animate-pulse" />
        <span className="font-display font-semibold text-[11px] tracking-[0.2em] text-[#F4F0EA] uppercase whitespace-nowrap">
          {statusText}
        </span>
      </div>
    </div>
  );
};
