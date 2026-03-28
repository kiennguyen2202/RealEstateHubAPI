import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const CustomImageTourViewer = ({
  scenes = [],           // [id, imageUrl, panoramaUrl, title?, thumbUrl?, hotspots]
  initialSceneId = null,
  height = 520,
  controls = true,
  onSceneChange = null,
  fov = 120,
  fovMin = 70,
  fovMax = 140,
  showThumbs = true,
  autoRotate = false,
  autoTour = false,
  littlePlanetIntro = false,
  // Hotspot props
  onHotspotClick = null,               // (sceneId, hotspotId) => void
  enableHotspotEdit = false,           // cho phép drag hotspot
  onHotspotPositionChange = null,      // (sceneId, hotspotId, yaw, pitch) => void
  onSceneNameChange = null,       // Callback to edit name
  onSceneDescriptionChange = null, // Callback to edit description
}) => {
  const containerRef = useRef(null); //Dùng để lấy kích thước, append canvas
  const sceneRef = useRef(null); //Lưu scene để dùng trong các function khác
  const cameraRef = useRef(null); //Lưu camera để xoay, zoom
  const rendererRef = useRef(null); //Lưu renderer để render scene
  const meshRef = useRef(null); //Dùng để dispose khi load scene mới

  // Mouse control state
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const currentImageUrlRef = useRef(null);

  // Track if Three.js init is done
  const [isThreeReady, setIsThreeReady] = useState(false);

  const [currentSceneId, setCurrentSceneId] = useState(() => {
    const id = initialSceneId || (scenes && scenes.length > 0 ? scenes[0].id : null);
    return id;
  });

  // Ref to hold currentSceneId for access in animation loop (avoid stale closure)
  const currentSceneIdRef = useRef(currentSceneId);
  useEffect(() => {
    currentSceneIdRef.current = currentSceneId;
  }, [currentSceneId]);

  // Sync currentSceneId when initialSceneId changes
  useEffect(() => {
    if (initialSceneId && initialSceneId !== currentSceneId) {
      setCurrentSceneId(initialSceneId);
    } else if (!currentSceneId && scenes.length > 0) {
      // Fallback: if no current scene, pick first
      setCurrentSceneId(scenes[0].id);
    }
  }, [initialSceneId, scenes]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFov, setCurrentFov] = useState(fov);
  const [showControls, setShowControls] = useState(true);
  const [selectedThumbIndex, setSelectedThumbIndex] = useState(0);
  const [isLittlePlanetMode, setIsLittlePlanetMode] = useState(littlePlanetIntro);
  const autoTourTimerRef = useRef(null);
  const autoRotateSpeedRef = useRef(0.3); // Tốc độ quay (0.3/frame,0.3*60fps=18/s)
  const isAutoRotatingRef = useRef(autoRotate);
  const littlePlanetIntroDoneRef = useRef(false); // Đánh dấu đã chạy little planet intro

  // Lưu props vào ref để truy cập trong closure (animation loop)
  const autoRotateRef = useRef(autoRotate);
  const autoTourRef = useRef(autoTour);
  // Lưu isLittlePlanetMode vào ref để truy cập trong closure
  const isLittlePlanetModeRef = useRef(littlePlanetIntro);
  // Flag để đánh dấu user đã tương tác, không resume auto rotate nữa
  const userInteractedRef = useRef(false);

  // Projected hotspot positions (screen-space, per current scene)
  // Mỗi hotspot: { id, sceneId, left, top, rotation }
  const [projectedHotspots, setProjectedHotspots] = useState([]);
  const viewportSizeRef = useRef({ width: 800, height: typeof height === 'number' ? height : 520 });
  const raycasterRef = useRef(new THREE.Raycaster());

  // Lưu scenes vào ref để animation loop luôn dùng dữ liệu mới nhất
  const scenesRef = useRef(scenes);
  useEffect(() => {
    scenesRef.current = scenes;
  }, [scenes]);

  // Trạng thái drag hotspot
  const hotspotDragRef = useRef({
    active: false,
    sceneId: null,
    hotspotId: null,
    startX: 0,
    startY: 0,
    hasMoved: false,
  });

  // Timer management for Intro to prevent race conditions
  const introTimersRef = useRef([]);
  const addIntroTimer = (callback, delay) => {
    const id = setTimeout(() => {
      // Only execute if still in intro mode (and component mounted)
      if (isLittlePlanetModeRef.current) {
        callback();
      }
    }, delay);
    introTimersRef.current.push(id);
    return id;
  };
  const clearIntroTimers = () => {
    introTimersRef.current.forEach(id => clearTimeout(id));
    introTimersRef.current = [];
  };

  // Convert URL to full URL
  const getFullUrl = (url) => {
    if (!url) return null;

    // Handle blob URLs (from local file upload)
    if (url.startsWith('blob:')) {
      return url;
    }

    // Handle full URLs (http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        urlObj.pathname = encodeURI(decodeURI(urlObj.pathname));
        return urlObj.toString();
      } catch {
        return url;
      }
    }

    // Handle relative paths - convert to localhost URL
    const encodedPath = encodeURI(url);
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}${encodedPath}`;
  };

  // Get current scene (không update state trong đây để tránh re-render loop)
  const getCurrentScene = () => {
    const list = scenesRef.current || [];
    if (list.length === 0) return null;
    return list.find(s => s.id === currentSceneId) || list[0];
  };

  // Update selected thumb index khi currentSceneId thay đổi
  useEffect(() => {
    if (scenes && scenes.length > 0) {
      const index = scenes.findIndex(s => s.id === currentSceneId);
      if (index >= 0) {
        setSelectedThumbIndex(index);
      }
    }
  }, [currentSceneId, scenes]);

  // Load panorama image
  const loadPanorama = () => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Ensure scene is truly ready before proceeding
    if (!sceneRef.current || !cameraRef.current) {
      console.warn('[CustomImageTourViewer] loadPanorama skipped - Scene/Camera missing');
      return;
    }

    

    if (!scene || !camera) {
      console.warn('[CustomImageTourViewer] Scene or camera not ready');
      return;
    }

    const currentScene = getCurrentScene();

    if (!currentScene) {
      console.error('[CustomImageTourViewer] No current scene found');
      setError('Không tìm thấy scene');
      setLoading(false);
      return;
    }

    // Get image URL (support both imageUrl and panoramaUrl)
    const rawUrl = currentScene.imageUrl || currentScene.panoramaUrl;

    const imageUrl = getFullUrl(rawUrl);

    if (!imageUrl) {
      console.error('[CustomImageTourViewer] No image URL available');
      setError('Không có URL ảnh');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Check if image URL changed
    if (currentImageUrlRef.current !== imageUrl) {
      // Full reload
      currentImageUrlRef.current = imageUrl;

      // Remove old mesh
      if (meshRef.current) {
        scene.remove(meshRef.current);
        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
        if (meshRef.current.material) {
          if (meshRef.current.material.map) {
            meshRef.current.material.map.dispose();
          }
          meshRef.current.material.dispose();
        }
        meshRef.current = null;
      }

      // Load texture
      const loader = new THREE.TextureLoader();
      loader.load(
        imageUrl,
        (texture) => {

          // Configure texture cho panorama - chuẩn Three.js
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.flipY = true; // Không flip Y

          // Tạo sphere geometry - scale -1 trên trục X để đảo ngược và xem từ bên trong
          const geometry = new THREE.SphereGeometry(500, 64, 32);
          geometry.scale(1, 1, -1); // Đảo ngược trục Z để xem từ bên trong

          // Material với texture - dùng DoubleSide để đảm bảo hiển thị
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide, // DoubleSide để hiển thị cả 2 mặt
            toneMapped: false // Tắt tone mapping
          });

          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          meshRef.current = mesh;

          // Setup camera and hotspots after mesh is ready
          setupScene(currentScene);
          setLoading(false);
        },
        undefined,
        (err) => {
          console.error('Error loading panorama:', err);
          setError(`Không thể tải ảnh: ${err?.message || 'Lỗi không xác định'}`);
          setLoading(false);
        }
      );
    } else {
      // Just update hotspots and camera settings
      // BUT only if mesh exists!
      if (meshRef.current) {
        setupScene(currentScene);
      }
      setLoading(false);
    }
  };

  const setupScene = (currentScene) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Guard: Do not run setup if mesh is not ready
    if (!meshRef.current) {
      console.warn('[CustomImageTourViewer] setupScene skipped because mesh is not valid');
      return;
    }

    // Reset camera rotation & FOV (trừ khi đang ở little planet mode)

    if (isLittlePlanetMode) {
      // Little Planet Intro: bắt đầu với "little planet" view
      // vlookat=90 (nhìn từ trên xuống), fov=150
      camera.position.set(0, 0, 0);

      // Bắt đầu với little planet view: nhìn từ trên xuống
      // Trong hệ thống: rotation.y = vertical, rotation.x = horizontal
      // Để nhìn từ trên xuống: cần rotation.y = 90 (sẽ được map sang camera.rotation.x)
      rotationRef.current = { x: 0, y: 90 }; // vlookat=90 (nhìn từ trên xuống), hlookat=0
      updateCameraRotation();

      // Set FOV rất cao cho little planet effect
      camera.fov = 150;
      camera.updateProjectionMatrix();
      setCurrentFov(150);


      // Little Planet Intro Animation Sequence
      // Bước 1: Giữ little planet view trong 0.3s để user thấy hiệu ứng (giảm delay)
      addIntroTimer(() => {
        // Bước 2: Animate hlookat xoay 360 độ (quay một vòng) trong 2s (nhanh hơn)
        animateCameraRotation(360, 2.0, () => {
          // Check if still in intro mode before proceeding
          if (!isLittlePlanetModeRef.current) return;

          // Bước 3: Chờ 0.2s (giảm delay)
          addIntroTimer(() => {
            // Bước 4: Animate vlookat từ 90 về 0 (từ trên xuống về ngang) trong 2s (nhanh hơn)
            animateCameraVertical(0, 2.0);
            // Đồng thời animate FOV từ 150 về 80 trong 2s
            animateFOV(80, 2.0, () => {
              if (!isLittlePlanetModeRef.current) return;

              // Hoàn thành intro, tắt little planet mode
              setIsLittlePlanetMode(false);
              isLittlePlanetModeRef.current = false; // Cập nhật ref
              // Bắt đầu auto rotate nếu enabled (sử dụng ref để lấy giá trị mới nhất)
              if (autoRotateRef.current || autoTourRef.current) {
                isAutoRotatingRef.current = true;
              }
            });
          }, 200);
        });
      }, 300);
    } else {
      if (currentImageUrlRef.current !== currentScene.imageUrl && currentImageUrlRef.current !== currentScene.panoramaUrl) {
        camera.position.set(0, 0, 0);
        camera.rotation.set(0, 0, 0);
        rotationRef.current = { x: 0, y: 0 };
      }
    }

    // Apply FOV với min/max limits (fovmin="70" fovmax="140")
    if (!isLittlePlanetMode) {
      camera.fov = Math.max(fovMin, Math.min(fovMax, currentFov));
      camera.updateProjectionMatrix();
    }

    // Force render multiple times to ensure it displays
    if (rendererRef.current) {
      for (let i = 0; i < 3; i++) {
        rendererRef.current.render(scene, camera);
      }
    }
  };

  // Old loadPanorama implementation for reference (replaced above)

  // Update camera rotation
  const updateCameraRotation = () => {
    const camera = cameraRef.current;
    if (!camera) return;

    const rotation = rotationRef.current;

    // Rotate camera around Y axis (horizontal) and X axis (vertical)
    // rotation.x = horizontal rotation (hlookat in krpano, degrees)
    // rotation.y = vertical rotation (vlookat in krpano, degrees)
    camera.rotation.order = 'YXZ';

    // Horizontal: rotation.x (degrees) -> camera.rotation.y (radians)
    // Negative để match mouse direction và chuẩn krpano
    const horizontalRad = rotation.x * (Math.PI / 180);
    camera.rotation.y = -horizontalRad;

    // Vertical: rotation.y (degrees) -> camera.rotation.x (radians)
    // Trong Three.js sphere panorama (xem từ bên trong):
    //   camera.rotation.x dương = nhìn lên (look up) = nhìn lên phía trên sphere
    //   camera.rotation.x âm = nhìn xuống (look down) = nhìn xuống phía dưới sphere
    // Trong krpano: 
    //   vlookat=90 = nhìn từ trên xuống (little planet view từ góc cao)
    //   vlookat=-90 = nhìn từ dưới lên
    // Với sphere panorama trong Three.js, để có little planet effect (nhìn từ trên xuống):
    //   Cần nhìn xuống (look down) = camera.rotation.x âm = -Math.PI/2
    //   Vì vậy: rotation.y = 90 -> camera.rotation.x = -Math.PI/2 (nhìn xuống = little planet view từ trên xuống)
    // ĐẢO NGƯỢC: vlookat=90 -> rotation.y=90 -> camera.rotation.x = -Math.PI/2
    const verticalRad = -rotation.y * (Math.PI / 180); // Đảo ngược để đúng hướng
    // Clamp để tránh flip: -90 đến 90 độ -> -PI/2 đến PI/2
    camera.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, verticalRad));
  };

  // Animate camera rotation (hlookat) - tween function giống XML easeInOutQuad
  const animateCameraRotation = (targetRotation, duration, onComplete) => {
    const startRotation = rotationRef.current.x;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease in out quadratic (giống easeInOutQuad trong XML)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      rotationRef.current.x = startRotation + (targetRotation - startRotation) * eased;
      updateCameraRotation();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    animate();
  };

  // Animate camera vertical (vlookat)
  const animateCameraVertical = (targetVertical, duration) => {
    const startVertical = rotationRef.current.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      rotationRef.current.y = startVertical + (targetVertical - startVertical) * eased;
      updateCameraRotation();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  // Animate FOV
  const animateFOV = (targetFOV, duration, onComplete) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const startFOV = camera.fov;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      camera.fov = startFOV + (targetFOV - startFOV) * eased;
      camera.updateProjectionMatrix();
      setCurrentFov(camera.fov);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    animate();
  };

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Get container dimensions
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const heightPx = rect.height || 520;
    viewportSizeRef.current = { width, height: heightPx };

    // Create camera với FOV từ props (fov="120")
    const camera = new THREE.PerspectiveCamera(fov, width / heightPx, 0.1, 2000);
    camera.position.set(0, 0, 0); // Center for panorama
    camera.rotation.order = 'YXZ';
    camera.rotation.set(0, 0, 0);
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    // Đảm bảo renderer không bị tối
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.cursor = controls ? 'grab' : 'default';
    canvas.style.userSelect = 'none';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';

    containerRef.current.appendChild(canvas);
    rendererRef.current = renderer;

    

    // Mouse controls
    const onMouseDown = (e) => {
      if (!controls) return;
      // Không cho tương tác trong little planet intro (sử dụng ref để check trong closure)
      if (isLittlePlanetModeRef.current) return;
      isDraggingRef.current = true;
      isAutoRotatingRef.current = false; // Dừng auto rotate khi có tương tác
      userInteractedRef.current = true; // Đánh dấu user đã tương tác, không resume auto rotate nữa
      canvas.style.cursor = 'grabbing';
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current || !controls || isLittlePlanetModeRef.current) {
        if (!isDraggingRef.current && !isLittlePlanetModeRef.current) {
          canvas.style.cursor = 'grab';
        }
        return;
      }

      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e.clientY - lastMouseRef.current.y;

      // Sensitivity adjustment
      // Đảo ngược deltaX: kéo sang trái -> quay sang phải, kéo sang phải -> quay sang trái
      rotationRef.current.x -= deltaX * 0.5; // Đảo ngược dấu để đúng hướng
      // Đảo ngược deltaY để match với việc đảo ngược vertical rotation trong updateCameraRotation
      rotationRef.current.y -= deltaY * 0.5; // Đảo ngược để mouse controls đúng hướng

      // Clamp vertical rotation để tránh flip (-90 đến 90 độ)
      rotationRef.current.y = Math.max(-90, Math.min(90, rotationRef.current.y));

      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      updateCameraRotation();
    };

    const onMouseUp = (e) => {
      if (!controls) return;

      const wasDragging = isDraggingRef.current;
      isDraggingRef.current = false;
      canvas.style.cursor = 'grab';

      // KHÔNG resume auto rotate sau khi thả chuột nếu user đã tương tác
      // Auto rotate chỉ chạy tự động, một khi user tương tác thì dừng hoàn toàn
      // if ((autoRotateRef.current || autoTourRef.current) && !isLittlePlanetModeRef.current && !userInteractedRef.current) {
      //   isAutoRotatingRef.current = true;
      // }

      // Check for hotspot click (only if not much movement = click, not drag)
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - lastMouseRef.current.x, 2) +
        Math.pow(e.clientY - lastMouseRef.current.y, 2)
      );
    };

    const onMouseLeave = () => {
      isDraggingRef.current = false;
      if (controls) canvas.style.cursor = 'grab';
    };

    // Touch controls
    const onTouchStart = (e) => {
      if (!controls) return;
      if (isLittlePlanetModeRef.current) return; // Không cho tương tác trong little planet intro
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        isAutoRotatingRef.current = false; // Dừng auto rotate khi có tương tác
        userInteractedRef.current = true; // Đánh dấu user đã tương tác
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e) => {
      if (!controls || !isDraggingRef.current || e.touches.length !== 1) return;
      if (isLittlePlanetModeRef.current) return; // Không cho tương tác trong little planet intro
      e.preventDefault();

      const deltaX = e.touches[0].clientX - lastMouseRef.current.x;
      const deltaY = e.touches[0].clientY - lastMouseRef.current.y;

      // Sensitivity adjustment (giống mouse controls)
      // Đảo ngược deltaX: kéo sang trái -> quay sang phải, kéo sang phải -> quay sang trái
      rotationRef.current.x -= deltaX * 0.5; // Đảo ngược dấu để đúng hướng
      // Đảo ngược deltaY để match với việc đảo ngược vertical rotation trong updateCameraRotation
      rotationRef.current.y -= deltaY * 0.5; // Đảo ngược để touch controls đúng hướng

      // Clamp vertical rotation để tránh flip (-90 đến 90 độ)
      rotationRef.current.y = Math.max(-90, Math.min(90, rotationRef.current.y));

      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateCameraRotation();
    };

    const onTouchEnd = (e) => {
      if (!controls) return;
      isDraggingRef.current = false;

      // No hotspot tap handling anymore
      if (e.changedTouches.length > 0) {
        // chỉ dừng drag / không xử lý hotspot
      }
    };

    // Zoom controls (wheel) - giống XML với fovmin/fovmax
    const onWheel = (e) => {
      if (!controls) return;
      e.preventDefault();

      const camera = cameraRef.current;
      if (!camera) return;

      // Dùng camera.fov thay vì currentFov để tránh stale closure
      
      const zoomDelta = e.deltaY > 0 ? 2 : -2;
      const newFov = Math.max(fovMin, Math.min(fovMax, camera.fov + zoomDelta));
      camera.fov = newFov;
      camera.updateProjectionMatrix();
      setCurrentFov(newFov);
    };

    // Add event listeners
    if (controls) {
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mouseleave', onMouseLeave);
      canvas.addEventListener('wheel', onWheel);
      canvas.addEventListener('touchstart', onTouchStart);
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd);
    }

    // Handle resize with ResizeObserver for better accuracy
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = rect.width || 800;
      const newHeight = rect.height || height;
      viewportSizeRef.current = { width: newWidth, height: newHeight };
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    // Initial resize
    handleResize();

    // Use ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    // Mark Three.js as ready
    setIsThreeReady(true);
    // window.addEventListener('resize', handleResize); // Fallback removed

    // Helper: project hotspots of current scene to screen space
    const updateProjectedHotspots = () => {
      const camera = cameraRef.current;
      const renderer = rendererRef.current;

      // Use ref to get the latest currentSceneId without needing it in dependency array
      const id = currentSceneIdRef.current;
      const list = scenesRef.current || [];
      const currentScene = list.find(s => s.id === id);

      if (!camera || !renderer || !currentScene || !Array.isArray(currentScene.hotspots)) {
        if (projectedHotspots.length > 0) {
          // Only clear if not already cleared to avoid re-renders
          // Note: Setting state in animation loop can be expensive if not careful,
          // but we need to update React state for the overlay to render.
          // Ideally we should check if it actually changed.
          // For now, checking length > 0 is a basic optimization.
          // Better optimization: check if we actually have hotspots to clear
          setProjectedHotspots([]);
        }
        return;
      }

      const { width, height: vpHeight } = viewportSizeRef.current;
      const result = [];

      // Update camera matrix world ensuring projection uses latest rotation
      camera.updateMatrixWorld();

      currentScene.hotspots.forEach((hotspot) => {
        // Ưu tiên kiểu mới: yaw/pitch (độ)
        let yawDeg = null;
        let pitchDeg = null;

        if (typeof hotspot.yaw === 'number' && typeof hotspot.pitch === 'number') {
          yawDeg = hotspot.yaw;
          pitchDeg = hotspot.pitch;
        } else if (typeof hotspot.x === 'number' && typeof hotspot.y === 'number') {
          // Hỗ trợ format krpano / parser: x = ath, y = atv (độ)
          yawDeg = hotspot.x;
          pitchDeg = hotspot.y;
        }

        if (yawDeg === null || pitchDeg === null) return;

        const yawRad = THREE.MathUtils.degToRad(yawDeg);
        const pitchRad = THREE.MathUtils.degToRad(pitchDeg);

        // Chuyển yaw/pitch -> vector 3D (hướng nhìn) rồi nhân với bán kính sphere
        // Quy ước: yaw=0, pitch=0 nhìn theo trục -Z (chính giữa ảnh)
        const cosPitch = Math.cos(pitchRad);
        const x = Math.sin(yawRad) * cosPitch;
        const y = Math.sin(pitchRad);
        const z = -Math.cos(yawRad) * cosPitch;

        const pos = new THREE.Vector3(x, y, z).multiplyScalar(500);

        // Debug Log (Trottle or Conditional? For now, log on specific hotspot or always if scene just changed)
        // To avoid spam, we can check a global flag or just log. user asked for fix, so logging is temp.
        // Better: logic only runs every frame. console.log here is BAD.
        // I will add a "debug mode" triggered by window variable or just NOT log in loop unless I want to hang the browser.
        // Instead, I'll log ONLY if I detect a special window flag or just fix the `updateMatrixWorld` first which might be the fix.
        // For debugging, I'll log inside the Drag Handlers (on click/drag) which is rare event.
        // But for Render, I'll rely on correct Math.

        pos.project(camera);

        // Nếu phía sau camera thì ẩn
        if (pos.z > 1) {
          return;
        }

        const screenX = (pos.x + 1) / 2 * width;
        const screenY = (-pos.y + 1) / 2 * vpHeight;

        // Mũi tên thẳng, không nghiêng
        const angle = 0;

        result.push({
          id: hotspot.id,
          sceneId: currentScene.id,
          targetSceneId: hotspot.targetSceneId, // Pass target for tooltip
          left: screenX,
          top: screenY,
          rotation: angle,
          // Debug info for tooltip?
          yaw: yawDeg,
          pitch: pitchDeg
        });
      });

      setProjectedHotspots(result);
    };

    // Animation loop
    let animationId = null;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        // Auto rotate camera từ trái sang phải (nếu autoRotate hoặc autoTour enabled, không đang drag, không trong little planet intro, và user chưa tương tác)
        // Sử dụng ref để truy cập props mới nhất từ closure (vì animation loop được tạo trong useEffect với empty deps)
        const shouldAutoRotate = (autoRotateRef.current || autoTourRef.current) && !isDraggingRef.current && isAutoRotatingRef.current && !isLittlePlanetModeRef.current && !userInteractedRef.current;
        if (shouldAutoRotate) {
          rotationRef.current.x += autoRotateSpeedRef.current;
          updateCameraRotation();
        }

        // Update camera rotation if dragging (nhưng không trong little planet intro để tránh conflict)
        if (isDraggingRef.current && !isLittlePlanetModeRef.current) {
          updateCameraRotation();
        }

        // Cập nhật vị trí hotspot trên màn hình
        updateProjectedHotspots();

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      clearIntroTimers();

      resizeObserver.disconnect();
      // window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseLeave);
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);

        if (containerRef.current && canvas.parentNode === containerRef.current) {
          containerRef.current.removeChild(canvas);
        }
      }

      // Dispose resources
      if (meshRef.current) {
        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
        if (meshRef.current.material) {
          if (meshRef.current.material.map) meshRef.current.material.map.dispose();
          meshRef.current.material.dispose();
        }
      }

      if (renderer) {
        renderer.dispose();
      }
    };
  }, []); // Only run once on mount

  // Cập nhật ref khi props và state thay đổi
  useEffect(() => {
    autoRotateRef.current = autoRotate;
    autoTourRef.current = autoTour;
    isLittlePlanetModeRef.current = isLittlePlanetMode;
  }, [autoRotate, autoTour, isLittlePlanetMode]);

  // Auto Tour - tự động quay camera từ trái sang phải (không phải chuyển scene)
  // Dừng khi có tương tác chuột
  useEffect(() => {
    // Kiểm tra nếu autoTour hoặc autoRotate được bật
    if (autoTour || autoRotate) {
      if (!isLittlePlanetMode) {
        // Nếu không trong intro, enable ngay
        isAutoRotatingRef.current = true;
      }
      // Nếu đang trong intro, sẽ được enable sau khi intro hoàn thành (trong loadPanorama callback)
    } else {
      // Nếu không enable autoTour/autoRotate, tắt
      isAutoRotatingRef.current = false;
    }

    return () => {
      // Không disable ở đây vì có thể đang trong intro và sẽ được enable sau
    };
  }, [autoTour, autoRotate, isLittlePlanetMode]);

  // Reload panorama when scene changes
  useEffect(() => {
    

    if (sceneRef.current && cameraRef.current && scenes && scenes.length > 0) {
      // Apply little planet intro chỉ khi là scene đầu tiên và chưa chạy intro
      const isFirstScene = scenes.findIndex(s => s.id === currentSceneId) === 0;

      // Reset little planet done ref if we switch back to first scene? 
      // User requirement: "intro and autotour" when entering. 
      // If we want it to run ONLY ONCE when component mounts (or first valid scene load):
      if (littlePlanetIntro && !littlePlanetIntroDoneRef.current && isFirstScene) {
        // Force enable little planet mode
        setIsLittlePlanetMode(true);
        isLittlePlanetModeRef.current = true;
        littlePlanetIntroDoneRef.current = true;
      } else if (!isFirstScene && isLittlePlanetMode) {
        // If switching scene while in intro (unlikely but possible), disable intro
        setIsLittlePlanetMode(false);
        isLittlePlanetModeRef.current = false;
      }

      // Load panorama if ready
      if (isThreeReady) {
        loadPanorama();
      }

      if (onSceneChange) {
        onSceneChange(currentSceneId);
      }
    } else {
      console.warn('[CustomImageTourViewer] Cannot load panorama:', {
        hasSceneRef: !!sceneRef.current,
        hasCameraRef: !!cameraRef.current,
        scenesCount: scenes?.length,
        isThreeReady
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSceneId, scenes, isThreeReady]);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        borderRadius: 8
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        position: 'relative',
        background: '#000',
        borderRadius: 8,
        overflow: 'hidden'
      }}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)',
          zIndex: 10,
          color: '#fff'
        }}>
          <div>Đang tải ảnh...</div>
        </div>
      )}

      {/* Control Bar */}
      {showControls && scenes.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(45, 62, 80, 0.8)',
          padding: '12px 20px',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 10,
          boxShadow: '0 4 10 0 rgba(0,0,0,0.3)'
        }}>
          {/* Previous button */}
          <button
            onClick={() => {
              const currentIndex = scenes.findIndex(s => s.id === currentSceneId);
              if (currentIndex > 0) {
                setCurrentSceneId(scenes[currentIndex - 1].id);
              }
            }}
            disabled={scenes.findIndex(s => s.id === currentSceneId) === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              opacity: scenes.findIndex(s => s.id === currentSceneId) === 0 ? 0.5 : 1
            }}
          >
            ←
          </button>

          {/* Scene counter */}
          <div style={{ color: '#fff', fontSize: '14px', minWidth: '80px', textAlign: 'center' }}>
            {scenes.findIndex(s => s.id === currentSceneId) + 1} / {scenes.length}
          </div>

          {/* Next button */}
          <button
            onClick={() => {
              const currentIndex = scenes.findIndex(s => s.id === currentSceneId);
              if (currentIndex < scenes.length - 1) {
                setCurrentSceneId(scenes[currentIndex + 1].id);
              }
            }}
            disabled={scenes.findIndex(s => s.id === currentSceneId) === scenes.length - 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              opacity: scenes.findIndex(s => s.id === currentSceneId) === scenes.length - 1 ? 0.5 : 1
            }}
          >
            →
          </button>
        </div>
      )}

      {/* Thumbnail navigation bar*/}
      {showThumbs && scenes.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: showControls ? 80 : 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          background: 'rgba(45, 62, 80, 0.8)',
          padding: '10px',
          borderRadius: 8,
          zIndex: 10,
          maxWidth: '90%',
          overflowX: 'auto'
        }}>
          {scenes.map((scene, idx) => (
            <div
              key={scene.id}
              onClick={() => setCurrentSceneId(scene.id)}
              style={{
                width: '120px',
                height: '80px',
                borderRadius: 4,
                overflow: 'hidden',
                cursor: 'pointer',
                border: selectedThumbIndex === idx ? '3px solid #fff' : '3px solid transparent',
                padding: selectedThumbIndex === idx ? '0' : '3px',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <img
                src={getFullUrl(scene.thumbUrl || scene.imageUrl || scene.panoramaUrl)}
                alt={scene.title || `Scene ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  // Fallback nếu thumb load lỗi
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      )}

      {(() => {
        // Overlay for Title & Description (Editable or Read-only)
        const currentScene = getCurrentScene();
        if (!currentScene) return null;

        const isEditable = !!onSceneNameChange; // Check if editing callbacks are provided

        if (!isEditable && !currentScene.title && !currentScene.name) return null;

        return (
          <div style={{
            position: 'absolute',
            top: 80, // Moved down to avoid overlapping with top bar
            left: 20,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            zIndex: 5,
            pointerEvents: isEditable ? 'auto' : 'none', // Allow clicking if editable
            maxWidth: '300px',
            border: isEditable ? '1px solid rgba(255,255,255,0.3)' : 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            {isEditable ? (
              // EDIT MODE
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={currentScene.name || ''}
                  onChange={(e) => onSceneNameChange && onSceneNameChange(currentScene.id, e.target.value)}
                  placeholder="Nhập tên scene..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    width: '100%',
                    outline: 'none',
                    borderBottom: '1px dashed rgba(255,255,255,0.5)'
                  }}
                />
                <textarea
                  value={currentScene.description || ''}
                  onChange={(e) => onSceneDescriptionChange && onSceneDescriptionChange(currentScene.id, e.target.value)}
                  placeholder="Nhập mô tả chi tiết..."
                  rows={2}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            ) : (
              // READ-ONLY MODE
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 4 }}>
                  {currentScene.title || currentScene.name}
                </div>
                {currentScene.description && (
                  <div style={{ fontSize: '14px', lineHeight: '1.4', color: 'rgba(255, 255, 255, 0.9)' }}>
                    {currentScene.description}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Hotspots overlay (projected từ panorama ra màn hình) */}
      {projectedHotspots.length > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 8,
          }}
        >
          {projectedHotspots.map((h) => {
            return (
              <div
                key={h.id}
                style={{
                  position: 'absolute',
                  left: `${h.left}px`,
                  top: `${h.top}px`,
                  transform: `translate(-50%, -50%) rotate(${h.rotation || 0}rad)`,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  const handleHotspotInteract = () => {
                    // Ưu tiên chuyển scene nếu có target
                    if (h.targetSceneId) {
                      setCurrentSceneId(h.targetSceneId);
                    }

                    // Gọi callback ngoài (để editor biết đã click)
                    if (onHotspotClick) {
                      const currentScene = getCurrentScene();
                      onHotspotClick(currentScene.id, h.id);
                    }
                  };

                  // Nếu không ở chế độ edit thì click luôn
                  if (!enableHotspotEdit || !onHotspotPositionChange) {
                    handleHotspotInteract();
                    return;
                  }

                  // Chế độ Edit: Xử lý Drag
                  const dragState = {
                    active: true,
                    sceneId: h.sceneId,
                    hotspotId: h.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    hasMoved: false,
                  };
                  hotspotDragRef.current = dragState;

                  const onMove = (ev) => {
                    const state = hotspotDragRef.current;
                    if (!state.active) return;

                    const deltaX = ev.clientX - state.startX;
                    const deltaY = ev.clientY - state.startY;
                    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    if (moveDistance > 2) {
                      state.hasMoved = true;
                    }

                    const container = containerRef.current;
                    const camera = cameraRef.current;
                    if (!container || !camera) return;

                    const rect = container.getBoundingClientRect();
                    const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
                    const ndcY = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);

                    const raycaster = raycasterRef.current;
                    raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);

                    const dir = raycaster.ray.direction.clone().normalize();
                    const radius = 500;
                    const point = dir.multiplyScalar(radius);
                    const x = point.x;
                    const y = point.y;
                    const z = point.z;
                    // Fix: Math.atan2(x, -z) calculates yaw from -Z axis (0 deg)
                    const yaw = THREE.MathUtils.radToDeg(Math.atan2(x, -z));
                    const pitch = THREE.MathUtils.radToDeg(Math.asin(y / radius));

                    onHotspotPositionChange(state.sceneId, state.hotspotId, yaw, pitch);
                  };

                  const onUp = (ev) => {
                    const state = hotspotDragRef.current;
                    hotspotDragRef.current = {
                      active: false,
                      sceneId: null,
                      hotspotId: null,
                      startX: 0,
                      startY: 0,
                      hasMoved: false,
                    };

                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);

                    const totalMove = Math.sqrt(
                      Math.pow(ev.clientX - state.startX, 2) +
                      Math.pow(ev.clientY - state.startY, 2)
                    );

                    if (!state.hasMoved && totalMove <= 2) {
                      handleHotspotInteract();
                    }
                  };

                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
              >
                {/* Hotspot Icon */}
                <img
                  src="/vtourskin_hotspot.png"
                  alt="hotspot"
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default CustomImageTourViewer;
