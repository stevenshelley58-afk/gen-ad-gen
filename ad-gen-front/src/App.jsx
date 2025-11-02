import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import BrandInput from './components/BrandInput';
import Processing from './components/Processing';
import BrandSummary from './components/BrandSummary';
import ComingSoon from './components/ComingSoon';
import { analyzeBrand } from './lib/api';
import { generateBrandCard } from './lib/utils';

const STATES = {
  INPUT: 'input',
  PROCESSING: 'processing',
  SUMMARY: 'summary',
  APPROVED: 'approved',
};

function App() {
  const [currentState, setCurrentState] = useState(STATES.INPUT);
  const [brandUrl, setBrandUrl] = useState('');
  const [brandData, setBrandData] = useState(null);
  const [error, setError] = useState(null);

  const handleBrandSubmit = async (url) => {
    setBrandUrl(url);
    setCurrentState(STATES.PROCESSING);
    setError(null);
    setBrandData(null);

    try {
      const data = await analyzeBrand(url);
      const nextData = {
        ...data,
        brand_card: data.brand_card || generateBrandCard(data.brand),
      };
      setBrandData(nextData);
      setCurrentState(STATES.SUMMARY);
    } catch (err) {
      console.error('Error analyzing brand:', err);
      const fallbackMessage = err.response?.data?.message || err.message || 'Failed to analyze brand. Please try again.';
      setError(fallbackMessage);
      setCurrentState(STATES.INPUT);
    }
  };

  const handleEdit = (editedBrand, updatedCard) => {
    setBrandData((prev) => {
      if (!prev) return prev;
      const mergedBrand = { ...prev.brand, ...editedBrand };
      return {
        ...prev,
        brand: mergedBrand,
        brand_card: updatedCard || generateBrandCard(mergedBrand),
      };
    });
  };

  const handleApprove = (finalBrand, finalCard) => {
    const card = finalCard || generateBrandCard(finalBrand);
    console.log('Approved brand data:', finalBrand);
    setBrandData((prev) => (prev ? { ...prev, brand: finalBrand, brand_card: card } : prev));
    setCurrentState(STATES.APPROVED);
  };

  const handleNewAnalysis = () => {
    setBrandUrl('');
    setBrandData(null);
    setError(null);
    setCurrentState(STATES.INPUT);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <AnimatePresence mode="wait">
        {currentState === STATES.INPUT && (
          <BrandInput key="input" onSubmit={handleBrandSubmit} />
        )}

        {currentState === STATES.PROCESSING && (
          <Processing key="processing" brandUrl={brandUrl} />
        )}

        {currentState === STATES.SUMMARY && brandData && (
          <BrandSummary
            key="summary"
            brandData={brandData}
            onEdit={handleEdit}
            onApprove={handleApprove}
          />
        )}

        {currentState === STATES.APPROVED && (
          <ComingSoon
            key="approved"
            brand={brandData?.brand}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-6 py-3 rounded-lg shadow-lg max-w-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
