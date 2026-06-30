// src/components/matchs/FormationSelector.tsx
import React from 'react';
import { FORMATIONS, type Formation } from '../../api/compositions.api';

interface FormationSelectorProps {
    formation: Formation;
    onFormationChange: (formation: Formation) => void;
    disabled?: boolean;
}

export const FormationSelector: React.FC<FormationSelectorProps> = ({
    formation,
    onFormationChange,
    disabled = false,
}) => {
    // Description des formations
    const formationDescriptions: Record<Formation, string> = {
        '4-3-3': '4-3-3 (Attaquant) — 4 défenseurs, 3 milieux, 3 attaquants',
        '4-4-2': '4-4-2 (Équilibré) — 4 défenseurs, 4 milieux, 2 attaquants',
        '4-2-3-1': '4-2-3-1 (Défensif) — 4 défenseurs, 2 milieux défensifs, 3 offensifs, 1 attaquant',
        '3-5-2': '3-5-2 (Milieux) — 3 défenseurs, 5 milieux, 2 attaquants',
        '5-3-2': '5-3-2 (Défensif) — 5 défenseurs, 3 milieux, 2 attaquants',
        '4-1-4-1': '4-1-4-1 (Pivot) — 4 défenseurs, 1 milieu défensif, 4 offensifs, 1 attaquant',
        '3-4-3': '3-4-3 (Offensif) — 3 défenseurs, 4 milieux, 3 attaquants',
    };

    const getFormationIcon = (value: Formation): string => {
        const icons: Record<Formation, string> = {
            '4-3-3': '⚡',
            '4-4-2': '⚖️',
            '4-2-3-1': '🛡️',
            '3-5-2': '🎯',
            '5-3-2': '🔒',
            '4-1-4-1': '🎮',
            '3-4-3': '🔥',
        };
        return icons[value] || '⚽';
    };

    return (
        <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #E2E8E0',
            padding: '16px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '1px solid #E2E8E0',
            }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#2C3E2F' }}>Formation tactique</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {FORMATIONS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => !disabled && onFormationChange(f.value)}
                        disabled={disabled}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: formation === f.value ? '2px solid #2D6A4F' : '1px solid #E2E8E0',
                            background: formation === f.value ? '#D8F3DC' : '#fff',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.6 : 1,
                            transition: 'all 0.15s',
                            width: '100%',
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>{getFormationIcon(f.value)}</span>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#2C3E2F' }}>
                                {f.label}
                            </div>
                            <div style={{ fontSize: '10px', color: '#6B8E6E', marginTop: '2px' }}>
                                {formationDescriptions[f.value]}
                            </div>
                        </div>
                        {formation === f.value && (
                            <span style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#2D6A4F',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                color: '#fff',
                            }}>✓</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};