import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../common/Container';
import { GangchillSignature } from '../common/GangchillSignature';
import { COMPANY_CONTACT } from '../../config/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#0B192C] text-slate-200 border-t border-slate-800/80 pt-16 pb-28 md:pb-12 overflow-hidden">
      {/* Ambient background glass glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <Container className="relative z-10">
        {/* Subtle Signature Flow Line */}
        <div className="text-center text-xs font-serifBangla text-sky-400/90 tracking-wide mb-10">
          বাংলাদেশের নদী → ঘাট ও ঘের → খাঁটি মাছ → কোল্ডচেইন → বাজার ও বাণিজ্য
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Column 1: Brand & Soul */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-block group -mb-4">
              <img
                src="/gangchill-logo-footer.png"
                alt="Gangchill"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-300/80 leading-relaxed max-w-sm font-light">
              জেলে ও খামারিদের খাঁটি মাছ আর করপোরেট বাজারের চাহিদার মধ্যে সরাসরি নির্ভরযোগ্য সংযোগ। দেশি মাছ, চিংড়ি, ইলিশ ও শুঁটকির বিশ্বস্ত ডিজিটাল বাণিজ্য।
            </p>
          </div>

          {/* Column 2: 3 Journeys */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              প্ল্যাটফর্মের সেবাসমূহ
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/buy" className="text-slate-300 hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span>কিনুন</span>
                  <span className="text-xs text-slate-400 font-light">— পাইকারি মাছের স্টক</span>
                </Link>
              </li>
              <li>
                <Link to="/sell" className="text-slate-300 hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span>বিক্রি করুন</span>
                  <span className="text-xs text-slate-400 font-light">— মাছের তথ্য জানান</span>
                </Link>
              </li>
              <li>
                <Link to="/invest" className="text-slate-300 hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span>বিনিয়োগ করুন</span>
                  <span className="text-xs text-slate-400 font-light">— মাছ সংগ্রহ তহবিল</span>
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-slate-300 hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span>ব্লগ</span>
                  <span className="text-xs text-slate-400 font-light">— গল্প ও অন্তর্দৃষ্টি</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span>যোগাযোগ</span>
                  <span className="text-xs text-slate-400 font-light">— হেড অফিস ও সহায়তা</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Fish Hubs */}
          <div className="md:col-span-4 space-y-3 text-sm">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              সোর্সিং হাব ও যোগাযোগ
            </h4>
            <p className="text-xs text-slate-300/80 leading-relaxed font-light">
              হেড অফিস: {COMPANY_CONTACT.headOffice}<br />
              ঘাট ও ঘের হাব: {COMPANY_CONTACT.hubLocations}
            </p>
            <div className="text-xs text-slate-300 pt-1">
              ফোন: <span className="text-sky-300">{COMPANY_CONTACT.hotlineDisplay}</span> · ইমেইল: <span className="text-sky-300">{COMPANY_CONTACT.email}</span>
            </div>
          </div>
        </div>

        {/* Bottom sign-off */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <GangchillSignature variant="mark" size="sm" className="text-sky-400" />
            <span>Gangchill (গাংচিল) · বাংলাদেশের মাছের বাণিজ্যে নতুন সংযোগ</span>
          </div>
          <div className="text-slate-400 font-light">
            খাঁটি উৎস, কোল্ডচেইন মান ও আস্থার প্রতীক
          </div>
        </div>
      </Container>
    </footer>
  );
};
