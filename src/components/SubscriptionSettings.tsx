import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Timer, Award, Check, Cpu, AlertCircle, Copy, Laptop, Lock, Unlock, Phone, Sparkles, Building2, HelpCircle } from 'lucide-react';
import { AppState, Subscription, SubscriptionPlan } from '../types';
import { translations } from '../translations';

// Dynamic Cryptographic SaaS Key Generator
export function getCryptoSaaSKey(plan: string, deviceId: string, isUniversal: boolean, salt = 'ALGERIA_SMC_2026'): string {
  const checkDevice = isUniversal ? 'GLOBAL' : deviceId.trim().toUpperCase().slice(0, 8);
  const planPrefix = plan.toUpperCase().slice(0, 3); // BAS, PRO, ENT
  
  const rawSource = `${planPrefix}-${checkDevice}-${salt}`;
  let hash = 0;
  for (let i = 0; i < rawSource.length; i++) {
    hash = (hash << 5) - hash + rawSource.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const hexCode = Math.abs(hash).toString(16).toUpperCase().slice(0, 8);
  return `SMC-${planPrefix}-${checkDevice}-${hexCode}`;
}

interface SubscriptionSettingsProps {
  state: AppState;
  t: typeof translations['ar' | 'fr' | 'en'];
  onActivateLicense: (key: string, plan: SubscriptionPlan) => void;
}

export default function SubscriptionSettings({ state, t, onActivateLicense }: SubscriptionSettingsProps) {
  const [activationKey, setActivationKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Hidden Developer / Reseller states
  const [vendorUnlocked, setVendorUnlocked] = useState(() => {
    return localStorage.getItem('smc_vendor_unlocked') === 'true';
  });
  const [titleClicks, setTitleClicks] = useState(0);

  const handleTitleClick = () => {
    const nextClicks = titleClicks + 1;
    setTitleClicks(nextClicks);
    if (nextClicks >= 7) {
      const newValue = !vendorUnlocked;
      setVendorUnlocked(newValue);
      localStorage.setItem('smc_vendor_unlocked', String(newValue));
      alert(newValue ? 'تم إظهار بوابة الموزع وشريك المبيعات بنجاح 💼' : 'تم إخفاء بوابة الموزع وشريك المبيعات بنجاح 🔒');
      setTitleClicks(0);
    }
  };

  // Vendor Reseller Admin States
  const [showDevGate, setShowDevGate] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [isDevAuthorized, setIsDevAuthorized] = useState(() => {
    return localStorage.getItem('smc_vendor_authorized') === 'true';
  });
  
  // Vendor Customizable Parameters
  const [vendorBasicPrice, setVendorBasicPrice] = useState(() => localStorage.getItem('smc_vendor_basic_price') || '5000 د.ج / سنوي');
  const [vendorProPrice, setVendorProPrice] = useState(() => localStorage.getItem('smc_vendor_pro_price') || '12000 د.ج / سنوي');
  const [vendorEntPrice, setVendorEntPrice] = useState(() => localStorage.getItem('smc_vendor_enterprise_price') || '25000 د.ج / سنوي');
  const [vendorSupportWhatsApp, setVendorSupportWhatsApp] = useState(() => localStorage.getItem('smc_vendor_support_whatsapp') || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // License Generator States
  const [genClientName, setGenClientName] = useState('');
  const [genDeviceId, setGenDeviceId] = useState('');
  const [genPlan, setGenPlan] = useState<SubscriptionPlan>('professional');
  const [genIsUniversal, setGenIsUniversal] = useState(false);
  const [generatedResultKey, setGeneratedResultKey] = useState<string | null>(null);
  const [copiedKeyMsg, setCopiedKeyMsg] = useState(false);

  const { subscription } = state;

  // Calculate dynamic trial remaining days
  const trialStart = new Date(subscription.trialStartDate).getTime();
  const now = Date.now();
  const daysDiff = Math.ceil((trialStart + (15 * 24 * 3600 * 1000) - now) / (1000 * 3600 * 24));
  const remainingDays = Math.max(0, daysDiff);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const keyCleaned = activationKey.trim().toUpperCase();

    // 1. Try default trial shortcut keys
    if (keyCleaned === 'PRO-2026-ACTIVE') {
      onActivateLicense(keyCleaned, 'professional');
      setSuccessMsg(t.activationSuccess);
      setActivationKey('');
      return;
    } else if (keyCleaned === 'BASIC-2026') {
      onActivateLicense(keyCleaned, 'basic');
      setSuccessMsg(t.activationSuccess);
      setActivationKey('');
      return;
    } else if (keyCleaned === 'ENTERPRISE-2026') {
      onActivateLicense(keyCleaned, 'enterprise');
      setSuccessMsg(t.activationSuccess);
      setActivationKey('');
      return;
    }

    // 2. Try Cryptographic SaaS Key validations
    const myDevice = subscription.deviceId || 'DEV-STATION-1';
    
    const checkBasic = getCryptoSaaSKey('basic', myDevice, false);
    const checkBasicGlobal = getCryptoSaaSKey('basic', 'GLOBAL', true);
    
    const checkPro = getCryptoSaaSKey('professional', myDevice, false);
    const checkProGlobal = getCryptoSaaSKey('professional', 'GLOBAL', true);
    
    const checkEnt = getCryptoSaaSKey('enterprise', myDevice, false);
    const checkEntGlobal = getCryptoSaaSKey('enterprise', 'GLOBAL', true);

    if (keyCleaned === checkPro || keyCleaned === checkProGlobal) {
      onActivateLicense(keyCleaned, 'professional');
      setSuccessMsg(`تهانينا! تم التحقق من مفتاح التفعيل الاحترافي (Professional) بنجاح وترخيص محطة العمل بالكامل.`);
      setActivationKey('');
    } else if (keyCleaned === checkBasic || keyCleaned === checkBasicGlobal) {
      onActivateLicense(keyCleaned, 'basic');
      setSuccessMsg(`تهانينا! تم التحقق من مفتاح التفعيل الأساسي (Basic) بنجاح وترخيص محطة العمل بالكامل.`);
      setActivationKey('');
    } else if (keyCleaned === checkEnt || keyCleaned === checkEntGlobal) {
      onActivateLicense(keyCleaned, 'enterprise');
      setSuccessMsg(`تهانينا! تم التحقق من مفتاح تفعيل المؤسسات (Enterprise) بنجاح وترخيص محطة العمل بجميع المزايا السحابية.`);
      setActivationKey('');
    } else {
      setErrorMsg('رمز التفعيل هذا غير صالح أو لا يتطابق مع معرف جهازك الحالي.');
    }
  };

  const handleApplyVendorSettings = () => {
    localStorage.setItem('smc_vendor_basic_price', vendorBasicPrice);
    localStorage.setItem('smc_vendor_pro_price', vendorProPrice);
    localStorage.setItem('smc_vendor_enterprise_price', vendorEntPrice);
    localStorage.setItem('smc_vendor_support_whatsapp', vendorSupportWhatsApp);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleUnlockDevMode = (e: React.FormEvent) => {
    e.preventDefault();
    if (devPassword === 'LOUDJAINA@1985') {
      setIsDevAuthorized(true);
      localStorage.setItem('smc_vendor_authorized', 'true');
      setErrorMsg(null);
      setDevPassword('');
    } else {
      alert('رمز الدخول السري غير صحيح. اتصل بمطور النظام الرئيسي لاسترداده!');
    }
  };

  const handleLockDevMode = () => {
    setIsDevAuthorized(false);
    localStorage.removeItem('smc_vendor_authorized');
  };

  const handleGenerateKey = () => {
    const targetDevice = genIsUniversal ? 'GLOBAL' : (genDeviceId || 'GLOBAL');
    const license = getCryptoSaaSKey(genPlan, targetDevice, genIsUniversal);
    setGeneratedResultKey(license);
  };

  const handleCopyGeneratedText = () => {
    if (!generatedResultKey) return;
    const shareText = `📝 شهادة ترخيص برنامج "المدير الذكي للتجارة"
👤 المستفيد: ${genClientName || 'زبون غير محدد'}
💎 فئة الترخيص: ${genPlan.toUpperCase()}
💻 قفل الأجهزة: ${genIsUniversal ? 'مفتوح (لكافة الحواسيب)' : `مقيد بالجهاز: ${genDeviceId}`}
🔑 مفتاح التفعيل الفوري:
${generatedResultKey}

💡 طريقة التفعيل:
1. افتح البرنامج على حاسوبك.
2. اذهب لتبويب "الاشتراك والترخيص" 🏆
3. الصق كود التفعيل أعلاه واضغط على "تفعيل الترخيص".`;

    navigator.clipboard.writeText(shareText);
    setCopiedKeyMsg(true);
    setTimeout(() => setCopiedKeyMsg(false), 3000);
  };

  const planTiers = [
    {
      name: t.basicPlan,
      price: vendorBasicPrice,
      features: ['تتبع المنتجات المحدودة', 'ربط بوت تيليجرام واحد', 'شحن الإيصالات واتساب', 'مستخدم موظف واحد'],
      level: 'basic',
    },
    {
      name: t.proPlan,
      price: vendorProPrice,
      features: ['أعداد غير محدودة للمنتجات', 'مزامنة تيليجرام فورية مكررة', 'مولد الفواتير الاحترافية المدمج', 'مستويات وصول المدير والموظفين', 'تقارير أرباح متقدمة'],
      level: 'professional',
      popular: true,
    },
    {
      name: t.enterprisePlan,
      price: vendorEntPrice,
      features: ['خيارات نسخ احتياطي سحابي تلقائي', 'تعدد مستخدمي الفروع بالاتصال المباشر', 'مزامنة لعدة بوتات قنوات شحن في وقت واحد', 'طاقم دعم مالي مخصص 24/7'],
      level: 'enterprise',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div 
          onClick={handleTitleClick} 
          className="cursor-pointer select-none active:opacity-90 transition-opacity"
          title="الاشتراك والترخيص"
        >
          <h1 className="text-xl font-bold text-slate-900 dark:text-white border-r-4 border-indigo-600 pr-3">إدارة ترخيص وتسيير المنظومة</h1>
          <p className="text-slate-400 text-xs mt-1">تفعيل المزايا المتقدمة وإدارة مفاتيح التشغيل التجاري المضمون</p>
        </div>

        {/* Developer SaaS Reseller Action Access Button */}
        {vendorUnlocked && (
          <button
            onClick={() => setShowDevGate(!showDevGate)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
              isDevAuthorized 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 animate-pulse" />
            <span>{isDevAuthorized ? 'لوحة بائع وموزع البرنامج نشطة 👤' : 'بوابة بيع تراخيص البرنامج 💼'}</span>
          </button>
        )}
      </div>

      {/* Developer Gates Form Password */}
      {showDevGate && !isDevAuthorized && (
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-800/40 space-y-4 text-right animate-scale-up" dir="rtl">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h3 className="text-sm font-black text-white">بوابة شريك المبيعات والترخيص الذاتي</h3>
              <p className="text-[10px] text-indigo-300">هذه المساحة مخصصة لمالك البرنامج ومندوبي المبيعات لإنشاء رخص مشفرة مستقلة للزبائن.</p>
            </div>
          </div>
          <form onSubmit={handleUnlockDevMode} className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="password"
              placeholder="أدخل كلمة مرور المطور الحالية"
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
              className="px-3.5 py-2 bg-black/40 border border-indigo-800/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-grow text-center font-mono"
            />
            <button
              type="submit"
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-xl transition cursor-pointer"
            >
              فتح لوحة الموزع 🛠️
            </button>
          </form>
        </div>
      )}

      {/* Authorized Developer Workspace Panel */}
      {isDevAuthorized && (
        <div className="bg-slate-900 border border-indigo-950 rounded-3xl p-6 space-y-6 text-white text-right animate-scale-up" dir="rtl">
          <div className="flex items-center justify-between border-b border-indigo-950 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-900/40 flex items-center justify-center text-xl">💼</div>
              <div>
                <h3 className="text-sm font-black text-white">لوحة شريك توزيع البرنامج وتوليد المفاتيح (Crypto Generator)</h3>
                <p className="text-[10px] text-slate-400">تحكّم في أسعار اشتراكاتك بالعملة المحلية، وأنشئ كود تفعيل غير محدود ومغلق برقم الجهاز لزبائنك.</p>
              </div>
            </div>
            <button
              onClick={handleLockDevMode}
              className="text-slate-400 hover:text-white px-3 py-1.5 bg-black/35 border border-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
            >
              قفل وتسجيل الخروج 🔒
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* White-Label Price & Support Customizer */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-indigo-950 p-4.5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>إعدادات واجهة البيع للزبائن (White-Label)</span>
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">الأسعار المدخلة هنا سيظهر مفعولها مباشرة ببطاقة مقارنة العروض للزبون، لتبدو له أسعار الخدمة التي تقررها أنت.</p>
              
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-black block mb-1">تسعيرة الفئة الأساسية (Basic):</label>
                  <input
                    type="text"
                    value={vendorBasicPrice}
                    onChange={(e) => setVendorBasicPrice(e.target.value)}
                    placeholder="مثل: 5000 د.ج / سنوي"
                    className="w-full px-3 py-2 bg-black/40 border border-indigo-950 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-black block mb-1">تسعيرة الفئة الاحترافية (Professional):</label>
                  <input
                    type="text"
                    value={vendorProPrice}
                    onChange={(e) => setVendorProPrice(e.target.value)}
                    placeholder="مثل: 12000 د.ج / سنوي"
                    className="w-full px-3 py-2 bg-black/40 border border-indigo-950 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-black block mb-1">تسعيرة فئة المؤسسات (Enterprise):</label>
                  <input
                    type="text"
                    value={vendorEntPrice}
                    onChange={(e) => setVendorEntPrice(e.target.value)}
                    placeholder="مثل: 25000 د.ج / سنوي"
                    className="w-full px-3 py-2 bg-black/40 border border-indigo-950 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-black block mb-1">رقم هاتف الدعم لمشتري تطبيقك (مع مفتاح البلد):</label>
                  <input
                    type="text"
                    value={vendorSupportWhatsApp}
                    onChange={(e) => setVendorSupportWhatsApp(e.target.value)}
                    placeholder="مثال: +213790112233"
                    className="w-full px-3 py-2 bg-black/40 border border-indigo-950 rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyVendorSettings}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                >
                  {saveSuccess ? '✔️ تم تطبيق وتثبيت الأسعار بالواجهة!' : 'حفظ الإعدادات التجارية المخصصة 🛟'}
                </button>
              </div>
            </div>

            {/* Cryptographic Licensing Generator */}
            <div className="lg:col-span-7 bg-indigo-950/15 border border-indigo-900/30 p-4.5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>مولد المفاتيح المشفرة (Crypto Key Creator)</span>
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">ولد مفاتيح حقيقية آمنة 100% تعمل على محطة معينة بشكل حصري ومقيد بالعتاد أو مفاتيح شاملة عمومية.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-black block mb-1">اسم العميل الفعلي (المحل/المؤسسة):</label>
                  <input
                    type="text"
                    placeholder="مثل: سوبرماركت الوفاء"
                    value={genClientName}
                    onChange={(e) => setGenClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-indigo-950 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-black block mb-1">فئة ومستوى الترخيص للبرنامج:</label>
                  <select
                    value={genPlan}
                    onChange={(e) => setGenPlan(e.target.value as SubscriptionPlan)}
                    className="w-full px-3 py-2 bg-black/40 border border-indigo-950 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="basic">الأساسي (Basic)</option>
                    <option value="professional">الاحترافي (Professional / Recommeded)</option>
                    <option value="enterprise">مستوى المؤسسات (Enterprise)</option>
                  </select>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="universal_checkbox"
                    checked={genIsUniversal}
                    onChange={(e) => setGenIsUniversal(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded"
                  />
                  <label htmlFor="universal_checkbox" className="text-[10px] font-black text-indigo-300 cursor-pointer">ترخيص عام ومفتوح لكافة أجهزة الكمبيوتر (بدون قيد عتاد)</label>
                </div>

                {!genIsUniversal && (
                  <div className="animate-scale-up">
                    <label className="text-[10px] text-slate-400 font-black block mb-1">أدخل معرف جهاز العميل الدقيق (Device ID):</label>
                    <input
                      type="text"
                      placeholder="انسخه من جهاز الزبون والقه هنا"
                      value={genDeviceId}
                      onChange={(e) => setGenDeviceId(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-indigo-950 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerateKey}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🔑 توليد مفتاح تفعيل الترخيص المشفر</span>
              </button>

              {/* Show Generated Certificate Card */}
              {generatedResultKey && (
                <div className="bg-black/55 border border-dashed border-indigo-500/40 p-4 rounded-xl space-y-3 animate-scale-up">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-900 text-indigo-200 rounded font-black">شهادة الترخيص التجاري</span>
                    <button
                      type="button"
                      onClick={handleCopyGeneratedText}
                      className="p-1 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 rounded flex items-center gap-1 text-[10px] transition font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKeyMsg ? 'نسخ بنجاح!' : 'نسخ البطاقة للواتساب'}</span>
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-300 font-medium leading-relaxed">
                    <p>🏪 المستفيد: <b className="text-white font-black">{genClientName || 'الزبون'}</b></p>
                    <p>⭐ حزمة المزايا: <b className="text-indigo-300 font-bold">{genPlan.toUpperCase()}</b></p>
                    <p>🖥️ حماية الأجهزة: <b className="text-amber-400 font-mono">{genIsUniversal ? 'مفتوح (أجهزة لا نهائية)' : genDeviceId}</b></p>
                    <p className="pt-1.5">مفتاح الترخيص المولد:</p>
                    <div className="bg-slate-900 border border-indigo-950 p-2 text-center rounded font-mono text-xs font-black tracking-widest text-emerald-400 select-all leading-none py-3">
                      {generatedResultKey}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Card and Activation key panel */}
        <div className="lg:col-span-6 bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800  shadow-sm rounded-3xl p-6 space-y-6" dir="rtl">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.subscriptionStatus}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2.5 h-2.5 rounded-full ${subscription.plan === 'trial' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {subscription.plan === 'trial' ? t.trialActive : `مرخص بنجاح - فئة ${subscription.plan.toUpperCase()}`}
              </p>
            </div>
          </div>

          {subscription.plan === 'trial' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 flex items-center gap-3 animate-scale-up">
              <Timer className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0 animate-spin-slow" />
              <div>
                <p className="text-xs font-bold text-amber-950 dark:text-amber-300">{t.trialDaysRemaining}</p>
                <p className="text-xl font-black text-amber-800 dark:text-amber-400 font-mono mt-0.5">{remainingDays} يوم متبقي</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/40 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-slate-500 flex-shrink-0" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">{t.yourDeviceId}</span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{subscription.deviceId}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(subscription.deviceId);
                alert('تم نسخ معرف جهازك بنجاح! ارسله لموزع خدمات النظام المصرح له لإصدار كود تفعيل مخصص لك.');
              }}
              className="px-2.5 py-1.5 bg-slate-200/40 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] rounded-lg transition-all flex items-center gap-1 font-bold cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>نسخ المعرف</span>
            </button>
          </div>

          {/* Activation Key Form */}
          <form onSubmit={handleActivate} className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.enterLicenseKey}</h3>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                placeholder="PRO-XXXXX-XXXXX"
                className="flex-grow px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
              />
              <button
                type="submit"
                className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t.activateBtn}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-1 text-xs text-emerald-800 font-bold leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Default Trial Key indicator */}
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/30 text-right">
              <p className="text-[10px] text-indigo-950 dark:text-indigo-300 font-black leading-relaxed">{t.demoLicensePrompt}</p>
            </div>
          </form>

          {/* Sold custom support redirect options */}
          {vendorSupportWhatsApp && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl flex items-center justify-between text-right animate-scale-up" dir="rtl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-sm">💬</div>
                <div>
                  <h4 className="text-[11px] font-black text-emerald-950 dark:text-emerald-300">تسوق الدعم الفني وتجديد المفاتيح</h4>
                  <p className="text-[9px] text-emerald-700 dark:text-emerald-400">تواصل بالواتساب مع ممثل المبيعات لطلب المفاتيح</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${vendorSupportWhatsApp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="referrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-all flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>طلب تفعيل الآن</span>
              </a>
            </div>
          )}
        </div>

        {/* Plan tiers comparisons Column */}
        <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm rounded-3xl p-5 space-y-4" dir="rtl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>فئات الترخيص ومزايا الخصائص</span>
          </h2>

          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
            {planTiers.map((tier) => {
              const matchesCurrent = state.subscription.plan === tier.level;
              return (
                <div
                  key={tier.level}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    matchesCurrent
                      ? 'bg-indigo-900 text-white border-indigo-950 dark:bg-indigo-950 dark:border-indigo-900'
                      : tier.popular
                      ? 'bg-white border-indigo-200 shadow-xs dark:bg-slate-850 dark:border-slate-750'
                      : 'bg-white border-slate-100 dark:bg-slate-850 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-xs md:text-sm">{tier.name}</h3>
                      <p className={`text-[10px] font-semibold mt-0.5 ${matchesCurrent ? 'text-indigo-200' : 'text-slate-400'}`}>
                        مزايا الفئة الفعالة والمقاييس المتميزة
                      </p>
                    </div>
                    <div>
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                        matchesCurrent ? 'bg-indigo-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}>
                        {tier.price}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-[10px]">
                    {tier.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${matchesCurrent ? 'text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`} />
                        <span className={matchesCurrent ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
