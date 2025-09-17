// Header.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
    title?: string;
    onNavigateBack?: () => void;
    backButtonText?: string;
}

export const CanvasHeader: React.FC<HeaderProps> = React.memo(
    ({
        title = 'Flow Builder',
        onNavigateBack,
        backButtonText = 'Dashboard',
    }) => {
        return (
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center shadow-sm">
                <div className="flex items-center gap-4">
                    {onNavigateBack && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNavigateBack}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {backButtonText}
                        </Button>
                    )}
                </div>

                <div className="flex-1 text-center">
                    <h1 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Space for additional buttons */}
                </div>
            </header>
        );
    }
);
