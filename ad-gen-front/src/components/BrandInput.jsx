import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';

const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/i;

const formatUrl = (value) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
};

const examples = ['stripe.com', 'shopify.com', 'notion.so'];

export default function BrandInput({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    setIsValid(urlPattern.test(value.trim()));
  };

  const handleExampleClick = (example) => {
    setUrl(example);
    setIsValid(true);
  };

  const handleSubmit = (event) => {
    event?.preventDefault();
    const formattedUrl = formatUrl(url);

    if (isValid && formattedUrl) {
      onSubmit(formattedUrl);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto px-6"
    >
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            Ad Generator
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground"
          >
            Turn any website into high-performing ads
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              type="text"
              placeholder="https://stripe.com"
              value={url}
              onChange={handleChange}
              className="h-14 text-lg px-6"
              autoFocus
            />
            <Button
              type="submit"
              className="h-14 px-8 text-base font-semibold"
              disabled={!isValid}
            >
              Analyze brand
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-sm text-muted-foreground">Try:</span>
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="text-sm text-primary hover:underline"
              >
                {example}
              </button>
            ))}
          </div>

          {!isValid && url && (
            <p className="text-center text-sm text-destructive">
              Enter a valid URL to continue.
            </p>
          )}
        </motion.form>
      </div>
    </motion.div>
  );
}
