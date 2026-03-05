import { useState, useEffect } from 'react';
import { Save, RotateCcw, Palette, Type, Image as ImageIcon, Layout, AlertCircle } from 'lucide-react';

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
}

interface SettingsByCategory {
  branding: Setting[];
  colors: Setting[];
  typography: Setting[];
  content: Setting[];
  layout: Setting[];
}

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [settingsByCategory, setSettingsByCategory] = useState<SettingsByCategory | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/site-settings', { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setSettingsByCategory(data.settingsByCategory);
        setFormData(data.settingsMap);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings: formData })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully! Refresh the page to see changes.' });
        // Apply settings dynamically
        applySettings();
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/site-settings/reset', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings reset to defaults! Refreshing...' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: 'error', text: 'Failed to reset settings' });
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  const applySettings = () => {
    // Apply CSS variables dynamically
    const root = document.documentElement;
    
    if (formData.primary_color) root.style.setProperty('--primary', formData.primary_color);
    if (formData.accent_color) root.style.setProperty('--accent', formData.accent_color);
    if (formData.background_color) root.style.setProperty('--background', formData.background_color);
    if (formData.text_primary_color) root.style.setProperty('--text-primary', formData.text_primary_color);
    if (formData.text_secondary_color) root.style.setProperty('--text-secondary', formData.text_secondary_color);
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-gray-900">Site Customization</h2>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 disabled:opacity-50"
          >
            <RotateCcw size={18} />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <AlertCircle size={20} />
          {message.text}
        </div>
      )}

      {/* Branding Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="text-primary" size={24} />
          <h3 className="text-lg font-display font-bold text-gray-900">Branding & Identity</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsByCategory?.branding?.map((setting) => (
            <div key={setting.setting_key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {setting.description}
              </label>
              {setting.setting_type === 'image' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData[setting.setting_key] || ''}
                    onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                    placeholder="Enter image URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">Enter the full URL to your image</p>
                </div>
              ) : (
                <input
                  type="text"
                  value={formData[setting.setting_key] || ''}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Colors Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="text-primary" size={24} />
          <h3 className="text-lg font-display font-bold text-gray-900">Theme Colors</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {settingsByCategory?.colors?.map((setting) => (
            <div key={setting.setting_key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {setting.description}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData[setting.setting_key] || '#000000'}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData[setting.setting_key] || ''}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="text-primary" size={24} />
          <h3 className="text-lg font-display font-bold text-gray-900">Typography</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {settingsByCategory?.typography?.map((setting) => (
            <div key={setting.setting_key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {setting.description}
              </label>
              {setting.setting_type === 'number' ? (
                <input
                  type="number"
                  value={formData[setting.setting_key] || ''}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <select
                  value={formData[setting.setting_key] || ''}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Playfair Display">Playfair Display</option>
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="text-primary" size={24} />
          <h3 className="text-lg font-display font-bold text-gray-900">Site Content</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {settingsByCategory?.content?.map((setting) => (
            <div key={setting.setting_key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {setting.description}
              </label>
              {setting.setting_key === 'welcome_message' ? (
                <textarea
                  value={formData[setting.setting_key] || ''}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <input
                  type="text"
                  value={formData[setting.setting_key] || ''}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Layout Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="text-primary" size={24} />
          <h3 className="text-lg font-display font-bold text-gray-900">Layout Options</h3>
        </div>
        <div className="space-y-3">
          {settingsByCategory?.layout?.map((setting) => (
            <div key={setting.setting_key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{setting.description}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[setting.setting_key] === 'true'}
                  onChange={(e) => handleChange(setting.setting_key, e.target.checked ? 'true' : 'false')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={handleReset}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 disabled:opacity-50"
        >
          <RotateCcw size={18} />
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
