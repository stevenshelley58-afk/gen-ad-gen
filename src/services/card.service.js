/**
 * UI Card generation service
 */
class CardService {
  /**
   * Generate brand card
   * @param {Object} brand - Brand data
   * @returns {Object} - Brand card
   */
  generateBrandCard(brand) {
    return {
      type: 'brand',
      title: brand.name,
      tagline: brand.tagline,
      domain: brand.domain,
      category: brand.category,
      confidence: brand.confidence_0_1,
      sections: [
        {
          title: 'Value Propositions',
          items: brand.value_propositions || []
        },
        {
          title: 'Target Audience',
          content: brand.target_audience
        },
        {
          title: 'Positioning',
          content: brand.positioning
        },
        {
          title: 'Key Features',
          items: brand.key_features || []
        }
      ]
    };
  }

  /**
   * Generate competitor card
   * @param {Object} competitor - Competitor data
   * @param {number} rank - Rank position
   * @returns {Object} - Competitor card
   */
  generateCompetitorCard(competitor, rank = null) {
    return {
      type: 'competitor',
      rank,
      title: competitor.name,
      domain: competitor.domain,
      tagline: competitor.tagline,
      confidence: competitor.confidence_0_1,
      sections: [
        {
          title: 'Value Propositions',
          items: competitor.value_propositions || []
        },
        {
          title: 'Strengths',
          items: competitor.strengths || []
        },
        {
          title: 'Differentiation',
          content: competitor.differentiation
        }
      ]
    };
  }

  /**
   * Generate kernel card with all data
   * @param {Object} kernel - Kernel data
   * @param {Object} brand - Brand data
   * @param {Array} competitors - Competitors data
   * @returns {Object} - Kernel card
   */
  generateKernelCard(kernel, brand, competitors) {
    return {
      type: 'kernel',
      title: `${brand.name} - Competitive Intelligence`,
      brand: this.generateBrandCard(brand),
      competitors: competitors.map((c, i) => this.generateCompetitorCard(c, i + 1)),
      insights: {
        keyword_map: kernel.keyword_map,
        gap_map: kernel.gap_map,
        strengths: kernel.insights?.strengths || [],
        opportunities: kernel.insights?.opportunities || [],
        risks: kernel.insights?.risks || []
      },
      recommendations: kernel.recommendations || []
    };
  }
}

module.exports = new CardService();
