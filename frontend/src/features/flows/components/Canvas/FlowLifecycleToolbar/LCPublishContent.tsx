import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const examples: Record<string, { code: string; lang: string; label: string }> =
    {
        curl: {
            label: 'Bash',
            lang: 'bash',
            code: `curl -X POST 'http://localhost:5002/api/exec/<YOUR_FLOW_ID>' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer <YOUR_API_KEY>' \\
  -d '{
    "messages": [{"type": "text", "content": "hello"}],
    "session_id": null
  }'`,
        },
        js: {
            label: 'JavaScript',
            lang: 'javascript',
            code: `const response = await fetch('http://localhost:5002/api/exec/<YOUR_FLOW_ID>', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_API_KEY>'
  },
  body: JSON.stringify({
    messages: [{ type: 'text', content: 'hello' }],
    session_id: null
  })
});

const result = await response.json();
console.log(result);`,
        },
    };

const TabButton = ({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        {children}
    </button>
);

const LCPublishContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'curl' | 'js'>('curl');
    const [copied, setCopied] = useState(false);

    const { code, lang, label } = examples[activeTab];

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-gray-900">
                    API Usage
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Execute your published flow using the API endpoint
                </p>
            </div>

            <div className="flex-1 px-6 py-4 overflow-y-auto">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                    <TabButton
                        active={activeTab === 'curl'}
                        onClick={() => setActiveTab('curl')}
                    >
                        cURL
                    </TabButton>
                    <TabButton
                        active={activeTab === 'js'}
                        onClick={() => setActiveTab('js')}
                    >
                        JavaScript
                    </TabButton>
                </div>

                {/* Code Block */}
                <div className="relative mb-6">
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
                            <span className="text-sm text-gray-300 font-medium">
                                {label}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="flex items-center space-x-1 text-xs text-gray-300 hover:text-white transition-colors"
                            >
                                {copied ? (
                                    <Check size={14} />
                                ) : (
                                    <Copy size={14} />
                                )}
                                <span>{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>
                        <div className="p-4 overflow-x-auto">
                            <SyntaxHighlighter
                                language={lang}
                                style={tomorrow}
                                customStyle={{
                                    margin: 0,
                                    background: 'transparent',
                                }}
                            >
                                {code}
                            </SyntaxHighlighter>
                        </div>
                    </div>
                </div>

                {/* Parameters */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                        Parameters
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            ['flow_id', "Your flow's unique identifier"],
                            ['messages', 'Array of message objects'],
                            ['session_id', 'Optional session identifier'],
                            [
                                'Authorization',
                                'Bearer token for authentication',
                            ],
                        ].map(([name, desc]) => (
                            <div key={name} className="flex flex-col">
                                <code className="text-sm font-mono text-blue-600 font-semibold">
                                    {name}
                                </code>
                                <span className="text-xs text-gray-600 mt-1">
                                    {desc}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LCPublishContent;
