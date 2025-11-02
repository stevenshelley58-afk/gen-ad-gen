import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { cn, formatDuration, formatTimestamp, generateBrandCard } from '../lib/utils';

const listFromMultiline = (value = '') =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const arrayToMultiline = (value) =>
  Array.isArray(value) ? value.join('\n') : value || '';

const buildFormState = (brand = {}) => ({
  name: brand.name || '',
  domain: brand.domain || '',
  tagline: brand.tagline || '',
  category: brand.category || '',
  summary: brand.summary || '',
  value_propositions: arrayToMultiline(brand.value_propositions),
  target_audience: brand.target_audience || '',
  positioning: brand.positioning || '',
  key_features: arrayToMultiline(brand.key_features),
  evidence_refs: arrayToMultiline(brand.evidence_refs),
  additional_info: brand.additional_context || brand.additional_info || '',
});

const buildBrandUpdate = (formData, baseBrand = {}) => {
  const clean = (value) => value.trim();
  const withArray = (value) =>
    value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

  const updated = {
    ...baseBrand,
    name: clean(formData.name),
    domain: clean(formData.domain),
    tagline: clean(formData.tagline),
    category: clean(formData.category),
    summary: clean(formData.summary),
    target_audience: clean(formData.target_audience),
    positioning: clean(formData.positioning),
    value_propositions: withArray(formData.value_propositions),
    key_features: withArray(formData.key_features),
    evidence_refs: withArray(formData.evidence_refs),
  };

  const additionalContext = clean(formData.additional_info);
  if (additionalContext) {
    updated.additional_context = additionalContext;
  } else {
    delete updated.additional_context;
  }

  return updated;
};

const getConfidenceStatus = (value) => {
  if (value >= 0.8) return { label: 'High confidence', color: 'bg-emerald-500' };
  if (value >= 0.6) return { label: 'Moderate confidence', color: 'bg-amber-500' };
  if (value > 0) return { label: 'Low confidence', color: 'bg-destructive' };
  return null;
};

export default function BrandSummary({ brandData, onApprove, onEdit }) {
  const brand = brandData?.brand || {};
  const meta = brandData?.meta || {};
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() => buildFormState(brand));
  const [savedSnapshot, setSavedSnapshot] = useState(() => buildFormState(brand));

  useEffect(() => {
    const nextState = buildFormState(brand);
    setFormData(nextState);
    setSavedSnapshot(nextState);
    setIsEditing(false);
  }, [brand]);

  const confidence = typeof brand.confidence_0_1 === 'number' ? brand.confidence_0_1 : null;
  const confidencePercent = confidence !== null ? Math.round(confidence * 100) : null;
  const confidenceStatus = confidence !== null ? getConfidenceStatus(confidence) : null;
  const runDetails = useMemo(
    () => [
      { label: 'Run ID', value: brandData?.run_id },
      { label: 'Completed', value: formatTimestamp(meta.timestamp) },
      { label: 'Pages Scraped', value: meta.pages_scraped },
      { label: 'Duration', value: formatDuration(meta.duration_ms) },
    ].filter((item) => item.value !== undefined && item.value !== null && item.value !== ''),
    [brandData?.run_id, meta.duration_ms, meta.pages_scraped, meta.timestamp]
  );

  const brandCardSections = brandData?.brand_card?.sections || [];

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(savedSnapshot);
    setIsEditing(false);
  };

  const handleSave = () => {
    const updatedBrand = buildBrandUpdate(formData, brand);
    const normalizedForm = buildFormState(updatedBrand);
    setFormData(normalizedForm);
    setSavedSnapshot(normalizedForm);
    setIsEditing(false);

    if (onEdit) {
      onEdit(updatedBrand, generateBrandCard(updatedBrand));
    }
  };

  const handleApprove = () => {
    const finalBrand = buildBrandUpdate(formData, brand);
    if (onApprove) {
      onApprove(finalBrand, generateBrandCard(finalBrand));
    }
  };

  const renderList = (value) => {
    const items = listFromMultiline(value);
    if (!items.length) {
      return <p className="text-sm text-muted-foreground">No items provided yet.</p>;
    }

    return (
      <ul className="list-disc list-inside space-y-1 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  };

  const renderEvidence = () => {
    const links = listFromMultiline(formData.evidence_refs);
    if (!links.length) {
      return <p className="text-sm text-muted-foreground">Evidence links will appear here once available.</p>;
    }

    return (
      <ul className="space-y-2 text-sm">
        {links.map((href) => (
          <li key={href}>
            <a
              href={href.startsWith('http') ? href : `https://${href}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline break-words"
            >
              {href}
            </a>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-5xl mx-auto px-6 pb-20"
    >
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h2 className="text-3xl font-bold">Brand Summary</h2>
          {brand.domain && (
            <p className="text-muted-foreground">
              Insights generated from{' '}
              <a
                href={brand.domain.startsWith('http') ? brand.domain : `https://${brand.domain}`}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted"
              >
                {brand.domain.replace(/^https?:\/\//, '')}
              </a>
            </p>
          )}
        </motion.div>

        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Brand Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  ) : (
                    <p className="text-lg font-semibold">{formData.name || '—'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  {isEditing ? (
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => handleChange('domain', e.target.value)}
                      placeholder="stripe.com"
                    />
                  ) : formData.domain ? (
                    <a
                      href={formData.domain.startsWith('http') ? formData.domain : `https://${formData.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary underline decoration-dotted break-all"
                    >
                      {formData.domain}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Domain unknown</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                {isEditing ? (
                  <Textarea
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    rows={2}
                  />
                ) : (
                  <p className="text-muted-foreground">{formData.tagline || 'No tagline detected yet.'}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  {isEditing ? (
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                    />
                  ) : (
                    <p>{formData.category || '—'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  {isEditing ? (
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) => handleChange('summary', e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {formData.summary || 'Summary will appear here after analysis completes.'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Run Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {confidenceStatus && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Confidence</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full transition-all', confidenceStatus.color)}
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{confidencePercent}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{confidenceStatus.label}</p>
                </div>
              )}

              <div className="space-y-3">
                {runDetails.map((detail) => (
                  <div key={detail.label}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{detail.label}</p>
                    <p className="text-sm font-medium break-all">{detail.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Messaging & Positioning</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="value_propositions">Value Propositions (one per line)</Label>
              {isEditing ? (
                <Textarea
                  id="value_propositions"
                  value={formData.value_propositions}
                  onChange={(e) => handleChange('value_propositions', e.target.value)}
                  rows={6}
                  placeholder={'Unified API for payments\nGlobal coverage\nBuilt for developers'}
                />
              ) : (
                renderList(formData.value_propositions)
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="target_audience">Target Audience</Label>
              {isEditing ? (
                <Textarea
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => handleChange('target_audience', e.target.value)}
                  rows={6}
                  placeholder={'Developers building SaaS\nEnterprise finance teams\nGlobal marketplaces'}
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {formData.target_audience || 'The target audience will be summarised here.'}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="positioning">Positioning</Label>
              {isEditing ? (
                <Textarea
                  id="positioning"
                  value={formData.positioning}
                  onChange={(e) => handleChange('positioning', e.target.value)}
                  rows={5}
                  placeholder="How does this brand position itself in the market?"
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {formData.positioning || 'Positioning insights will appear here.'}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="key_features">Key Features (one per line)</Label>
              {isEditing ? (
                <Textarea
                  id="key_features"
                  value={formData.key_features}
                  onChange={(e) => handleChange('key_features', e.target.value)}
                  rows={5}
                  placeholder={'Payments\nBilling\nRevenue recognition'}
                />
              ) : (
                renderList(formData.key_features)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence & AI Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="evidence_refs">Evidence URLs (one per line)</Label>
              {isEditing ? (
                <Textarea
                  id="evidence_refs"
                  value={formData.evidence_refs}
                  onChange={(e) => handleChange('evidence_refs', e.target.value)}
                  rows={6}
                  placeholder={'https://stripe.com/payments\nhttps://stripe.com/pricing'}
                />
              ) : (
                renderEvidence()
              )}
            </div>

            <div className="space-y-4">
              {brandCardSections.length ? (
                brandCardSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </p>
                    {Array.isArray(section.items) && section.items.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : section.content ? (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No insight captured yet.</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  AI generated highlights will appear here after the first analysis run.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="additional_info">Add extra context to improve ad generation</Label>
            {isEditing ? (
              <Textarea
                id="additional_info"
                value={formData.additional_info}
                onChange={(e) => handleChange('additional_info', e.target.value)}
                rows={5}
                placeholder="Seasonal campaigns, flagship products, audience nuances..."
              />
            ) : formData.additional_info ? (
              <p className="text-sm leading-relaxed whitespace-pre-line">{formData.additional_info}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Add notes by switching to edit mode.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center flex-wrap gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="min-w-[140px]">
                Cancel
              </Button>
              <Button onClick={handleSave} className="min-w-[140px]">
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleEdit} className="min-w-[140px]">
                Edit
              </Button>
              <Button onClick={handleApprove} className="min-w-[140px]">
                Approve
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
