import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

export default function BrandSummary({ brandData, onApprove, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: brandData.brand?.name || '',
    tagline: brandData.brand?.tagline || '',
    industry: brandData.brand?.industry || '',
    founded_year: brandData.brand?.founded_year || '',
    headquarters_location: brandData.brand?.headquarters_location || '',
    products_services: Array.isArray(brandData.brand?.products_services) 
      ? brandData.brand.products_services.join('\n') 
      : '',
    target_audience: Array.isArray(brandData.brand?.target_audience)
      ? brandData.brand.target_audience.join('\n')
      : '',
    brand_voice_tone: Array.isArray(brandData.brand?.brand_voice_tone)
      ? brandData.brand.brand_voice_tone.join(', ')
      : '',
    key_messaging_themes: Array.isArray(brandData.brand?.key_messaging_themes)
      ? brandData.brand.key_messaging_themes.join('\n')
      : '',
    additional_info: ''
  });

  const [originalData] = useState(formData);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(formData);
    }
  };

  const handleApprove = () => {
    const finalData = {
      ...formData,
      products_services: formData.products_services.split('\n').filter(Boolean),
      target_audience: formData.target_audience.split('\n').filter(Boolean),
      brand_voice_tone: formData.brand_voice_tone.split(',').map(s => s.trim()).filter(Boolean),
      key_messaging_themes: formData.key_messaging_themes.split('\n').filter(Boolean),
    };
    onApprove(finalData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-4xl mx-auto px-6 pb-20"
    >
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold">Brand Summary{isEditing && ' (Editing)'}</h2>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              ) : (
                <p className="text-lg font-semibold">{formData.name}</p>
              )}
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
                <p className="text-muted-foreground">{formData.tagline}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                {isEditing ? (
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                  />
                ) : (
                  <p>{formData.industry}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="founded_year">Founded</Label>
                {isEditing ? (
                  <Input
                    id="founded_year"
                    value={formData.founded_year}
                    onChange={(e) => handleChange('founded_year', e.target.value)}
                  />
                ) : (
                  <p>{formData.founded_year}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="headquarters_location">Headquarters</Label>
                {isEditing ? (
                  <Input
                    id="headquarters_location"
                    value={formData.headquarters_location}
                    onChange={(e) => handleChange('headquarters_location', e.target.value)}
                  />
                ) : (
                  <p>{formData.headquarters_location}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="products_services">Products & Services (one per line)</Label>
              {isEditing ? (
                <Textarea
                  id="products_services"
                  value={formData.products_services}
                  onChange={(e) => handleChange('products_services', e.target.value)}
                  rows={4}
                  placeholder="Payment processing&#10;Billing&#10;Financial APIs"
                />
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {formData.products_services.split('\n').filter(Boolean).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience (one per line)</Label>
              {isEditing ? (
                <Textarea
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => handleChange('target_audience', e.target.value)}
                  rows={3}
                  placeholder="Developers&#10;SaaS companies&#10;E-commerce platforms"
                />
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {formData.target_audience.split('\n').filter(Boolean).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_voice_tone">Brand Voice & Tone (comma-separated)</Label>
              {isEditing ? (
                <Input
                  id="brand_voice_tone"
                  value={formData.brand_voice_tone}
                  onChange={(e) => handleChange('brand_voice_tone', e.target.value)}
                  placeholder="Professional, Technical, Developer-focused"
                />
              ) : (
                <p>{formData.brand_voice_tone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="key_messaging_themes">Key Messaging Themes (one per line)</Label>
              {isEditing ? (
                <Textarea
                  id="key_messaging_themes"
                  value={formData.key_messaging_themes}
                  onChange={(e) => handleChange('key_messaging_themes', e.target.value)}
                  rows={3}
                  placeholder="Build fast&#10;Scale without limits&#10;Developer-first approach"
                />
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {formData.key_messaging_themes.split('\n').filter(Boolean).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="additional_info">
                Add any extra context or details to improve ad generation
              </Label>
              <Textarea
                id="additional_info"
                value={formData.additional_info}
                onChange={(e) => handleChange('additional_info', e.target.value)}
                rows={6}
                placeholder="Enter any additional context about the brand, special campaigns, seasonal focuses, or other details that would help generate better ads..."
                disabled={!isEditing && formData.additional_info === ''}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="min-w-[140px]">
                Cancel
              </Button>
              <Button onClick={handleSave} className="min-w-[140px]">
                Save
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
