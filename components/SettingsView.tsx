
import React, { useState, useRef } from 'react';
import { Settings, IntegrationConfig, UserProfile, AppPreferences } from '../types';
import { 
  User, Settings as SettingsIcon, Shield, Palette, Database, Check, AlertCircle, 
  Eye, EyeOff, Trash2, Download, Upload, RefreshCw, Server, Zap, Globe 
} from 'lucide-react';

interface Props {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onBack: () => void;
}

type TabId = 'general' | 'integrations' | 'appearance' | 'preferences' | 'data';

export const SettingsView: React.FC<Props> = ({ settings, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [localSettings, setLocalSettings] = useState<Settings>(JSON.parse(JSON.stringify(settings)));
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{id: string, success: boolean, message: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const handlePrefChange = (field: keyof AppPreferences, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const handleIntegrationChange = (id: string, field: keyof IntegrationConfig, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [id]: { ...prev.integrations[id], [field]: value }
      }
    }));
  };

  const saveSettings = () => {
    onSave(localSettings);
    // Visual feedback handled by parent or toast
  };

  const testOpenRouter = async (config: IntegrationConfig) => {
    if (!config.apiKey) {
      setTestResult({ id: config.id, success: false, message: "API Key is missing" });
      return;
    }

    setTestingConnection(config.id);
    setTestResult(null);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": config.httpReferer || window.location.origin,
          "X-Title": config.xTitle || "ClassCore"
        },
        body: JSON.stringify({
          model: config.model || "openai/gpt-4o-mini", // Use cheap/fast model for ping
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        setTestResult({ id: config.id, success: true, message: "Connection successful!" });
        // Update last tested
        handleIntegrationChange(config.id, 'lastTestedAt', new Date().toISOString());
      } else {
        const err = await response.json();
        setTestResult({ id: config.id, success: false, message: err.error?.message || "Connection failed" });
      }
    } catch (error) {
      setTestResult({ id: config.id, success: false, message: "Network error or CORS issue" });
    } finally {
      setTestingConnection(null);
    }
  };

  // Mock test for other services
  const testGenericService = async (config: IntegrationConfig) => {
    setTestingConnection(config.id);
    await new Promise(r => setTimeout(r, 1000));
    const success = Math.random() > 0.1;
    setTestResult({ 
      id: config.id, 
      success, 
      message: success ? "Mock connection valid" : "Could not verify key" 
    });
    setTestingConnection(null);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localSettings, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "classcore_settings.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        // Basic schema validation could go here
        setLocalSettings(imported);
        alert("Settings imported successfully. Click Save to apply.");
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  // --- Sub-components ---

  const SidebarItem = ({ id, icon: Icon, label }: { id: TabId, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800">
              <SettingsIcon size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-800">Settings & Preferences</h1>
          </div>
          <button 
            onClick={saveSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 shrink-0 space-y-1">
          <SidebarItem id="general" icon={User} label="General Profile" />
          <SidebarItem id="integrations" icon={Zap} label="Integrations" />
          <SidebarItem id="appearance" icon={Palette} label="Appearance" />
          <SidebarItem id="preferences" icon={SettingsIcon} label="Preferences" />
          <SidebarItem id="data" icon={Database} label="Export / Import" />
        </nav>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Profile Information</h2>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border-2 border-white shadow-md">
                   {localSettings.profile.avatarUrl ? (
                     <img src={localSettings.profile.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                   ) : (
                     <User size={40} />
                   )}
                </div>
                <div>
                  <button className="text-sm text-blue-600 font-medium hover:underline">Change Avatar</button>
                  <p className="text-xs text-slate-500 mt-1">Recommended: 400x400px</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={localSettings.profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={localSettings.profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select 
                    value={localSettings.profile.role}
                    onChange={(e) => handleProfileChange('role', e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea 
                  value={localSettings.profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Tell us a little about yourself..."
                />
                <p className="text-xs text-slate-500 text-right mt-1">{localSettings.profile.bio.length}/160</p>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold text-slate-800">API Integrations</h2>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <Shield size={14} className="text-green-600" />
                  Your keys are stored locally in your browser. They are never sent to our servers.
                </p>
              </div>

              {Object.values(localSettings.integrations).map((integration) => {
                const [showKey, setShowKey] = useState(false);

                return (
                  <div key={integration.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition-colors bg-slate-50/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                           {integration.provider === 'openrouter' ? <Globe size={20} className="text-purple-600"/> : 
                            integration.provider === 'google' ? <Zap size={20} className="text-yellow-600"/> : 
                            <Server size={20} className="text-slate-600"/>}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{integration.name}</h3>
                          <p className="text-xs text-slate-500">
                             {integration.lastTestedAt 
                               ? `Last verified: ${new Date(integration.lastTestedAt).toLocaleDateString()}` 
                               : 'Not verified'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={integration.enabled}
                            onChange={(e) => handleIntegrationChange(integration.id, 'enabled', e.target.checked)}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">API Key</label>
                        <div className="relative">
                          <input 
                            type={showKey ? "text" : "password"}
                            value={integration.apiKey}
                            onChange={(e) => handleIntegrationChange(integration.id, 'apiKey', e.target.value)}
                            placeholder={`sk-...`}
                            className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          />
                          <button 
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                          >
                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* OpenRouter Specific Fields */}
                      {integration.provider === 'openrouter' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <div>
                            <label className="block text-xs font-semibold text-purple-800 mb-1">Default Model</label>
                            <input 
                              type="text"
                              value={integration.model || ''}
                              onChange={(e) => handleIntegrationChange(integration.id, 'model', e.target.value)}
                              placeholder="openai/gpt-4o-mini"
                              className="w-full px-3 py-1.5 border border-purple-200 rounded text-sm focus:ring-purple-500 focus:outline-none"
                            />
                          </div>
                          <div>
                             <label className="block text-xs font-semibold text-purple-800 mb-1">HTTP Referer (Optional)</label>
                             <input 
                              type="text"
                              value={integration.httpReferer || ''}
                              onChange={(e) => handleIntegrationChange(integration.id, 'httpReferer', e.target.value)}
                              placeholder={window.location.origin}
                              className="w-full px-3 py-1.5 border border-purple-200 rounded text-sm focus:ring-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                         <div className="flex gap-2">
                           <button 
                              onClick={() => {
                                if (integration.provider === 'openrouter') testOpenRouter(integration);
                                else testGenericService(integration);
                              }}
                              disabled={testingConnection === integration.id || !integration.apiKey}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors disabled:opacity-50"
                           >
                              {testingConnection === integration.id ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Zap size={14} />
                              )}
                              Test Connection
                           </button>
                           {testResult?.id === integration.id && (
                             <span className={`text-xs flex items-center gap-1 font-medium ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                               {testResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                               {testResult.message}
                             </span>
                           )}
                         </div>
                         <button 
                            onClick={() => handleIntegrationChange(integration.id, 'apiKey', '')}
                            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                         >
                           <Trash2 size={12} /> Clear Key
                         </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Appearance</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-4">
                  {['light', 'dark', 'system'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handlePrefChange('theme', opt)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                        localSettings.preferences.theme === opt 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Font Size</label>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500">A</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="1"
                    value={localSettings.preferences.fontSize === 'small' ? 0 : localSettings.preferences.fontSize === 'normal' ? 1 : 2}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      handlePrefChange('fontSize', val === 0 ? 'small' : val === 1 ? 'normal' : 'large');
                    }}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-lg text-slate-800 font-bold">A</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-800">Reduced Motion</h4>
                  <p className="text-xs text-slate-500">Minimize animations throughout the app</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.preferences.reducedMotion}
                    onChange={(e) => handlePrefChange('reducedMotion', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

           {/* Preferences Tab */}
           {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-4">App Preferences</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Chunk Length (Minutes)</label>
                <input 
                  type="number" 
                  min="5" 
                  max="60"
                  value={localSettings.preferences.defaultChunkLengthMinutes}
                  onChange={(e) => handlePrefChange('defaultChunkLengthMinutes', parseInt(e.target.value))}
                  className="w-full md:w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Length of audio segments for processing</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-800">Auto-generate Flashcards</h4>
                  <p className="text-xs text-slate-500">Automatically create flashcards after processing</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.preferences.autoGenerateFlashcards}
                    onChange={(e) => handlePrefChange('autoGenerateFlashcards', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Export/Import Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Data Management</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 hover:bg-white transition-colors">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <Download size={24} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Export Settings</h3>
                  <p className="text-sm text-slate-500 mb-4">Download your configuration, including non-sensitive preferences, as a JSON file.</p>
                  <button 
                    onClick={handleExport}
                    className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
                  >
                    Download JSON
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 hover:bg-white transition-colors">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                    <Upload size={24} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Import Settings</h3>
                  <p className="text-sm text-slate-500 mb-4">Restore your settings from a previously exported JSON file.</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
                  >
                    Select File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    className="hidden" 
                    accept=".json"
                  />
                </div>
              </div>

              <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
                 <AlertCircle className="text-red-500 shrink-0 mt-1" size={20} />
                 <div>
                   <h4 className="font-bold text-red-800">Danger Zone</h4>
                   <p className="text-sm text-red-600 mt-1">Clearing local data will remove all stored API keys and preferences. This action cannot be undone.</p>
                   <button 
                    onClick={() => {
                       if(confirm("Are you sure you want to reset all settings to default?")) {
                         setLocalSettings({
                            profile: { name: '', email: '', role: 'student', bio: '' },
                            integrations: {},
                            preferences: { theme: 'system', fontSize: 'normal', reducedMotion: false, defaultChunkLengthMinutes: 10, autoGenerateFlashcards: true }
                         });
                       }
                    }}
                    className="mt-3 px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 text-sm"
                   >
                     Reset All Settings
                   </button>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
