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
            <header className="relative bg-gradient-to-br from-indigo-50 via-white via-purple-50/30 to-cyan-50/50 border-b border-indigo-200/40 px-6 py-2 flex items-center shadow-lg shadow-indigo-100/20 backdrop-blur-md">
                {/* Decorative background elements */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 opacity-60"></div>
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-radial from-indigo-200/20 to-transparent rounded-full blur-xl"></div>
                <div className="absolute top-0 right-1/3 w-24 h-24 bg-gradient-radial from-purple-200/20 to-transparent rounded-full blur-lg"></div>

                <div className="relative flex items-center gap-4 w-1/4">
                    {onNavigateBack && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNavigateBack}
                            className="group flex items-center gap-2.5 bg-white/90 hover:bg-white border-indigo-200/60 hover:border-indigo-300/80 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm hover:scale-105"
                        >
                            <div className="p-1 rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors duration-200">
                                <ArrowLeft className="h-3.5 w-3.5 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                            </div>
                            <span className="font-medium text-indigo-700 group-hover:text-indigo-800 transition-colors">
                                {backButtonText}
                            </span>
                        </Button>
                    )}
                </div>

                <div className="flex-1 text-center relative">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/80 shadow-sm border border-indigo-100/50 backdrop-blur-sm">
                        <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-600 bg-clip-text text-transparent">
                            {currentFlow ? currentFlow.name : title}
                        </h2>
                        {currentFlow && (
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-200/50"></div>
                        )}
                    </div>
                    {currentFlow && (
                        <div className="flex flex-col items-center mt-1">
                            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-md bg-slate-100/70 border border-slate-200/50">
                                <p className="text-xs font-mono text-slate-600 font-medium">
                                    {currentFlow.flow_id}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 w-1/4 justify-end">
                    {/* Space for additional buttons with enhanced styling */}
                </div>
            </header>
        );
    }
);
