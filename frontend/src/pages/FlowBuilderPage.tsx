import React, { useEffect } from 'react';
import FlowCanvas from '@/features/flows/components/Canvas/FlowCanvas';
import { useNavigate } from 'react-router-dom';
import { CanvasHeader } from '@/features/flows/components/Canvas/CanvasHeader';
import { useParams } from 'react-router-dom';

const FlowBuilderPage: React.FC = () => {

  const { flow_id } = useParams();
  const navigate = useNavigate();

  // Use useEffect to handle navigation side-effects, which is safer.
  useEffect(() => {
    // If flow_id is not present in the URL, redirect to the dashboard.
    if (flow_id === undefined) {
      navigate('/dashboard'); 
    }
  }, [flow_id, navigate]); // Effect runs when flow_id or navigate changes

  if (flow_id === undefined) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-700">Redirecting...</h1>
            <p className="text-gray-500 mt-2">Flow ID is missing. You would be redirected to the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <CanvasHeader 
        title="Flow Builder"
        onNavigateBack={() => navigate("/dashboard")}
        backButtonText="Dashboard"
      />
      
      <div className="flex-1 overflow-hidden">
        <FlowCanvas flow_id={flow_id} />
      </div>
    </div>
  );
};

export default FlowBuilderPage;