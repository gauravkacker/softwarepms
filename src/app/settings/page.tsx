"use client";

import Link from "next/link";

export default function SettingsPage() {
  const settingsItems = [
    {
      title: "AI Parsing",
      description: "Configure free AI-powered prescription parsing using Groq (Llama 3)",
      href: "/settings/ai-parsing",
      icon: "🤖",
      badge: "FREE",
    },
    {
      title: "Registration Settings",
      description: "Configure registration number and clinic details",
      href: "/settings/registration",
      icon: "📋",
    },
    {
      title: "Fee Management",
      description: "Set up consultation fees and charges",
      href: "/settings/fees",
      icon: "💰",
    },
    {
      title: "Time Slots",
      description: "Configure appointment time slots",
      href: "/settings/slots",
      icon: "🕐",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="grid gap-4">
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-neutral-800 rounded-lg p-4 hover:bg-neutral-700 transition-colors flex items-center gap-4"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{item.title}</h2>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-green-600 text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-400">{item.description}</p>
              </div>
              <span className="text-neutral-500">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
