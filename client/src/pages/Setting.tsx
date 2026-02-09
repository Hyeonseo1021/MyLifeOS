import { useState, useEffect } from 'react';
import { Monitor, Globe, User, Check, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { settingApi } from '../api/setting';

interface GeneralSettings {
  username: string;
  theme: 'dark' | 'light' | 'system';
  language: 'ko' | 'en';
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<GeneralSettings>({
    username: '',
    theme: theme,
    language: 'ko',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingApi.getSettings();
        if (data) {
          setSettings({
            username: data.username || '',
            theme: data.theme || 'dark',
            language: data.language || 'ko'
          });
          if (data.theme) setTheme(data.theme as any);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    };
    loadSettings();
  }, [setTheme]);

  const updateSetting = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'theme') {
      setTheme(value as any);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingApi.updateSettings(settings);
      setTimeout(() => setIsSaving(false), 800);
    } catch (e) {
      console.error("Failed to save settings:", e);
      alert("설정 저장에 실패했습니다.");
      setIsSaving(false);
    }
  };

  const noDrag = { WebkitAppRegion: 'no-drag' } as any;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-[var(--text-main)] overflow-hidden relative font-sans selection:bg-[var(--text-main)] selection:text-[var(--bg-main)] transition-colors duration-300">
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] hidden dark:block" 
        style={{ 
          backgroundImage: 'linear-gradient(var(--text-main) 1px, transparent 1px), linear-gradient(90deg, var(--text-main) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto scrollbar-thin">
        <div className="w-full max-w-xl flex flex-col gap-10 animate-fadeIn z-10">
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-[0.3em] text-[var(--text-main)] uppercase">
              SETTING
            </h1>
            <p className="text-[10px] md:text-xs text-[var(--text-muted)] tracking-widest uppercase font-bold opacity-70">
              System Configuration
            </p>
          </div>

          <div className="flex flex-col gap-8 border-t border-b border-[var(--border-main)] py-12">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-4 pt-3">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <User size={14} />
                  <span className="text-xs font-bold tracking-widest uppercase">User Alias</span>
                </div>
              </div>
              <div className="md:col-span-8">
                <input 
                  type="text" 
                  value={settings.username}
                  onChange={(e) => updateSetting('username', e.target.value)}
                  style={noDrag}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] text-sm px-4 py-3 rounded-sm outline-none focus:border-[var(--text-main)] transition-all font-medium placeholder-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-4 pt-3">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Monitor size={14} />
                  <span className="text-xs font-bold tracking-widest uppercase">Appearance</span>
                </div>
              </div>
              <div className="md:col-span-8 grid grid-cols-3 gap-3">
                {['dark', 'light', 'system'].map((t) => (
                  <button
                    key={t}
                    onClick={() => updateSetting('theme', t as any)}
                    style={noDrag}
                    className={`relative flex flex-col items-center justify-center py-3 border rounded-sm transition-all cursor-pointer uppercase text-[10px] tracking-wider font-bold shadow-sm
                      ${settings.theme === t 
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] border-[var(--text-main)]' 
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--text-main)] hover:text-[var(--text-main)]'
                      }`}
                  >
                    {t}
                    {settings.theme === t && <div className="absolute top-1 right-1"><Check size={10} /></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-4 pt-3">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Globe size={14} />
                  <span className="text-xs font-bold tracking-widest uppercase">Language</span>
                </div>
              </div>
              <div className="md:col-span-8 grid grid-cols-2 gap-3">
                {[{ id: 'ko', label: 'Korean' }, { id: 'en', label: 'English' }].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => updateSetting('language', lang.id as any)}
                    style={noDrag}
                    className={`flex items-center justify-center py-3 border rounded-sm transition-all cursor-pointer uppercase text-[10px] tracking-wider font-bold shadow-sm
                      ${settings.language === lang.id 
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] border-[var(--text-main)]' 
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--text-main)] hover:text-[var(--text-main)]'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSave}
              style={noDrag}
              disabled={isSaving}
              className="px-12 py-3.5 bg-[var(--text-main)] text-[var(--bg-main)] text-xs font-black uppercase tracking-[0.2em] hover:opacity-80 transition-all flex items-center gap-3 disabled:opacity-50 shadow-md rounded-sm"
            >
              {isSaving ? 'Saving...' : <><Save size={14} />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}