import React from 'react';
import FlowCanvas from '../components/FlowBuilder/FlowCanvas';
import { useNavigate } from 'react-router-dom';
import { CanvasHeader } from '@/components/FlowBuilder/CanvasHeader';

const FlowBuilderPage: React.FC = () => {

  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col">
      <CanvasHeader 
        title="Flow Builder"
        onNavigateBack={() => navigate("/dashboard")}
        backButtonText="Dashboard"
      />
      
      <div className="flex-1 overflow-hidden">
        <FlowCanvas />
      </div>
    </div>
  );
};

export default FlowBuilderPage;