import React from 'react';

interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

// Genera un colore consistente basato sul nome
function getColorFromName(name: string): string {
  const colors = [
    'bg-pink-200 text-pink-700',
    'bg-purple-200 text-purple-700',
    'bg-indigo-200 text-indigo-700',
    'bg-rose-200 text-rose-700',
    'bg-fuchsia-200 text-fuchsia-700',
    'bg-violet-200 text-violet-700',
  ];

  // Hash semplice del nome per colore consistente
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Estrae le iniziali dal nome
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserAvatar({ name, imageUrl, size = 'md' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  const colorClass = getColorFromName(name);
  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center font-semibold`}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
