// src/components/ui/Avatar.tsx
import React from 'react';

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: number;
    onClick?: () => void;
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    name,
    size = 40,
    onClick,
    className = '',
}) => {
    // Récupérer les initiales du nom (2 premières lettres)
    const getInitials = (): string => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Si une image est fournie, l'afficher
    if (src) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                onClick={onClick}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: onClick ? 'pointer' : 'default',
                }}
                className={className}
            />
        );
    }

    // Sinon, afficher un cercle avec les initiales
    return (
        <div
            onClick={onClick}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1B4332, #2D6A4F)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: size * 0.4,
                cursor: onClick ? 'pointer' : 'default',
            }}
            className={className}
        >
            {getInitials()}
        </div>
    );
};

export default Avatar;