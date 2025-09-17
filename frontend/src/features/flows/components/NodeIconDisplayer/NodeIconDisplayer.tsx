import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
// Import Material Icons dynamically
import * as MaterialIcons from '@mui/icons-material';

/**
 * Types for node icons based on the backend NodeIcon.py definitions
 */
export type NodeIconType =
    | 'http'
    | 'emoji'
    | 'fontawesome'
    | 'material'
    | 'iconify'
    | 'svg';

export interface NodeIconData {
    icon_type: NodeIconType;
    icon_value: string;
    color?: string | null;
}

interface NodeIconDisplayerProps {
    icon: NodeIconData;
    className?: string;
    size?: number | string;
}

/**
 * Component to display different types of node icons based on the icon specification.
 * Supports HTTP URLs, emojis, FontAwesome, Material Icons, Iconify, and inline SVG.
 */
export const NodeIconDisplayer: React.FC<NodeIconDisplayerProps> = ({
    icon,
    className,
    size = 24,
}) => {
    const { icon_type, icon_value, color } = icon;

    const style = {
        color: color || undefined,
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
    };

    // Render different icon types
    switch (icon_type) {
        case 'http':
            return (
                <img
                    src={icon_value}
                    alt="Node icon"
                    className={cn('object-contain', className)}
                    style={style}
                    onError={e => {
                        // Fallback to a default icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = className || '';
                            fallback.textContent = '📦';
                            if (color) fallback.style.color = color;
                            fallback.style.width = style.width;
                            fallback.style.height = style.height;
                            fallback.style.display = 'flex';
                            fallback.style.alignItems = 'center';
                            fallback.style.justifyContent = 'center';
                            parent.appendChild(fallback);
                        }
                    }}
                />
            );

        case 'emoji':
            return (
                <span
                    className={cn(
                        'flex items-center justify-center',
                        className
                    )}
                    style={style}
                >
                    {icon_value}
                </span>
            );

        case 'fontawesome':
            // FontAwesome icons would require @fortawesome/react-fontawesome
            // For now, we'll render a fallback span with the class name
            return (
                <span
                    className={cn(
                        'flex items-center justify-center',
                        className
                    )}
                    style={style}
                    title={`FontAwesome: ${icon_value}`}
                >
                    <i
                        className={icon_value}
                        style={{ color: color || undefined }}
                    ></i>
                </span>
            );

        case 'material':
            // Using MUI Material Icons
            // Convert icon name to PascalCase for Material Icons
            const iconName = icon_value
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');

            // Get the icon component from Material Icons
            const MaterialIconComponent = (MaterialIcons as any)[iconName];

            if (MaterialIconComponent) {
                return (
                    <div
                        className={cn(
                            'flex items-center justify-center',
                            className
                        )}
                        style={style}
                        title={`Material: ${icon_value}`}
                    >
                        <MaterialIconComponent
                            style={{
                                color: color || undefined,
                                fontSize:
                                    typeof size === 'number'
                                        ? `${size}px`
                                        : size,
                            }}
                        />
                    </div>
                );
            }

            // Fallback if icon not found
            return (
                <div
                    className={cn(
                        'flex items-center justify-center',
                        className
                    )}
                    style={style}
                    title={`Material: ${icon_value} (not found)`}
                >
                    <span>📦</span>
                </div>
            );

        case 'iconify':
            // Using Iconify for icons
            return (
                <div
                    className={cn(
                        'flex items-center justify-center',
                        className
                    )}
                    style={style}
                    title={`Iconify: ${icon_value}`}
                >
                    <Icon
                        icon={icon_value}
                        style={{
                            fontSize:
                                typeof size === 'number' ? `${size}px` : size,
                        }}
                    />
                </div>
            );

        case 'svg':
            // For inline SVG, we need to be careful about XSS
            // Only render if it looks like a valid SVG
            if (icon_value.trim().startsWith('<svg')) {
                return (
                    <div
                        className={cn(
                            'flex items-center justify-center',
                            className
                        )}
                        style={style}
                        dangerouslySetInnerHTML={{ __html: icon_value }}
                    />
                );
            }

            // Fallback for invalid SVG
            return (
                <span
                    className={cn(
                        'flex items-center justify-center',
                        className
                    )}
                    style={style}
                >
                    📦
                </span>
            );

        default:
            // Fallback for unknown icon types
            return (
                <span
                    className={cn(
                        'flex items-center justify-center',
                        className
                    )}
                    style={style}
                >
                    📦
                </span>
            );
    }
};

export default NodeIconDisplayer;
