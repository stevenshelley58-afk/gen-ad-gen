import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';

const thinkingSteps = [
  "Reading website content...",
  "Analyzing homepage structure...",
  "Scanning product pages for messaging...",
  "Understanding value proposition...",
  "Extracting brand voice and tone...",
  "Identifying target audience...",
  "Analyzing key messaging themes...",
  "Compiling brand summary...",
];

export default function Processing({ brandUrl }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedSteps, setDisplayedSteps] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next < thinkingSteps.length) {
          setDisplayedSteps((steps) => [...steps, thinkingSteps[next]]);
          return next;
        }
        return prev;
      });
    }, 3000);

    setDisplayedSteps([thinkingSteps[0]]);

    return () => clearInterval(interval);
  }, []);

  const domain = brandUrl.replace(/^https?:\/\//, '').split('/')[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-2xl mx-auto px-6"
    >
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-2">Analyzing</p>
          <h2 className="text-2xl font-semibold">{domain}</h2>
        </motion.div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {displayedSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start space-x-2"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {index === currentStep ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-primary/20" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 pt-6 border-t text-center"
            >
              <p className="text-xs text-muted-foreground">
                This usually takes 30-60 seconds
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
