// Header.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import useFlowStore from '../../stores/flow_stores';

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
        const currentFlow = useFlowStore(
            (state: { current_flow: any }) => state.current_flow
        );

        return (
            <header className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-gray-200/60 px-6 py-4 flex items-center shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    {onNavigateBack && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNavigateBack}
                            className="flex items-center gap-2 bg-white/80 hover:bg-white border-gray-300/60"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {backButtonText}
                        </Button>
                    )}
                </div>

                <div className="flex-1 text-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {currentFlow ? currentFlow.name : title}
                    </h2>
                    {currentFlow && (
                        <div className="flex flex-col items-center mt-1">
                            <p className="text-xs text-gray-500">
                                ID: {currentFlow.flow_id}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Space for additional buttons */}
                </div>
            </header>
        );
    }
);
