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
        python: {
            label: 'Python',
            lang: 'python',
            code: `import requests
import json

url = 'http://localhost:5002/api/exec/<YOUR_FLOW_ID>'
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_API_KEY>'
}
data = {
    'messages': [{'type': 'text', 'content': 'hello'}],
    'session_id': None
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`,
        },
        java: {
            label: 'Java',
            lang: 'java',
            code: `import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

public class ApiExample {
    public static void main(String[] args) throws Exception {
        URL url = new URL("http://localhost:5002/api/exec/<YOUR_FLOW_ID>");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer <YOUR_API_KEY>");
        conn.setDoOutput(true);
        
        String jsonInputString = "{\\"messages\\":[{\\"type\\":\\"text\\",\\"content\\":\\"hello\\"}],\\"session_id\\":null}";
        
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonInputString.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }
        
        try (Scanner scanner = new Scanner(conn.getInputStream(), StandardCharsets.UTF_8.name())) {
            String response = scanner.useDelimiter("\\\\A").next();
            System.out.println(response);
        }
    }
}`,
        },
        csharp: {
            label: 'C#',
            lang: 'csharp',
            code: `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using (var client = new HttpClient())
        {
            client.DefaultRequestHeaders.Add("Authorization", "Bearer <YOUR_API_KEY>");
            
            var payload = new
            {
                messages = new[] { new { type = "text", content = "hello" } },
                session_id = (object)null
            };
            
            var content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );
            
            var response = await client.PostAsync(
                "http://localhost:5002/api/exec/<YOUR_FLOW_ID>",
                content
            );
            
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine(result);
        }
    }
}`,
        },
        go: {
            label: 'Go',
            lang: 'go',
            code: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type Message struct {
    Type    string \`json:"type"\`
    Content string \`json:"content"\`
}

type RequestBody struct {
    Messages  []Message \`json:"messages"\`
    SessionID *string   \`json:"session_id"\`
}

func main() {
    url := "http://localhost:5002/api/exec/<YOUR_FLOW_ID>"
    
    requestBody := RequestBody{
        Messages: []Message{
            {Type: "text", Content: "hello"},
        },
        SessionID: nil,
    }
    
    jsonBody, err := json.Marshal(requestBody)
    if err != nil {
        panic(err)
    }
    
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
    if err != nil {
        panic(err)
    }
    
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer <YOUR_API_KEY>")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        panic(err)
    }
    
    fmt.Println(string(body))
}`,
        },
        ruby: {
            label: 'Ruby',
            lang: 'ruby',
            code: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('http://localhost:5002/api/exec/<YOUR_FLOW_ID>')
request = Net::HTTP::Post.new(uri)
request.content_type = 'application/json'
request['Authorization'] = 'Bearer <YOUR_API_KEY>'

request.body = JSON.generate({
  messages: [{ type: 'text', content: 'hello' }],
  session_id: nil
})

response = Net::HTTP.start(uri.hostname, uri.port) do |http|
  http.request(request)
end

puts response.body`,
        },
        php: {
            label: 'PHP',
            lang: 'php',
            code: `<?php
$url = 'http://localhost:5002/api/exec/<YOUR_FLOW_ID>';
$data = [
    'messages' => [
        ['type' => 'text', 'content' => 'hello']
    ],
    'session_id' => null
];

$payload = json_encode($data);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer <YOUR_API_KEY>'
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`,
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
    const [activeTab, setActiveTab] = useState<
        'curl' | 'js' | 'python' | 'java' | 'csharp' | 'go' | 'ruby' | 'php'
    >('curl');
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
                <div className="flex border-b border-gray-200 mb-4 flex-wrap">
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
                    <TabButton
                        active={activeTab === 'python'}
                        onClick={() => setActiveTab('python')}
                    >
                        Python
                    </TabButton>
                    <TabButton
                        active={activeTab === 'java'}
                        onClick={() => setActiveTab('java')}
                    >
                        Java
                    </TabButton>
                    <TabButton
                        active={activeTab === 'csharp'}
                        onClick={() => setActiveTab('csharp')}
                    >
                        C#
                    </TabButton>
                    <TabButton
                        active={activeTab === 'go'}
                        onClick={() => setActiveTab('go')}
                    >
                        Go
                    </TabButton>
                    <TabButton
                        active={activeTab === 'ruby'}
                        onClick={() => setActiveTab('ruby')}
                    >
                        Ruby
                    </TabButton>
                    <TabButton
                        active={activeTab === 'php'}
                        onClick={() => setActiveTab('php')}
                    >
                        PHP
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
