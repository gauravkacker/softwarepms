"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AIParsingSettingsPage() {
  const [aiParsingEnabled, setAiParsingEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testInput, setTestInput] = useState("Ars alb 1M 1/2oz liquid 6-6-6 4 weeks");

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem("aiParsingEnabled");
    const savedApiKey = localStorage.getItem("aiParsingApiKey");
    
    if (savedEnabled === "true") {
      setAiParsingEnabled(true);
    }
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem("aiParsingEnabled", aiParsingEnabled.toString());
    localStorage.setItem("aiParsingApiKey", apiKey);
    setTestResult({ success: true, message: "Settings saved successfully!" });
    setTimeout(() => setTestResult(null), 3000);
  };

  // Test AI parsing
  const testParsing = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: "Please enter an API key first" });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/parse-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: testInput, apiKey }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: `AI Parsing successful!\n\nMethod: ${data.method}\nMedicine: ${data.data.medicineName}\nPotency: ${data.data.potency}\nQuantity: ${data.data.quantity}\nPattern: ${data.data.pattern}\nDuration: ${data.data.duration}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Parsing failed",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to connect to API",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/settings" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block">
            ← Back to Settings
          </Link>
          <h1 className="text-2xl font-bold">AI Parsing Settings</h1>
          <p className="text-neutral-400 mt-1">
            Configure free AI-powered prescription parsing using Groq (Llama 3)
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700/50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-400 mb-2">🎉 100% Free AI Parsing!</h3>
          <p className="text-sm text-neutral-300 mb-3">
            This uses Groq&apos;s free API with Llama 3 - no payment required! You get:
          </p>
          <ul className="text-sm text-neutral-300 space-y-1">
            <li>• Free API access with generous rate limits</li>
            <li>• Fast and accurate prescription parsing</li>
            <li>• No credit card needed</li>
          </ul>
        </div>

        {/* Settings Form */}
        <div className="bg-neutral-800 rounded-lg p-6 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Enable AI Parsing</label>
              <p className="text-sm text-neutral-400">Use AI for smarter prescription parsing</p>
            </div>
            <button
              onClick={() => setAiParsingEnabled(!aiParsingEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                aiParsingEnabled ? "bg-green-600" : "bg-neutral-600"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  aiParsingEnabled ? "left-8" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* API Key */}
          <div>
            <label className="block font-medium mb-2">Groq API Key</label>
            <p className="text-sm text-neutral-400 mb-2">
              Get your free API key from{" "}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                console.groq.com/keys
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Save Settings
          </button>

          {/* Status Message */}
          {testResult && (
            <div
              className={`p-4 rounded-lg ${
                testResult.success ? "bg-green-900/30 border border-green-700" : "bg-red-900/30 border border-red-700"
              }`}
            >
              <pre className="text-sm whitespace-pre-wrap">{testResult.message}</pre>
            </div>
          )}
        </div>

        {/* Test Section */}
        <div className="bg-neutral-800 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Test AI Parsing</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Input</label>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={testParsing}
              disabled={isTesting || !apiKey.trim()}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isTesting ? "Testing..." : "Test Parsing"}
            </button>
          </div>

          {/* Example Inputs */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-neutral-400 mb-2">Example Inputs to Try:</h3>
            <div className="space-y-2">
              {[
                "Ars alb 1M 1/2oz liquid 6-6-6 4 weeks",
                "Nux Vomica 200C 4 pills TDS 7 days",
                "Bryonia 30CH 2dr drops 1-0-1 for 2 weeks",
                "Sulphur 1M weekly 1 dose 1 month",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setTestInput(example)}
                  className="block w-full text-left px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-neutral-300 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* How to Get API Key */}
        <div className="bg-neutral-800 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">How to Get Your Free Groq API Key</h2>
          <ol className="space-y-3 text-neutral-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Go to <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">console.groq.com</a></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Sign up for a free account (use Google, GitHub, or email)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Go to API Keys section (or visit <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">console.groq.com/keys</a>)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>Click &quot;Create API Key&quot; and copy the key</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <span>Paste the key above and save settings</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
