import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/common/Container';
import { Seo } from '../../components/seo/Seo';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[65vh] py-16 flex flex-col items-center justify-center text-center">
      <Seo
        title="পৃষ্ঠাটি খুঁজে পাওয়া যায়নি (৪০৪) | Gangchill (গাংচিল)"
        description="আপনি যে পাতাটি খুঁজছেন তা স্থানান্তরিত হয়েছে অথবা খুঁজে পাওয়া যায়নি।"
        path="/404"
        noindex
      />
      <Container size="sm">
        <div className="w-16 h-16 rounded-full bg-gangchill-surface border border-gangchill-border flex items-center justify-center mx-auto mb-4 text-gangchill-blue shadow-xs">
          <span className="text-2xl font-bold">৪০৪</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gangchill-ink mb-2 font-serifBangla">
          পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
        </h1>
        <p className="text-sm text-gangchill-ink-muted max-w-sm mx-auto mb-6 font-light">
          আপনি যে পাতাটি খুঁজছেন তা স্থানান্তরিত হয়েছে অথবা লিংকটি সঠিক নয়।
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gangchill-blue text-white font-bold text-sm hover:bg-gangchill-navy active:scale-95 transition-all shadow-xs"
        >
          <Home className="w-4 h-4" />
          <span>হোমে ফিরে যান</span>
        </Link>
      </Container>
    </div>
  );
};
