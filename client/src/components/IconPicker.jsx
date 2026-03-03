import React, { useState } from 'react';
import {
  Wifi, Shield, Server, HardDrive, Headphones, Zap, Globe, Lock,
  Monitor, Smartphone, Cloud, Database, Cpu, Radio, Signal, Router,
  Eye, Star, Heart, Award, Target, Layers, Box, Package,
  Users, Building, Phone, Mail, MapPin, Clock
} from 'lucide-react';
import { useAdmin } from '../AdminContext.jsx';
import { Pencil } from 'lucide-react';
import './IconPicker.css';

export const iconList = {
  wifi: Wifi, shield: Shield, server: Server, harddrive: HardDrive,
  headphones: Headphones, zap: Zap, globe: Globe, lock: Lock,
  monitor: Monitor, smartphone: Smartphone, cloud: Cloud, database: Database,
  cpu: Cpu, radio: Radio, signal: Signal, router: Router,
  eye: Eye, star: Star, heart: Heart, award: Award,
  target: Target, layers: Layers, box: Box, package: Package,
  users: Users, building: Building, phone: Phone, mail: Mail,
  mappin: MapPin, clock: Clock
};

export function getIcon(name) {
  return iconList[name] || Zap;
}

export function EditableIcon({ iconName, onSave, size = 24, className = '' }) {
  const { isAdmin, editMode } = useAdmin();
  const [open, setOpen] = useState(false);
  const Icon = getIcon(iconName);

  if (!isAdmin || !editMode) {
    return <Icon size={size} className={className} />;
  }

  return (
    <div className="icon-picker" style={{ position: 'relative', display: 'inline-flex' }}>
      <div className="icon-picker__current" onClick={() => setOpen(!open)}>
        <Icon size={size} className={className} />
        <span className="icon-picker__edit"><Pencil size={10} /></span>
      </div>
      {open && (
        <>
          <div className="icon-picker__overlay" onClick={() => setOpen(false)} />
          <div className="icon-picker__dropdown">
            {Object.entries(iconList).map(([name, Ic]) => (
              <button
                key={name}
                className={`icon-picker__option ${name === iconName ? 'icon-picker__option--active' : ''}`}
                onClick={() => { onSave?.(name); setOpen(false); }}
                title={name}
              >
                <Ic size={20} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
