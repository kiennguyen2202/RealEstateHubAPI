import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button, Upload, message, Input, Tooltip, Modal, Select } from "antd";
import {
  UploadOutlined,
  CloseOutlined,
  SaveOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import CustomImageTourViewer from "./CustomImageTourViewer";


const PanoramaTourEditor = ({ visible, onClose, onSave, initialData }) => {
  const [scenes, setScenes] = useState(initialData?.scenes || []);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState(null); // { sceneIndex, hotspotId }
  const [isEditHotspotMode, setIsEditHotspotMode] = useState(true); // true: click để chỉnh, false: click để chuyển scene



  // Ensure scenes always have hotspots array
  useEffect(() => {
    setScenes((prev) =>
      (prev || []).map((s) => ({
        ...s,
        hotspots: Array.isArray(s.hotspots) ? s.hotspots : [],
      }))
    );
  }, []);

  const selectedScene = scenes[selectedSceneIndex];

  // Handle adding panorama images
  const handleUpload = (info) => {
    const { fileList } = info;

    console.log("Upload info:", info);

    // Check file type
    if (info.file && info.file.type && !info.file.type.startsWith("image/")) {
      message.error(`${info.file.name} không phải là file ảnh!`);
      return;
    }

    // Convert uploaded files to scenes
    const newScenes = fileList.map((file, index) => {
      const existingScene = scenes.find((s) => s.uid === file.uid);
      if (existingScene) {
        return existingScene;
      }

      // Create preview URL
      let preview = null;
      if (file.originFileObj) {
        preview = URL.createObjectURL(file.originFileObj);
        console.log("Created blob URL:", preview);
      } else if (file.thumbUrl) {
        preview = file.thumbUrl;
      } else if (file.url) {
        preview = file.url;
      }

      if (!preview) {
        console.error("Could not create preview for file:", file);
        return null;
      }

      return {
        id: `scene-${Date.now()}-${index}`,
        uid: file.uid,
        name: `Scene ${scenes.length + index + 1}`, // Default simple name instead of filename
        description: "",
        imageUrl: preview,
        panoramaUrl: preview,
        thumbUrl: preview,
        file: file.originFileObj || file,
        hotspots: [],
      };
    }).filter(Boolean);

    console.log("New scenes:", newScenes);
    // Append to existing scenes to avoid losing old scenes
    setScenes([...scenes, ...newScenes]);

    if (newScenes.length > scenes.length) {
      message.success(`Đã thêm ${newScenes.length - scenes.length} ảnh panorama!`);
      // Auto select the first new scene
      if (scenes.length === 0 && newScenes.length > 0) {
        setSelectedSceneIndex(0);
      }
    }
  };

  // Handle removing a scene
  const handleRemoveScene = (index) => {
    const newScenes = scenes.filter((_, i) => i !== index);
    setScenes(newScenes);

    // Adjust selected index if needed
    if (selectedSceneIndex >= newScenes.length) {
      setSelectedSceneIndex(Math.max(0, newScenes.length - 1));
    }

    message.success("Đã xóa scene!");
  };

  // Handle save
  const handleSave = () => {
    if (scenes.length === 0) {
      message.warning("Vui lòng thêm ít nhất một ảnh panorama!");
      return;
    }

    onSave({
      scenes,
      startupSceneIndex: 0,
    });

    message.success("Đã lưu tour 3D!");
    onClose();
  };

  // Handle preview
  const handlePreview = () => {
    if (scenes.length === 0) {
      message.warning("Vui lòng thêm ít nhất một ảnh panorama để xem trước!");
      return;
    }
    setPreviewMode(true);
  };

  // Handle saving scene info
  const handleSaveSceneInfo = () => {
    if (!editingSceneInfo) return;

    const { index, name, description } = editingSceneInfo;

    setScenes(prevScenes => {
      const newScenes = [...prevScenes];
      if (index >= 0 && index < newScenes.length) {
        newScenes[index] = {
          ...newScenes[index],
          name: name,
          description: description
        };
      }
      return newScenes;
    });

    setEditingSceneInfo(null);
    message.success("Đã cập nhật thông tin scene!");
  };

  // ===== HOTSPOT HELPERS =====
  const addHotspotToSelectedScene = () => {
    if (!selectedScene) {
      message.warning("Vui lòng chọn một scene trước khi thêm hotspot!");
      return;
    }

    const newHotspot = {
      id: `hotspot-${Date.now()}`,
      // Sử dụng yaw/pitch (độ) để hotspot bám vào panorama
      // Mặc định đặt ở chính giữa hướng nhìn (0,0)
      yaw: 0,
      pitch: 0,
      targetSceneId: null,
    };

    const newScenes = [...scenes];
    const sceneHotspots = Array.isArray(selectedScene.hotspots)
      ? selectedScene.hotspots
      : [];
    newScenes[selectedSceneIndex] = {
      ...selectedScene,
      hotspots: [...sceneHotspots, newHotspot],
    };

    setScenes(newScenes);
    message.success("Đã thêm hotspot. Nhấp vào icon hotspot (ở giữa ảnh) để chọn scene đích!");
  };

  const updateHotspotPosition = (sceneIndex, hotspotId, yaw, pitch) => {
    const newScenes = scenes.map((scene, idx) => {
      if (idx !== sceneIndex) return scene;
      const hotspots = (scene.hotspots || []).map((h) =>
        h.id === hotspotId
          ? { ...h, yaw, pitch }
          : h
      );
      return { ...scene, hotspots };
    });
    setScenes(newScenes);
  };

  const deleteHotspot = (sceneIndex, hotspotId) => {
    const newScenes = scenes.map((scene, idx) => {
      if (idx !== sceneIndex) return scene;
      return {
        ...scene,
        hotspots: (scene.hotspots || []).filter((h) => h.id !== hotspotId),
      };
    });
    setScenes(newScenes);
    setEditingHotspot(null);
    message.success("Đã xóa hotspot!");
  };

  const currentEditingHotspot =
    editingHotspot &&
    scenes[editingHotspot.sceneIndex] &&
    (scenes[editingHotspot.sceneIndex].hotspots || []).find(
      (h) => h.id === editingHotspot.hotspotId
    );

  const handleSaveHotspotTarget = () => {
    if (!currentEditingHotspot) {
      setEditingHotspot(null);
      return;
    }
    if (!currentEditingHotspot.targetSceneId) {
      message.warning("Vui lòng chọn scene đích cho hotspot!");
      return;
    }

    console.log('[Editor] Saving Hotspot Target:', {
      id: currentEditingHotspot.id,
      yaw: currentEditingHotspot.yaw,
      pitch: currentEditingHotspot.pitch,
      targetSceneId: currentEditingHotspot.targetSceneId
    });

    message.success("Đã cập nhật scene đích cho hotspot!");
    setEditingHotspot(null);
  };

  // Memoize scene for viewer to prevent re-render when dragging hotspot
  // Only re-render when scene ID or image URL changes, not when hotspots change
  const viewerScene = useMemo(() => {
    if (!selectedScene) return null;
    return {
      id: selectedScene.id,
      uid: selectedScene.uid,
      name: selectedScene.name,
      imageUrl: selectedScene.imageUrl,
      panoramaUrl: selectedScene.panoramaUrl,
      thumbUrl: selectedScene.thumbUrl,
      description: selectedScene.description, // Pass description too
      hotspots: selectedScene.hotspots || [] // Pass hotspots to viewer
    };
  }, [selectedScene?.id, selectedScene?.imageUrl, selectedScene?.hotspots, selectedScene?.name, selectedScene?.description]); // Depend on hotspots too

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#000",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Fullscreen Viewer Background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {selectedScene ? (
          <CustomImageTourViewer
            scenes={viewerScene ? [viewerScene] : []}
            scenesForLookup={scenes} // Pass all scenes for tooltip lookup
            initialSceneId={viewerScene?.id}
            height="100%"
            controls={true}
            showThumbs={false}
            fov={120}
            fovMin={70}
            fovMax={140}
            autoRotate={false}
            littlePlanetIntro={false}
            enableHotspotEdit={isEditHotspotMode}
            onHotspotPositionChange={(sceneId, hotspotId, yaw, pitch) => {
              const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
              if (sceneIndex === -1) return;
              updateHotspotPosition(sceneIndex, hotspotId, yaw, pitch);
            }}
            onHotspotClick={(sceneId, hotspotId) => {
              const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
              if (sceneIndex === -1) return;

              const scene = scenes[sceneIndex];
              const hotspot = (scene.hotspots || []).find((h) => h.id === hotspotId);
              if (!hotspot) return;

              if (isEditHotspotMode) {
                // Mở modal chỉnh scene đích
                setEditingHotspot({
                  sceneIndex,
                  hotspotId,
                });
              } else if (hotspot.targetSceneId) {
                // Chuyển scene theo hotspot
                const targetIndex = scenes.findIndex((s) => s.id === hotspot.targetSceneId);
                if (targetIndex !== -1) {
                  setSelectedSceneIndex(targetIndex);
                }
              }
            }}
            // DIRECT EDITING HANDLERS
            onSceneNameChange={(sceneId, newName) => {
              setScenes(prev => {
                const idx = prev.findIndex(s => s.id === sceneId);
                if (idx === -1) return prev;
                const newScenes = [...prev];
                newScenes[idx] = { ...newScenes[idx], name: newName };
                return newScenes;
              });
            }}
            onSceneDescriptionChange={(sceneId, newDesc) => {
              setScenes(prev => {
                const idx = prev.findIndex(s => s.id === sceneId);
                if (idx === -1) return prev;
                const newScenes = [...prev];
                newScenes[idx] = { ...newScenes[idx], description: newDesc };
                return newScenes;
              });
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 64, margin: 0 }}>🌐</p>
              <p>Chưa có scene nào</p>
            </div >
          </div >
        )}

        {/* Menu Bar Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 12,
            backdropFilter: "blur(4px)",
          }}
        >
          {/* Logo/Title */}
          <div style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginRight: 20 }}>
            🌐 Tour 3D Editor
          </div>

          {/* Upload Button */}
          <Upload
            beforeUpload={() => false}
            multiple
            onChange={handleUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Thêm Panorama
            </Button>
          </Upload>

          {/* Preview Button */}
          <Tooltip title="Xem trước tour 3D">
            <Button
              icon={<EyeOutlined />}
              size="large"
              disabled={scenes.length === 0}
              onClick={handlePreview}
            >
              Xem trước
            </Button>
          </Tooltip>

          {/* Add Hotspot Button */}
          <Tooltip title="Thêm hotspot vào scene hiện tại">
            <Button
              icon={<PlusOutlined />}
              size="large"
              disabled={!selectedScene}
              onClick={addHotspotToSelectedScene}
            >
              Thêm Hotspot
            </Button>
          </Tooltip>

          {/* Toggle Edit / Navigate Hotspot */}
          <Tooltip title={isEditHotspotMode ? "Đang ở chế độ chỉnh sửa hotspot" : "Đang ở chế độ sử dụng hotspot để chuyển scene"}>
            <Button
              type={isEditHotspotMode ? "primary" : "default"}
              size="large"
              onClick={() => setIsEditHotspotMode((prev) => !prev)}
            >
              {isEditHotspotMode ? "Chế độ: Sửa Hotspot" : "Chế độ: Dùng Hotspot"}
            </Button>
          </Tooltip>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Save Button */}
          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            disabled={scenes.length === 0}
            onClick={handleSave}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
          >
            Lưu Tour
          </Button>

          {/* Close Button */}
          <Tooltip title="Đóng editor">
            <Button
              icon={<CloseOutlined />}
              size="large"
              onClick={onClose}
              danger
            >
              Đóng
            </Button>
          </Tooltip>
        </div>

        {/* Scene List Overlay (Bottom) */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            padding: "20px 20px 10px 20px",
          }}
        >
          <div style={{ color: "#fff", fontWeight: "bold", marginBottom: 10, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
            Danh sách Scene ({scenes.length})
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10 }}>
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                onClick={() => setSelectedSceneIndex(index)}
                style={{
                  flexShrink: 0,
                  width: 140,
                  border: selectedSceneIndex === index ? "2px solid #1890ff" : "2px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "rgba(0,0,0,0.5)",
                  transition: "all 0.2s",
                  position: "relative",
                }}
              >
                <img
                  src={scene.thumbUrl}
                  alt={scene.name}
                  style={{ width: "100%", height: 80, objectFit: "cover" }}
                />
                <div style={{ padding: "4px 8px" }}>
                  <div style={{ color: "#fff", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {scene.name}
                  </div>
                </div>
                {/* Delete button */}
                <div style={{ position: "absolute", top: 4, right: 4 }}>
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveScene(index);
                    }}
                    style={{ width: 20, height: 20, minWidth: 20, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
                  />
                </div>
              </div>
            ))}

            {/* Add Scene Button in List */}
            <Upload
              beforeUpload={() => false}
              multiple
              onChange={handleUpload}
              showUploadList={false}
              accept="image/*"
            >
              <div
                style={{
                  width: 140,
                  height: 110,
                  border: "2px dashed rgba(255,255,255,0.3)",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.7)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <PlusOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <span style={{ fontSize: 12 }}>Thêm Scene</span>
              </div>
            </Upload>
          </div>
        </div >

        {previewMode && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.95)",
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Preview Header */}
            <div
              style={{
                height: 60,
                background: "#2d2d2d",
                borderBottom: "1px solid #444",
                display: "flex",
                alignItems: "center",
                padding: "0 20px",
                gap: 12,
              }}
            >
              <div style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
                👁️ Xem trước Tour 3D
              </div>
              <div style={{ flex: 1 }} />
              <Button
                type="primary"
                size="large"
                onClick={() => setPreviewMode(false)}
              >
                Đóng xem trước
              </Button>
            </div>

            {/* Preview Content */}
            <div style={{ flex: 1, padding: 20 }}>
              <CustomImageTourViewer
                scenes={scenes}
                initialSceneId={scenes[0]?.id}
                height="100%"
                controls={true}
                showThumbs={true}
                fov={120}
                fovMin={70}
                fovMax={140}
                autoRotate={false}
                littlePlanetIntro={false}
                enableHotspotEdit={isEditHotspotMode}
                onHotspotPositionChange={(sceneId, hotspotId, yaw, pitch) => {
                  const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
                  if (sceneIndex === -1) return;
                  updateHotspotPosition(sceneIndex, hotspotId, yaw, pitch);
                }}
                onHotspotClick={(sceneId, hotspotId) => {
                  const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
                  if (sceneIndex === -1) return;

                  const scene = scenes[sceneIndex];
                  const hotspot = (scene.hotspots || []).find((h) => h.id === hotspotId);
                  if (!hotspot) return;

                  if (isEditHotspotMode) {
                    setEditingHotspot({ sceneIndex, hotspotId });
                  } else if (hotspot.targetSceneId) {
                    const targetIndex = scenes.findIndex((s) => s.id === hotspot.targetSceneId);
                    if (targetIndex !== -1) {
                      // Trong preview, chuyển thẳng scene trong viewer
                      const targetSceneId = scenes[targetIndex].id;
                      // Cập nhật startupSceneIndex tương ứng để lần sau mở preview đúng scene
                      setSelectedSceneIndex(targetIndex);
                    }
                  }
                }}
              />
            </div>

            {/* Preview Footer */}
            <div
              style={{
                padding: 16,
                background: "#1a1a1a",
                borderTop: "1px solid #444",
                color: "#fff",
              }}
            >
              <p style={{ margin: 0, textAlign: "center" }}>
                💡 <strong>Hướng dẫn:</strong> Kéo chuột để xoay, cuộn chuột để
                zoom. Sử dụng nút điều hướng hoặc thumbnail bên dưới để chuyển
                giữa các scene.
              </p>
            </div>
          </div>
        )}

        {/* Modal chọn scene đích cho hotspot */}
        <Modal
          title="Chọn scene đích cho hotspot"
          open={!!currentEditingHotspot}
          zIndex={12000}
          onCancel={() => setEditingHotspot(null)}
          footer={[
            <Button
              key="delete"
              danger
              onClick={() => {
                if (!editingHotspot) return;
                deleteHotspot(editingHotspot.sceneIndex, editingHotspot.hotspotId);
              }}
            >
              Xóa hotspot
            </Button>,
            <Button key="cancel" onClick={() => setEditingHotspot(null)}>
              Hủy
            </Button>,
            <Button key="ok" type="primary" onClick={handleSaveHotspotTarget}>
              Lưu
            </Button>,
          ]}
        >
          {currentEditingHotspot ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <strong>Scene hiện tại:</strong>{" "}
                {selectedScene ? selectedScene.name : "Không xác định"}
              </div>
              <div>
                <strong>Scene đích đã chọn:</strong>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                  {currentEditingHotspot.targetSceneId ? (
                    (() => {
                      const targetScene = scenes.find(
                        (s) => s.id === currentEditingHotspot.targetSceneId
                      );
                      if (!targetScene) return <span>Không tìm thấy scene đích.</span>;
                      return (
                        <>
                          <img
                            src={targetScene.thumbUrl || targetScene.imageUrl}
                            alt={targetScene.name}
                            style={{
                              width: 120,
                              height: 70,
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid #ddd",
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 500 }}>{targetScene.name}</div>
                            <div style={{ fontSize: 12, color: "#888" }}>
                              ID: {targetScene.id}
                            </div>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <span>Chưa chọn scene đích.</span>
                  )}
                </div>
              </div>
              <div>
                <strong>Chọn scene đích:</strong>
                <Select
                  style={{ width: "100%", marginTop: 8 }}
                  placeholder="Chọn scene đích"
                  value={currentEditingHotspot.targetSceneId || undefined}
                  onChange={(value) => {
                    // Cập nhật targetSceneId vào scenes
                    const { sceneIndex, hotspotId } = editingHotspot || {};
                    if (sceneIndex == null) return;
                    const newScenes = scenes.map((scene, idx) => {
                      if (idx !== sceneIndex) return scene;
                      const hotspots = (scene.hotspots || []).map((h) =>
                        h.id === hotspotId ? { ...h, targetSceneId: value } : h
                      );
                      return { ...scene, hotspots };
                    });
                    setScenes(newScenes);
                  }}
                >
                  {scenes.map((scene) => (
                    <Select.Option key={scene.id} value={scene.id}>
                      {scene.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>
          ) : (
            <div>Không có hotspot nào đang được chỉnh.</div>
          )}
        </Modal>

      </div >
    </div >
  );
};

export default PanoramaTourEditor;
