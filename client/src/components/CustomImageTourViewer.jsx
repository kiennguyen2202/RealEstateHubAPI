import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const CustomImageTourViewer = ({ 
  scenes = [],           // [{ id, imageUrl, panoramaUrl, title?, thumbUrl?, hotspots: [{ x, y, targetSceneId, title }] }]
  initialSceneId = null,
  height = 520,
  controls = true,
  onSceneChange = null,
  fov = 120,            
  fovMin = 70,           
  fovMax = 140,          
  showThumbs = true,     
  gyro = false,          
  autoRotate = false,    
  autoTour = false,      
  autoTourDelay = 5000,  
  littlePlanetIntro = false, 
  fullscreen = false,   
  onClose = null         
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const raycasterRef = useRef(null);
  const meshRef = useRef(null);
  const hotspotsRef = useRef([]);
  
  // Mouse control state
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  
  const [currentSceneId, setCurrentSceneId] = useState(
    initialSceneId || (scenes && scenes.length > 0 ? scenes[0].id : null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFov, setCurrentFov] = useState(fov);
  const [showControls, setShowControls] = useState(true);
  const [selectedThumbIndex, setSelectedThumbIndex] = useState(0);
  const [isLittlePlanetMode, setIsLittlePlanetMode] = useState(littlePlanetIntro);
  const autoTourTimerRef = useRef(null);
  const autoRotateSpeedRef = useRef(0.3); // Tốc độ quay (degrees per frame)
  const isAutoRotatingRef = useRef(autoRotate);
  const littlePlanetIntroDoneRef = useRef(false); // Đánh dấu đã chạy little planet intro
  // Lưu props vào ref để truy cập trong closure (animation loop)
  const autoRotateRef = useRef(autoRotate);
  const autoTourRef = useRef(autoTour);
  // Lưu isLittlePlanetMode vào ref để truy cập trong closure
  const isLittlePlanetModeRef = useRef(littlePlanetIntro);
  // Flag để đánh dấu user đã tương tác, không resume auto rotate nữa
  const userInteractedRef = useRef(false);

  // Convert URL to full URL
  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        urlObj.pathname = encodeURI(decodeURI(urlObj.pathname));
        return urlObj.toString();
      } catch {
        return url;
      }
    }
    const encodedPath = encodeURI(url);
    return `http://localhost:5134${encodedPath}`;
  };

  // Get current scene (không update state trong đây để tránh re-render loop)
  const getCurrentScene = () => {
    if (!scenes || scenes.length === 0) return null;
    return scenes.find(s => s.id === currentSceneId) || scenes[0];
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
    
    if (!scene || !camera) {
      console.warn('Scene or camera not ready');
      return;
    }

    const currentScene = getCurrentScene();
    if (!currentScene) {
      setError('Không tìm thấy scene');
      setLoading(false);
      return;
    }

    // Get image URL (support both imageUrl and panoramaUrl)
    const imageUrl = getFullUrl(currentScene.imageUrl || currentScene.panoramaUrl);
    if (!imageUrl) {
      setError('Không có URL ảnh');
      setLoading(false);
      return;
    }

    console.log('Loading panorama:', imageUrl);
    setLoading(true);
    setError(null);

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

    // Clear old hotspots
    hotspotsRef.current.forEach(hotspot => {
      scene.remove(hotspot);
      if (hotspot.geometry) hotspot.geometry.dispose();
      if (hotspot.material) hotspot.material.dispose();
    });
    hotspotsRef.current = [];

    // Load texture
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (texture) => {
        console.log('Texture loaded successfully');
        
        // Configure texture cho panorama - chuẩn Three.js
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.flipY = true; // Không flip Y
        
        // Tạo sphere geometry - scale -1 trên trục X để đảo ngược và xem từ bên trong
        const geometry = new THREE.SphereGeometry(500, 64, 32);
        geometry.scale(1, 1, -1); // Đảo ngược trục X để xem từ bên trong
        
        // Material với texture - dùng DoubleSide để đảm bảo hiển thị
        const material = new THREE.MeshBasicMaterial({ 
          map: texture,
          side: THREE.DoubleSide, // DoubleSide để hiển thị cả 2 mặt
          toneMapped: false // Tắt tone mapping
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;
        
        console.log('Panorama mesh added to scene');
        console.log('Texture:', texture);
        console.log('Mesh position:', mesh.position);
        console.log('Mesh visible:', mesh.visible);
        console.log('Camera position:', camera.position);
        console.log('Camera rotation:', camera.rotation);
        console.log('Scene children count:', scene.children.length);
        
        // Reset camera rotation và apply FOV settings
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
          
          console.log('Little Planet Intro: Starting with vlookat=90, fov=150');
          
          // Little Planet Intro Animation Sequence
          // Bước 1: Giữ little planet view trong 0.3s để user thấy hiệu ứng (giảm delay)
          setTimeout(() => {
            console.log('Little Planet Intro: Starting rotation animation');
            // Bước 2: Animate hlookat xoay 360 độ (quay một vòng) trong 2s (nhanh hơn)
            animateCameraRotation(360, 2.0, () => {
              console.log('Little Planet Intro: Rotation complete, starting vertical animation');
              // Bước 3: Chờ 0.2s (giảm delay)
              setTimeout(() => {
                // Bước 4: Animate vlookat từ 90 về 0 (từ trên xuống về ngang) trong 2s (nhanh hơn)
                animateCameraVertical(0, 2.0);
                // Đồng thời animate FOV từ 150 về 80 trong 2s
                animateFOV(80, 2.0, () => {
                  console.log('Little Planet Intro: Complete, enabling auto rotate');
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
          camera.position.set(0, 0, 0);
          camera.rotation.set(0, 0, 0);
          rotationRef.current = { x: 0, y: 0 };
        }
        
        // Apply FOV với min/max limits (fovmin="70" fovmax="140")
        if (!isLittlePlanetMode) {
          camera.fov = Math.max(fovMin, Math.min(fovMax, currentFov));
          camera.updateProjectionMatrix();
        }
        
        console.log('Camera FOV:', camera.fov);
        console.log('Camera aspect:', camera.aspect);
        
        // Add hotspots
        if (currentScene.hotspots && Array.isArray(currentScene.hotspots)) {
          currentScene.hotspots.forEach((hotspotConfig, index) => {
            addHotspot(hotspotConfig, index);
          });
        }
        
        setLoading(false);
        
        // Force render multiple times to ensure it displays
        if (rendererRef.current) {
          for (let i = 0; i < 3; i++) {
            rendererRef.current.render(scene, camera);
          }
          console.log('Rendered scene');
        }
      },
      undefined,
      (err) => {
        console.error('Error loading panorama:', err);
        setError(`Không thể tải ảnh: ${err?.message || 'Lỗi không xác định'}`);
        setLoading(false);
      }
    );
  };

  // Add hotspot
  const addHotspot = (config, index) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Tạo mũi tên 2D(màu trắng với viền đen)
    const arrowSize = 40; // Kích thước mũi tên
    
    // Tạo canvas để vẽ mũi tên 2D
    const canvas = document.createElement('canvas');
    canvas.width = arrowSize;
    canvas.height = arrowSize;
    const ctx = canvas.getContext('2d');
    
    // Vẽ mũi tên hướng lên trên
    const centerX = arrowSize / 2;
    const centerY = arrowSize / 2;
    const arrowWidth = arrowSize * 0.6; // Chiều rộng đầu mũi tên
    const arrowHeight = arrowSize * 0.8; // Chiều cao mũi tên
    
    // Vẽ viền đen trước
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Vẽ hình mũi tên (tam giác)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - arrowHeight / 2); // Điểm trên cùng (đầu mũi tên)
    ctx.lineTo(centerX - arrowWidth / 2, centerY + arrowHeight / 2); // Điểm dưới trái
    ctx.lineTo(centerX, centerY + arrowHeight / 2 - 5); // Điểm giữa (thân mũi tên)
    ctx.lineTo(centerX + arrowWidth / 2, centerY + arrowHeight / 2); // Điểm dưới phải
    ctx.closePath();
    
    // Vẽ viền đen
    ctx.stroke();
    
    // Tô màu trắng bên trong
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    // Vẽ lại viền để đảm bảo viền đen rõ ràng
    ctx.stroke();
    
    // Tạo texture từ canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Tạo material với texture
    const material = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    // Tạo plane geometry cho mũi tên 2D
    const geometry = new THREE.PlaneGeometry(arrowSize, arrowSize);
    const hotspot = new THREE.Mesh(geometry, material);

    // Position hotspot on sphere surface
    // x, y: angles in degrees (-180 to 180 for x, -90 to 90 for y)
    const theta = ((config.x || 0) * Math.PI) / 180; // Horizontal angle
    const phi = ((90 - (config.y || 0)) * Math.PI) / 180; // Vertical angle (from top)
    const radius = 480; // Slightly inside sphere
    
    // Convert spherical to Cartesian
    hotspot.position.x = radius * Math.sin(phi) * Math.cos(theta);
    hotspot.position.y = radius * Math.cos(phi);
    hotspot.position.z = radius * Math.sin(phi) * Math.sin(theta);
    
    // Hướng mũi tên về center (0, 0, 0) - luôn hướng về camera
    const toCenter = new THREE.Vector3(0, 0, 0).sub(hotspot.position).normalize();
    // Xoay plane để hướng về center
    hotspot.lookAt(hotspot.position.clone().add(toCenter));

    // Store data
    hotspot.userData = {
      targetSceneId: config.targetSceneId,
      title: config.title || ''
    };

    hotspotsRef.current.push(hotspot);
    scene.add(hotspot);
    
    // Pulse animation - lưu scale gốc
    hotspot.userData.originalScale = hotspot.scale.clone();
  };

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
    const height = rect.height || 520;

    // Create camera với FOV từ props (fov="120")
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 2000);
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
    renderer.setSize(width, height);
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
    
    console.log('Renderer created:', {
      width: canvas.width,
      height: canvas.height,
      display: canvas.style.display
    });

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;

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
        if (!isDraggingRef.current && !isLittlePlanetModeRef.current) canvas.style.cursor = 'grab';
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
      
      if (moveDistance < 10 && wasDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(hotspotsRef.current);

        if (intersects.length > 0) {
          const hotspot = intersects[0].object;
          if (hotspot.userData?.targetSceneId) {
            setCurrentSceneId(hotspot.userData.targetSceneId);
          }
        }
      }
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
      
      // Check for hotspot tap
      if (e.changedTouches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const mouse = new THREE.Vector2();
        mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(hotspotsRef.current);

        if (intersects.length > 0) {
          const hotspot = intersects[0].object;
          if (hotspot.userData?.targetSceneId) {
            setCurrentSceneId(hotspot.userData.targetSceneId);
          }
        }
      }
    };

    // Zoom controls (wheel) - giống XML với fovmin/fovmax
    const onWheel = (e) => {
      if (!controls) return;
      e.preventDefault();
      
      const camera = cameraRef.current;
      if (!camera) return;
      
      const zoomDelta = e.deltaY > 0 ? 5 : -5;
      const newFov = Math.max(fovMin, Math.min(fovMax, currentFov + zoomDelta));
      setCurrentFov(newFov);
      camera.fov = newFov;
      camera.updateProjectionMatrix();
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

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = rect.width || 800;
      const newHeight = rect.height || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Load initial panorama
    setTimeout(() => {
      loadPanorama();
    }, 100);

    // Animation loop
    let animationId = null;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        // Animate hotspots (pulse)
        hotspotsRef.current.forEach((hotspot, i) => {
          if (hotspot.userData?.originalScale) {
            const time = Date.now() * 0.001;
            const pulse = Math.sin(time * 3 + i) * 0.15 + 1;
            hotspot.scale.setScalar(hotspot.userData.originalScale.x * pulse);
          }
        });
        
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
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      window.removeEventListener('resize', handleResize);
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
      
      hotspotsRef.current.forEach(hotspot => {
        if (hotspot.geometry) hotspot.geometry.dispose();
        if (hotspot.material) hotspot.material.dispose();
      });
      
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
      if (littlePlanetIntro && isFirstScene && !isLittlePlanetMode && !littlePlanetIntroDoneRef.current) {
        setIsLittlePlanetMode(true);
        isLittlePlanetModeRef.current = true; // Cập nhật ref
        littlePlanetIntroDoneRef.current = true; // Đánh dấu đã chạy intro
      }
      loadPanorama();
      if (onSceneChange) {
        onSceneChange(currentSceneId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSceneId, scenes]);

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
      
      {/* Scene title */}
      {(() => {
        const currentScene = getCurrentScene();
        return currentScene?.title ? (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(45, 62, 80, 0.8)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: '14px',
            zIndex: 5,
            fontFamily: 'Arial' 
          }}>
            {currentScene.title}
          </div>
        ) : null;
      })()}
    </div>
  );
};

export default CustomImageTourViewer;
