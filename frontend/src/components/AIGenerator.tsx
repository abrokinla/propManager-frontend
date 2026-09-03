'use client';

import { useState } from 'react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

interface AIGeneratorProps {
  propertyId: number;
  propertyName: string;
  onDescriptionGenerated?: (description: string) => void;
}

export default function AIGenerator({ propertyId, propertyName, onDescriptionGenerated }: AIGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'social'>('description');
  const [generating, setGenerating] = useState(false);
  const [description, setDescription] = useState('');
  const [socialPosts, setSocialPosts] = useState<Record<string, string> | null>(null);
  const [copied, setCopied] = useState('');
  const { toast } = useToast();

  const generateDescription = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/ai/generate-description/', { property_id: propertyId });
      setDescription(data.description);
      onDescriptionGenerated?.(data.description);
      toast('Description generated!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const generateSocialPosts = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/ai/generate-social-posts/', { property_id: propertyId });
      setSocialPosts(data.posts);
      toast('Social posts generated!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>AI Content Generator</h3>
          <p className="text-xs" style={{ color: 'var(--text-light)' }}>Generate descriptions & social posts for {propertyName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: 'var(--bg)' }}>
        <button
          onClick={() => setActiveTab('description')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'description' ? 'bg-white shadow-sm' : ''
          }`}
          style={{ color: activeTab === 'description' ? 'var(--primary)' : 'var(--text-light)' }}
        >
          Description
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'social' ? 'bg-white shadow-sm' : ''
          }`}
          style={{ color: activeTab === 'social' ? 'var(--primary)' : 'var(--text-light)' }}
        >
          Social Posts
        </button>
      </div>

      {/* Description Tab */}
      {activeTab === 'description' && (
        <div>
          {!description ? (
            <button
              onClick={generateDescription}
              disabled={generating}
              className="btn btn-primary w-full"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Description
                </span>
              )}
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-light)' }}>Generated Description</span>
                <button
                  onClick={() => copyToClipboard(description, 'desc')}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: 'var(--primary)' }}
                >
                  {copied === 'desc' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-3 rounded-lg text-sm leading-relaxed" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                {description}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={generateDescription} className="btn btn-secondary text-sm flex-1" disabled={generating}>
                  Regenerate
                </button>
                <button onClick={() => setDescription('')} className="btn btn-secondary text-sm" style={{ color: 'var(--danger)' }}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Social Posts Tab */}
      {activeTab === 'social' && (
        <div>
          {!socialPosts ? (
            <button
              onClick={generateSocialPosts}
              disabled={generating}
              className="btn btn-primary w-full"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Social Posts
                </span>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              {socialPosts.raw ? (
                <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                  {socialPosts.raw}
                </div>
              ) : (
                Object.entries(socialPosts).map(([platform, text]) => (
                  <div key={platform}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-light)' }}>
                        {platform === 'instagram' ? '📸 Instagram' : platform === 'twitter' ? '🐦 Twitter/X' : '💬 WhatsApp'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(text, platform)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: 'var(--primary)' }}
                      >
                        {copied === platform ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-3 rounded-lg text-sm whitespace-pre-wrap" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                      {text}
                    </div>
                  </div>
                ))
              )}
              <button onClick={generateSocialPosts} className="btn btn-secondary w-full text-sm" disabled={generating}>
                Regenerate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
