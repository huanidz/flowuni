import React from 'react';

// Interface for the toolbar props (can be extended later)
interface FlowLifecycleToolbarProps {
    // Add any props needed in the future
}

// Styles for the lifecycle toolbar positioned in top center
const toolbarContainer = {
    position: 'absolute' as const,
    top: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
};

const toolbarWrapper = {
    fontFamily: 'sans-serif',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const lifecycleButton = {
    backgroundColor: '#6f42c1',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s ease',
};

const lifecycleButtonHover = {
    backgroundColor: '#5a359a',
};

// Individual button components
const LifecycleButton: React.FC<{ label: string; onClick: () => void }> = ({
    label,
    onClick,
}) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <button
            style={{
                ...lifecycleButton,
                ...(isHovered ? lifecycleButtonHover : {}),
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {label}
        </button>
    );
};

const FlowLifecycleToolbar: React.FC<FlowLifecycleToolbarProps> = () => {
    // Dummy click handlers for now
    const handleBtn1Click = () => {
        console.log('Btn1 clicked - placeholder action');
    };

    const handleBtn2Click = () => {
        console.log('Btn2 clicked - placeholder action');
    };

    const handleBtn3Click = () => {
        console.log('Btn3 clicked - placeholder action');
    };

    return (
        <div style={toolbarContainer}>
            <div style={toolbarWrapper}>
                <LifecycleButton label="Btn1" onClick={handleBtn1Click} />
                <LifecycleButton label="Btn2" onClick={handleBtn2Click} />
                <LifecycleButton label="Btn3" onClick={handleBtn3Click} />
            </div>
        </div>
    );
};

export default FlowLifecycleToolbar;
