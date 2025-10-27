import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import BrandInput from './components/BrandInput';
import Processing from './components/Processing';
import BrandSummary from './components/BrandSummary';
import ComingSoon from './components/ComingSoon';
import { analyzeBrand } from './lib/api';

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

    try {
      const data = await analyzeBrand(url);
      setBrandData(data);
      setCurrentState(STATES.SUMMARY);
    } catch (err) {
      console.error('Error analyzing brand:', err);
      setError(err.response?.data?.message || 'Failed to analyze brand. Please try again.');
      setCurrentState(STATES.INPUT);
    }
  };

  const handleEdit = (editedData) => {
    setBrandData(prev => ({
      ...prev,
      brand: {
        ...prev.brand,
        ...editedData
      }
    }));
  };

  const handleApprove = (finalData) => {
    console.log('Approved brand data:', finalData);
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
          <ComingSoon key="approved" onNewAnalysis={handleNewAnalysis} />
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
