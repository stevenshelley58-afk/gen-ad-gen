import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';

export default function BrandInput({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateUrl = (value) => {
    try {
      const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/;
      return urlPattern.test(value);
    } catch {
      return false;
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    setIsValid(validateUrl(value));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isValid) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isValid) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      onSubmit(formattedUrl);
    }
  };

  const examples = ['stripe.com', 'shopify.com', 'notion.so'];

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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Input
            type="text"
            placeholder="https://stripe.com"
            value={url}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            className="h-14 text-lg px-6"
            autoFocus
          />
          
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-sm text-muted-foreground">Try:</span>
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => {
                  setUrl(example);
                  setIsValid(true);
                }}
                className="text-sm text-primary hover:underline"
              >
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
