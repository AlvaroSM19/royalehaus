"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/useLanguage';

const COOKIE_TRANSLATIONS: Record<string, { message: string; privacy: string; forMoreInfo: string; gotIt: string }> = {
  en: {
    message: "We use an essential session cookie to keep your account active. We don't use tracking or analytics cookies. By continuing to browse, you accept the use of this strictly necessary cookie. See",
    privacy: "Privacy",
    forMoreInfo: "for more info.",
    gotIt: "Got it",
  },
  es: {
    message: "Utilizamos una cookie de sesión esencial para mantener su cuenta activa. No utilizamos cookies de seguimiento o análisis. Al continuar navegando aceptas el uso de esta cookie estrictamente necesaria. Ver",
    privacy: "Privacidad",
    forMoreInfo: "para más información.",
    gotIt: "Entiendo",
  },
  fr: {
    message: "Nous utilisons un cookie de session essentiel pour garder votre compte actif. Nous n'utilisons pas de cookies de suivi ou d'analyse. En poursuivant votre navigation, vous acceptez l'utilisation de ce cookie strictement nécessaire. Voir",
    privacy: "Confidentialité",
    forMoreInfo: "pour plus d'informations.",
    gotIt: "J'ai compris",
  },
  de: {
    message: "Wir verwenden ein wesentliches Sitzungscookie, um Ihr Konto aktiv zu halten. Wir verwenden keine Tracking- oder Analyse-Cookies. Indem Sie weitersurfen, akzeptieren Sie die Verwendung dieses unbedingt notwendigen Cookies. Sehen",
    privacy: "Privatsphäre",
    forMoreInfo: "für weitere Informationen.",
    gotIt: "Habe es",
  },
  it: {
    message: "Utilizziamo un cookie di sessione essenziale per mantenere il tuo account attivo. Non utilizziamo cookie di tracciamento o analitici. Continuando a navigare accetti l'uso di questo cookie strettamente necessario. Visualizza",
    privacy: "Privacy",
    forMoreInfo: "per maggiori informazioni.",
    gotIt: "Fatto",
  },
  pt: {
    message: "Usamos um cookie de sessão essencial para manter sua conta ativa. Não usamos cookies de rastreamento ou análise. Ao continuar navegando, você aceita o uso deste cookie estritamente necessário. Ver",
    privacy: "Privacidade",
    forMoreInfo: "para mais informações.",
    gotIt: "Entendi",
  },
  ja: {
    message: "お客様のアカウントをアクティブに保つために必須のセッション Cookie を使用します。当社は追跡 Cookie や分析 Cookie を使用しません。閲覧を続けると、この絶対に必要な Cookie の使用に同意したことになります。",
    privacy: "プライバシー",
    forMoreInfo: "詳細については。",
    gotIt: "わかった",
  },
  ko: {
    message: "계정을 활성 상태로 유지하기 위해 필수 세션 쿠키를 사용합니다. 추적이나 분석 쿠키는 사용하지 않습니다. 탐색을 계속하면 이 필수 쿠키의 사용에 동의하는 것입니다.",
    privacy: "개인정보",
    forMoreInfo: "자세한 내용은.",
    gotIt: "확인",
  },
  ru: {
    message: "Мы используем необходимый сеансовый файл cookie, чтобы поддерживать активность вашей учетной записи. Мы не используем файлы cookie для отслеживания или аналитики. Продолжая просматривать, вы соглашаетесь на использование этого строго необходимого файла cookie. Видеть",
    privacy: "Конфиденциальность",
    forMoreInfo: "для получения дополнительной информации.",
    gotIt: "Понятно",
  },
  tr: {
    message: "Hesabınızı aktif tutmak için temel bir oturum çerezi kullanıyoruz. İzleme veya analiz çerezleri kullanmıyoruz. Gezinmeye devam ederek bu kesinlikle gerekli çerezin kullanımını kabul etmiş olursunuz.",
    privacy: "Gizlilik",
    forMoreInfo: "daha fazla bilgi için.",
    gotIt: "Anladım",
  },
  zh: {
    message: "我们使用重要的会话 cookie 来保持您的帐户处于活动状态。我们不使用跟踪或分析 cookie。继续浏览即表示您接受使用此绝对必要的 cookie。",
    privacy: "隐私",
    forMoreInfo: "了解更多信息。",
    gotIt: "知道了",
  },
};

export default function CookieNotice() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    try {
      if (!localStorage.getItem('rh_cookie_notice_v1')) setOpen(true);
    } catch {}
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem('rh_cookie_notice_v1', '1');
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  const t = COOKIE_TRANSLATIONS[language] || COOKIE_TRANSLATIONS.en;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-3xl">
      <div className="relative overflow-hidden rounded-2xl border border-amber-600/40 bg-gradient-to-br from-[#141414]/90 via-[#1d1d1f]/90 to-[#101418]/90 backdrop-blur-md shadow-lg shadow-black/40 px-5 py-4 flex flex-col gap-3 ring-1 ring-amber-500/10">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 text-amber-300/90">🍪</div>
          <div className="text-[13px] leading-relaxed text-amber-200/85 font-medium">
            {t.message}{' '}
            <a href="/privacy" className="underline decoration-amber-400/60 hover:text-amber-100">
              {t.privacy}
            </a>{' '}
            {t.forMoreInfo}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={dismiss}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-black shadow shadow-black/50 hover:brightness-110"
          >
            {t.gotIt}
          </button>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(circle_at_20%_15%,rgba(255,200,100,0.25),transparent_60%)]" />
      </div>
    </div>
  );
}
