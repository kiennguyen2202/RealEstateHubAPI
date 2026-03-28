/**
 * Utility để parse XML krpano và convert sang format của CustomImageTourViewer
 */

/**
 * Parse XML string từ krpano
 * @param {string} xmlString - XML content từ krpano
 * @param {string} baseUrl - Base URL cho images (default: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}`)
 * @returns {Array} Array of scenes với format: [{ id, imageUrl, title, hotspots }]
 */
export const parseKrpanoXml = (xmlString, baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}`) => {
  if (!xmlString || typeof xmlString !== 'string') {
    console.warn('Invalid XML string');
    return [];
  }

  try {
    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parse errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML Parse Error:', parserError.textContent);
      return [];
    }

    const krpano = xmlDoc.querySelector('krpano');
    if (!krpano) {
      console.warn('No krpano element found');
      return [];
    }

    // Extract all scenes
    const sceneElements = xmlDoc.querySelectorAll('scene');
    const scenes = [];

    sceneElements.forEach((sceneEl, index) => {
      const sceneName = sceneEl.getAttribute('name') || `scene_${index}`;
      const sceneTitle = sceneEl.getAttribute('title') || sceneName;
      
      // Get image URL - check for cube or panorama
      let imageUrl = null;
      
      // Check for cube format (multires)
      const cubeEl = sceneEl.querySelector('cube');
      if (cubeEl) {
        // Cube format: panos/xxx.tiles/%s/l%l/%v/l%l_%s_%v_%h.jpg
        // Try to find preview or use first level
        const previewEl = sceneEl.querySelector('preview');
        if (previewEl) {
          const previewUrl = previewEl.getAttribute('url');
          if (previewUrl) {
            // Convert preview to full panorama if possible
            // For now, use preview as fallback
            imageUrl = previewUrl.startsWith('http') ? previewUrl : `${baseUrl}/${previewUrl}`;
          }
        }
        
        // If no preview, try to construct URL from cube pattern
        if (!imageUrl && cubeEl.getAttribute('url')) {
          const cubeUrlPattern = cubeEl.getAttribute('url');
          // Try to find the equirectangular version or use first face
          // For simplicity, we'll use preview if available
        }
      }
      
      // Check for direct panorama image
      const imageEl = sceneEl.querySelector('image');
      if (imageEl && !imageUrl) {
        // Check for sphere/cylinder/flat
        const sphereEl = imageEl.querySelector('sphere');
        const flatEl = imageEl.querySelector('flat');
        
        if (sphereEl) {
          imageUrl = sphereEl.getAttribute('url') || sphereEl.textContent;
        } else if (flatEl) {
          imageUrl = flatEl.getAttribute('url') || flatEl.textContent;
        }
      }
      
      // Get view settings
      const viewEl = sceneEl.querySelector('view');
      const hlookat = viewEl ? parseFloat(viewEl.getAttribute('hlookat') || '0') : 0;
      const vlookat = viewEl ? parseFloat(viewEl.getAttribute('vlookat') || '0') : 0;
      const fov = viewEl ? parseFloat(viewEl.getAttribute('fov') || '120') : 120;
      
      // Extract hotspots from scene
      const hotspots = [];
      const hotspotElements = sceneEl.querySelectorAll('hotspot');
      
      hotspotElements.forEach(hotspotEl => {
        const hotspotType = hotspotEl.getAttribute('type');
        const targetSceneName = hotspotEl.getAttribute('linkedscene');
        const ath = parseFloat(hotspotEl.getAttribute('ath') || '0'); // Horizontal angle
        const atv = parseFloat(hotspotEl.getAttribute('atv') || '0'); // Vertical angle
        const title = hotspotEl.getAttribute('title') || hotspotEl.getAttribute('text') || '';
        
        if (targetSceneName) {
          hotspots.push({
            x: ath, // Horizontal angle in degrees
            y: atv, // Vertical angle in degrees
            targetSceneId: targetSceneName,
            title: title
          });
        }
      });
      
      // If no hotspots defined, auto-generate navigation hotspots between scenes
      // This will be done later when we have all scenes
      
      if (imageUrl) {
        // Convert relative URL to absolute
        if (!imageUrl.startsWith('http')) {
          imageUrl = `${baseUrl}/${imageUrl.replace(/^\/+/, '')}`;
        }
        
        scenes.push({
          id: sceneName,
          imageUrl: imageUrl,
          panoramaUrl: imageUrl, // Alias
          title: sceneTitle,
          hotspots: hotspots.length > 0 ? hotspots : [],
          // Store view settings for future use
          view: {
            hlookat,
            vlookat,
            fov
          }
        });
      } else {
        console.warn(`Scene ${sceneName} has no image URL`);
      }
    });
    
    // Auto-generate navigation hotspots if scenes have no hotspots
    if (scenes.length > 1) {
      scenes.forEach((scene, index) => {
        // Only add auto-hotspots if scene has no hotspots defined
        if (!scene.hotspots || scene.hotspots.length === 0) {
          scene.hotspots = [
            // Left hotspot (previous scene)
            index > 0 ? {
              x: -90, // Left side
              y: 0,
              targetSceneId: scenes[index - 1].id,
              title: '← Ảnh trước'
            } : null,
            // Right hotspot (next scene)
            index < scenes.length - 1 ? {
              x: 90, // Right side
              y: 0,
              targetSceneId: scenes[index + 1].id,
              title: 'Ảnh sau →'
            } : null
          ].filter(Boolean);
        }
      });
    }
    
    return scenes;
  } catch (error) {
    console.error('Error parsing krpano XML:', error);
    return [];
  }
};

/**
 * Load và parse XML từ URL
 * @param {string} xmlUrl - URL của XML file
 * @param {string} baseUrl - Base URL cho images
 * @returns {Promise<Array>} Promise với array of scenes
 */
export const loadKrpanoXmlFromUrl = async (xmlUrl, baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}`) => {
  try {
    // Convert relative URL to absolute
    let fullXmlUrl = xmlUrl;
    if (!xmlUrl.startsWith('http')) {
      fullXmlUrl = `${baseUrl}/${xmlUrl.replace(/^\/+/, '')}`;
    }
    
    const response = await fetch(fullXmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to load XML: ${response.statusText}`);
    }
    
    const xmlString = await response.text();
    return parseKrpanoXml(xmlString, baseUrl);
  } catch (error) {
    console.error('Error loading krpano XML:', error);
    return [];
  }
};

/**
 * Convert cube format URL to equirectangular if possible
 * Note: This is a placeholder - actual conversion would require server-side processing
 */
export const convertCubeToEquirectangular = (cubeUrlPattern) => {
  // For now, return null - requires server processing
  // In production, you might want to:
  // 1. Use the preview image as fallback
  // 2. Server-side conversion from cube to equirectangular
  // 3. Load cube faces separately and stitch
  return null;
};

