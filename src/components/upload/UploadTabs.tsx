'use client'

import { useState } from 'react'
import { TextUpload } from './TextUpload'
import { ImageUpload } from './ImageUpload'
import { VideoUpload } from './VideoUpload'

type Tab = 'text' | 'image' | 'video'

interface UploadTabsProps {
  userId: string
}

export function UploadTabs({ userId }: UploadTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('text')

  const tabs = [
    { id: 'text' as Tab, label: '💬 Messaggio', icon: '📝' },
    { id: 'image' as Tab, label: '📷 Foto', icon: '🖼️' },
    { id: 'video' as Tab, label: '🎥 Video', icon: '🎬' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-birthday-purple text-white border-b-4 border-birthday-gold'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl mr-2">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'text' && <TextUpload userId={userId} />}
        {activeTab === 'image' && <ImageUpload userId={userId} />}
        {activeTab === 'video' && <VideoUpload userId={userId} />}
      </div>
    </div>
  )
}
