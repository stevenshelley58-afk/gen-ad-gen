import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export default function ComingSoon({ onNewAnalysis, brand }) {
  const brandName = brand?.name;
  const brandDomain = brand?.domain;

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
          className="text-center space-y-1"
        >
          <h2 className="text-3xl font-bold">Brand Approved</h2>
          {brandName && (
            <p className="text-muted-foreground">
              {brandName}
              {brandDomain ? ` · ${brandDomain}` : ''}
            </p>
          )}
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Audience Segments</CardTitle>
          </CardHeader>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">🚧</div>
              <p className="text-xl font-medium">Coming Soon</p>
              <p className="text-muted-foreground">
                Audience segment analysis and ad generation will be available in the next release.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={onNewAnalysis} size="lg" className="min-w-[200px]">
            Analyze Another Brand
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
