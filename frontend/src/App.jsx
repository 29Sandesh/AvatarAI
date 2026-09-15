import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("avatarai-theme") === "dark"
  );

  const [backendStatus, setBackendStatus] = useState("checking");

  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [selectedAvatarImage, setSelectedAvatarImage] = useState(null);
  const [uploadedAvatarName, setUploadedAvatarName] = useState("");
  const [avatars, setAvatars] = useState([]);

  const [activeTool, setActiveTool] = useState("Avatar");

  const [script, setScript] = useState(
    "Hello! Type any message you want here, and I will speak it for you!"
  );

  const [selectedVoice, setSelectedVoice] = useState("Guy");
  const [selectedPosition, setSelectedPosition] = useState("Center");

  // AI & Generation States
  const [voicesList, setVoicesList] = useState([
    {
      name: "Guy",
      description: "Natural, deep and conversational male voice (Ultra-Realistic)",
      language: "English (US)",
      style: "Conversational",
    },
    {
      name: "Jenny",
      description: "Clear, friendly studio female voice (Ultra-Realistic)",
      language: "English (US)",
      style: "Natural",
    },
    {
      name: "Prabhat",
      description: "Natural Indian-English male voice",
      language: "English (India)",
      style: "Natural",
    },
    {
      name: "Neerja",
      description: "Expressive Indian-English female voice",
      language: "English (India)",
      style: "Expressive",
    },
    {
      name: "Sofia",
      description: "Warm and friendly female voice (Local ONNX)",
      language: "English",
      style: "Warm",
    },
    {
      name: "James",
      description: "Deep and professional male voice (Local ONNX)",
      language: "English",
      style: "Deep",
    },
    {
      name: "Emma",
      description: "Clear and articulate female voice (Local ONNX)",
      language: "English",
      style: "Clear",
    },
  ]);
  const [playingVoice, setPlayingVoice] = useState(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationStage, setGenerationStage] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [projects, setProjects] = useState([]);
  const [previewProjectModal, setPreviewProjectModal] = useState(null);

  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // -----------------------------------------
  // SAVE THEME
  // -----------------------------------------
  useEffect(() => {
    localStorage.setItem("avatarai-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // -----------------------------------------
  // LOAD BACKEND + AVATARS + PROJECTS + VOICES
  // -----------------------------------------
  const loadAvatars = () => {
    axios
      .get(`${API_URL}/avatars`)
      .then((response) => {
        const savedAvatars = response.data.avatars || [];
        setAvatars(savedAvatars);
        if (savedAvatars.length > 0 && !selectedAvatarImage) {
          setSelectedAvatarImage(savedAvatars[0].url);
          setUploadedAvatarName(savedAvatars[0].filename);
        }
      })
      .catch((error) => {
        console.error("Could not load avatars:", error);
      });
  };

  const loadProjects = () => {
    axios
      .get(`${API_URL}/api/projects`)
      .then((response) => {
        setProjects(response.data.projects || []);
      })
      .catch((err) => {
        console.error("Could not load projects:", err);
      });
  };

  const checkHealth = () => {
    axios
      .get(`${API_URL}/health`)
      .then((response) => {
        if (response.data.status === "healthy") {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      })
      .catch(() => {
        setBackendStatus("offline");
      });
  };

  useEffect(() => {
    checkHealth();
    loadAvatars();
    loadProjects();

    axios
      .get(`${API_URL}/api/voices`)
      .then((res) => {
        if (res.data.voices && res.data.voices.length > 0) {
          setVoicesList(res.data.voices);
        }
      })
      .catch((err) => console.log("Using default voice list"));

    const interval = setInterval(checkHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (backendStatus === "online") {
      loadAvatars();
      loadProjects();
    }
  }, [backendStatus]);


  // -----------------------------------------
  // UPLOAD AVATAR
  // -----------------------------------------
  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API_URL}/avatars`, formData);
      const filename = response.data.filename || file.name;
      const newAvatar = {
        filename,
        url:
          response.data.url ||
          `${API_URL}/uploads/avatars/${encodeURIComponent(filename)}`,
      };

      setSelectedAvatarImage(newAvatar.url);
      setUploadedAvatarName(newAvatar.filename);

      setAvatars((currentAvatars) => {
        const alreadyExists = currentAvatars.some(
          (avatar) => avatar.filename === newAvatar.filename
        );
        if (alreadyExists) {
          return currentAvatars.map((avatar) =>
            avatar.filename === newAvatar.filename ? newAvatar : avatar
          );
        }
        return [...currentAvatars, newAvatar];
      });

      setShowAvatarCreator(false);
      event.target.value = "";
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert("Avatar upload failed. Please verify the backend is running.");
    }
  };

  // -----------------------------------------
  // SELECT AVATAR
  // -----------------------------------------
  const selectAvatar = (avatar) => {
    setSelectedAvatarImage(avatar.url);
    setUploadedAvatarName(avatar.filename);
  };

  // -----------------------------------------
  // DELETE AVATAR
  // -----------------------------------------
  const deleteAvatar = async (avatar) => {
    const confirmed = window.confirm(`Delete "${avatar.filename}"?`);
    if (!confirmed) return;

    try {
      await axios.delete(
        `${API_URL}/avatars/${encodeURIComponent(avatar.filename)}`
      );

      const remainingAvatars = avatars.filter(
        (item) => item.filename !== avatar.filename
      );
      setAvatars(remainingAvatars);

      if (selectedAvatarImage === avatar.url) {
        if (remainingAvatars.length > 0) {
          setSelectedAvatarImage(remainingAvatars[0].url);
          setUploadedAvatarName(remainingAvatars[0].filename);
        } else {
          setSelectedAvatarImage(null);
          setUploadedAvatarName("");
        }
      }
    } catch (error) {
      console.error("Avatar deletion failed:", error);
      alert("Could not delete avatar.");
    }
  };

  // -----------------------------------------
  // PREVIEW VOICE (KOKORO TTS)
  // -----------------------------------------
  const handlePlayVoice = async (voiceName) => {
    if (playingVoice === voiceName && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoice(null);
      return;
    }

    try {
      setPlayingVoice(voiceName);
      const sampleText = `Hello! I'm ${voiceName}. I'm excited to present your video with natural clarity.`;

      const response = await axios.post(`${API_URL}/api/tts`, {
        text: sampleText,
        voice: voiceName,
        speed: 1.0,
      });

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(response.data.audio_url);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingVoice(null);
      };
      audio.onerror = () => {
        setPlayingVoice(null);
      };

      await audio.play();
    } catch (error) {
      console.error("Voice synthesis failed:", error);
      setPlayingVoice(null);
      alert("Voice preview failed. Ensure backend is running.");
    }
  };

  // -----------------------------------------
  // GENERATE SCRIPT WITH AI
  // -----------------------------------------
  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const response = await axios.post(`${API_URL}/api/generate-script`, {
        prompt: script.length < 15 ? "" : script.slice(0, 100),
        category: "welcome",
        tone: "professional",
      });

      if (response.data.script) {
        setScript(response.data.script);
      }
    } catch (error) {
      console.error("Script generation failed:", error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // -----------------------------------------
  // GENERATE VIDEO (FULL PIPELINE: TTS + SADTALKER)
  // -----------------------------------------
  const handleGenerateVideo = async () => {
    if (!uploadedAvatarName) {
      alert("Please select or upload an avatar photo first.");
      setActiveTool("Avatar");
      return;
    }

    if (!script.trim()) {
      alert("Please enter a script for your avatar to speak.");
      setActiveTool("Script");
      return;
    }

    setIsGeneratingVideo(true);
    setGenerationProgress(10);
    setGenerationStage("Step 1/2: Synthesizing voice with Kokoro TTS...");

    // Smooth progress simulation while model computes
    progressIntervalRef.current = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev < 30) return prev + 5;
        if (prev === 30) {
          setGenerationStage("Step 2/2: Animating talking avatar with SadTalker...");
        }
        if (prev < 90) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      const response = await axios.post(
        `${API_URL}/api/generate-video`,
        {
          avatar: uploadedAvatarName,
          script: script.trim(),
          voice: selectedVoice,
          still_mode: true,
        },
        { timeout: 600000 } // 10 min timeout
      );

      clearInterval(progressIntervalRef.current);
      setGenerationProgress(100);
      setGenerationStage("Completed! Loading your AI video...");

      if (response.data.video_url) {
        setGeneratedVideoUrl(response.data.video_url);
        loadProjects();
      }
    } catch (error) {
      clearInterval(progressIntervalRef.current);
      console.error("Video generation failed:", error);
      const detail =
        error.response?.data?.detail || "Video generation encountered an error.";
      alert(`Generation notice: ${detail}`);
    } finally {
      setTimeout(() => {
        setIsGeneratingVideo(false);
        setGenerationProgress(0);
      }, 1000);
    }
  };

  const deleteProjectVideo = async (filename) => {
    if (!window.confirm("Delete this video project?")) return;
    try {
      await axios.delete(`${API_URL}/api/projects/${encodeURIComponent(filename)}`);
      loadProjects();
      if (previewProjectModal?.filename === filename) {
        setPreviewProjectModal(null);
      }
    } catch (err) {
      console.error("Failed to delete video:", err);
    }
  };

  // -----------------------------------------
  // OPEN STUDIO
  // -----------------------------------------
  const openStudio = () => {
    setCurrentPage("studio");
  };

  // -----------------------------------------
  // GET AVATAR POSITION
  // -----------------------------------------
  const getAvatarPositionClass = () => {
    if (selectedPosition === "Left") {
      return "avatar-position-left";
    }
    if (selectedPosition === "Right") {
      return "avatar-position-right";
    }
    return "avatar-position-center";
  };

  // -----------------------------------------
  // DASHBOARD
  // -----------------------------------------
  const renderDashboard = () => {
    return (
      <div className={`app ${darkMode ? "dark-mode" : ""}`}>
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-mark">✦</div>
            <span>AvatarAI</span>
          </div>

          <button className="create-button" onClick={openStudio}>
            <span>+</span>
            Create Video
          </button>

          <nav className="navigation">
            <button
              className={`nav-item ${currentPage === "home" ? "active" : ""}`}
              onClick={() => setCurrentPage("home")}
            >
              <span className="nav-icon">⌂</span>
              Home
            </button>

            <button
              className={`nav-item ${currentPage === "studio" ? "active" : ""}`}
              onClick={openStudio}
            >
              <span className="nav-icon">▣</span>
              Create Video
            </button>

            <button
              className={`nav-item ${currentPage === "avatars" ? "active" : ""}`}
              onClick={() => setCurrentPage("avatars")}
            >
              <span className="nav-icon">◉</span>
              Avatars
            </button>

            <button
              className={`nav-item ${currentPage === "templates" ? "active" : ""}`}
              onClick={() => setCurrentPage("templates")}
            >
              <span className="nav-icon">◇</span>
              Templates
            </button>

            <button
              className={`nav-item ${currentPage === "voices" ? "active" : ""}`}
              onClick={() => setCurrentPage("voices")}
            >
              <span className="nav-icon">♫</span>
              Voices
            </button>

            <button
              className={`nav-item ${currentPage === "assets" ? "active" : ""}`}
              onClick={() => setCurrentPage("assets")}
            >
              <span className="nav-icon">▧</span>
              Assets
            </button>

            <button
              className={`nav-item ${currentPage === "settings" ? "active" : ""}`}
              onClick={() => setCurrentPage("settings")}
            >
              <span className="nav-icon">⚙</span>
              Settings
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="user-card">
              <div className="user-avatar">PA</div>
              <div className="user-info">
                <strong>Palak Agrawal</strong>
                <span>
                  Backend:{" "}
                  {backendStatus === "online"
                    ? "Online (Local AI)"
                    : backendStatus === "checking"
                    ? "Checking..."
                    : "Offline"}
                </span>
              </div>
              <span className="more">•••</span>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <h1>AI Avatar Studio</h1>
              <p>Create talking avatar videos powered by local lightweight AI</p>
            </div>

            <div className="top-actions">
              <button
                className="icon-button theme-toggle"
                onClick={() => setDarkMode((val) => !val)}
              >
                {darkMode ? "☀" : "☾"}
              </button>
              <div className="profile-circle">PA</div>
            </div>
          </header>

          <div className="content">
            <section className="hero">
              <div className="hero-content">
                <div className="hero-badge">✦ 100% LOCAL AI & NEURAL VOICES</div>
                <h2>
                  Create videos with <span>AI avatars</span>
                </h2>
                <p>
                  Turn your ideas into professional videos with lip-sync animation
                  (SadTalker) and natural voices (Kokoro TTS) running privately on
                  your machine.
                </p>
                <button className="hero-button" onClick={openStudio}>
                  Create a video
                  <span>→</span>
                </button>
              </div>

              <div className="hero-preview" onClick={openStudio} style={{ cursor: "pointer" }}>
                <div className="preview-window">
                  <div className="preview-top">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="avatar-preview">
                    {selectedAvatarImage ? (
                      <img
                        src={selectedAvatarImage}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="avatar-head">
                        <div className="face"></div>
                        <div className="hair"></div>
                      </div>
                    )}
                    <button className="play-button">▶</button>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="section-header">
                <div>
                  <h3>Quick create</h3>
                </div>
              </div>

              <div className="quick-grid">
                <button className="quick-card" onClick={openStudio}>
                  <div className="quick-icon purple">✦</div>
                  <div>
                    <strong>AI Avatar Video</strong>
                    <span>Create talking avatar with voice</span>
                  </div>
                </button>

                <button
                  className="quick-card"
                  onClick={() => {
                    setShowAvatarCreator(true);
                  }}
                >
                  <div className="quick-icon blue">◉</div>
                  <div>
                    <strong>Upload Photo Avatar</strong>
                    <span>Use any portrait photo</span>
                  </div>
                </button>

                <button
                  className="quick-card"
                  onClick={() => {
                    setCurrentPage("voices");
                  }}
                >
                  <div className="quick-icon orange">♫</div>
                  <div>
                    <strong>AI Voices (Kokoro)</strong>
                    <span>Preview Sofia, James & Emma</span>
                  </div>
                </button>
              </div>
            </section>

            <section>
              <div className="projects-header">
                <div>
                  <h3>Recent projects {projects.length > 0 && `(${projects.length})`}</h3>
                </div>
                <button className="view-all" onClick={openStudio}>
                  Open Studio →
                </button>
              </div>

              <div className="projects-grid">
                {projects.length > 0 ? (
                  projects.map((proj) => (
                    <div key={proj.filename} className="project-card">
                      <div
                        className="project-thumbnail"
                        onClick={() => setPreviewProjectModal(proj)}
                        style={{ cursor: "pointer", background: "#1b1b22" }}
                      >
                        <video
                          src={proj.url}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          muted
                          playsInline
                          onMouseOver={(e) => e.target.play().catch(() => {})}
                          onMouseOut={(e) => {
                            e.target.pause();
                            e.target.currentTime = 0;
                          }}
                        />
                        <button className="thumbnail-play">▶</button>
                      </div>
                      <div className="project-details">
                        <div>
                          <strong>{proj.filename.slice(0, 20)}</strong>
                          <p>{proj.size_mb} MB · Generated locally</p>
                        </div>
                        <button
                          className="project-menu"
                          onClick={() => deleteProjectVideo(proj.filename)}
                          title="Delete Video"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-projects-card">
                    <p>No generated videos yet.</p>
                    <button className="create-video-small" onClick={openStudio}>
                      + Create your first video in Studio
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  };

  // -----------------------------------------
  // STUDIO
  // -----------------------------------------
  const renderStudio = () => {
    return (
      <main className={`studio ${darkMode ? "dark-mode" : ""}`}>
        <header className="studio-topbar">
          <div className="studio-left">
            <button className="back-button" onClick={() => setCurrentPage("home")}>
              ←
            </button>
            <div className="studio-title">
              <strong className="project-name">AI Avatar Video Studio</strong>
              <span>
                {backendStatus === "online" ? "🟢 Backend Ready" : "🔴 Backend Offline"}
              </span>
            </div>
          </div>

          <div className="studio-actions">
            {generatedVideoUrl && (
              <a
                href={generatedVideoUrl}
                download="avatar_video.mp4"
                className="studio-button download-link-btn"
                target="_blank"
                rel="noreferrer"
              >
                ⬇ Download Video
              </a>
            )}

            <button
              className={`generate-button ${isGeneratingVideo ? "generating" : ""}`}
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo}
            >
              {isGeneratingVideo ? "Generating Video..." : "✦ Generate Video"}
            </button>
          </div>
        </header>

        <div className="studio-body">
          {/* SCENES */}
          <aside className="scenes-panel">
            <div className="panel-heading">
              <strong>Scenes</strong>
              <span>1 Scene</span>
            </div>

            <div className="scene-list">
              <div className="scene-card selected">
                <div className="scene-number">1</div>
                <div className="scene-thumbnail">
                  {selectedAvatarImage ? (
                    <img
                      src={selectedAvatarImage}
                      alt="Scene"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="scene-avatar"></div>
                  )}
                </div>
                <span>Main Scene</span>
              </div>
            </div>
          </aside>

          {/* CENTER CANVAS */}
          <section className="studio-canvas-area">
            <div className="canvas-toolbar">
              <div className="canvas-controls">
                <span>Avatar: {uploadedAvatarName || "None"}</span>
              </div>
              <div>
                <span>Voice: {selectedVoice}</span>
              </div>
              <div className="canvas-controls">
                <span>Pos: {selectedPosition}</span>
              </div>
            </div>

            <div className="video-canvas">
              <div className="canvas-content">
                {/* GENERATING OVERLAY */}
                {isGeneratingVideo && (
                  <div className="generating-overlay">
                    <div className="spinner"></div>
                    <h3>Generating Talking Avatar</h3>
                    <p>{generationStage}</p>
                    <div className="progress-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>
                    <span className="m4-badge">
                      ⚡ Local AI Engine · Neural TTS + SadTalker
                    </span>
                  </div>
                )}

                {/* SHOW GENERATED VIDEO */}
                {generatedVideoUrl ? (
                  <div className="video-player-wrapper">
                    <video
                      key={generatedVideoUrl}
                      className={`studio-rendered-video ${getAvatarPositionClass()}`}
                      src={generatedVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                    />
                  </div>
                ) : selectedAvatarImage ? (
                  <img
                    className={`studio-avatar ${getAvatarPositionClass()}`}
                    src={selectedAvatarImage}
                    alt={uploadedAvatarName || "Selected Avatar"}
                  />
                ) : (
                  <div
                    className={`studio-avatar placeholder-avatar ${getAvatarPositionClass()}`}
                  >
                    <div className="studio-hair"></div>
                    <div className="studio-face">
                      <div className="studio-eyes">
                        <i></i>
                        <i></i>
                      </div>
                      <div className="studio-mouth"></div>
                    </div>
                    <div className="studio-body"></div>
                  </div>
                )}

                {!selectedAvatarImage && !generatedVideoUrl && !isGeneratingVideo && (
                  <div className="canvas-text">
                    <span>Select an avatar from the right to begin</span>
                  </div>
                )}
              </div>
            </div>

            {/* TIMELINE */}
            <div className="timeline">
              <div className="timeline-header">
                <span>00:00</span>
                <span>00:15</span>
                <span>00:30</span>
              </div>

              <div className="timeline-track">
                <div className="playhead"></div>
                <div className="timeline-block avatar-track">
                  Avatar: {uploadedAvatarName ? uploadedAvatarName.slice(0, 15) : "Default"}
                </div>
                <div className="timeline-block audio-track">
                  Voice: {selectedVoice} (Kokoro TTS)
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT TOOLS */}
          <aside className="tools-panel">
            <div className="tools-tabs">
              {["Avatar", "Script", "Voice", "AI Tools"].map((tool) => (
                <button
                  key={tool}
                  className={`tool-tab ${activeTool === tool ? "active" : ""}`}
                  onClick={() => setActiveTool(tool)}
                >
                  <span>
                    {tool === "Avatar"
                      ? "◉"
                      : tool === "Script"
                      ? "☷"
                      : tool === "Voice"
                      ? "♫"
                      : "✦"}
                  </span>
                  {tool}
                </button>
              ))}
            </div>

            <div className="tool-content">
              {/* AVATAR TOOL */}
              {activeTool === "Avatar" && (
                <>
                  <div className="tool-title">
                    <h3>Avatar</h3>
                    <p>Choose or upload your AI avatar portrait.</p>
                  </div>

                  <button
                    className="upload-avatar"
                    onClick={() => setShowAvatarCreator(true)}
                  >
                    <span>+</span>
                    Upload new photo
                  </button>

                  <div className="setting-section">
                    <strong>Your Avatars ({avatars.length})</strong>
                  </div>

                  <div className="avatar-grid">
                    {avatars.map((avatar) => (
                      <div
                        key={avatar.filename}
                        className={`avatar-option ${
                          selectedAvatarImage === avatar.url ? "selected-avatar" : ""
                        }`}
                      >
                        <div
                          className="avatar-select-area"
                          onClick={() => selectAvatar(avatar)}
                        >
                          <div className="avatar-photo">
                            <img src={avatar.url} alt={avatar.filename} />
                          </div>
                          <span>
                            {avatar.filename.length > 14
                              ? avatar.filename.slice(0, 14) + "..."
                              : avatar.filename}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="delete-avatar-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAvatar(avatar);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="avatar-option add-avatar-option"
                      onClick={() => setShowAvatarCreator(true)}
                    >
                      <div className="avatar-photo add-avatar-photo">+</div>
                      <span>Add Avatar</span>
                    </button>
                  </div>

                  <div className="setting-section">
                    <strong>Position</strong>
                    <div className="position-buttons">
                      {["Left", "Center", "Right"].map((pos) => (
                        <button
                          key={pos}
                          className={selectedPosition === pos ? "selected-position" : ""}
                          onClick={() => setSelectedPosition(pos)}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="setting-section" style={{ marginTop: "16px", padding: "14px", background: "rgba(99, 102, 241, 0.08)", borderRadius: "10px", border: "1px solid rgba(99, 102, 241, 0.25)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "13px", color: "var(--accent-color, #6366f1)" }}>✍️ Script / Words to Speak:</strong>
                      <span style={{ fontSize: "11px", opacity: 0.7 }}>
                        {script.trim() ? script.trim().split(/\s+/).length : 0} words
                      </span>
                    </div>
                    <textarea
                      className="script-box"
                      style={{ minHeight: "85px", fontSize: "13px", width: "100%", borderRadius: "6px", resize: "vertical" }}
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="Type what you want the avatar to speak here..."
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                      <button
                        type="button"
                        style={{ fontSize: "11px", background: "transparent", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 600 }}
                        onClick={() => setActiveTool("Voice")}
                      >
                        Voice: {selectedVoice} (Change ➔)
                      </button>
                      <button
                        type="button"
                        style={{ fontSize: "11px", background: "transparent", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 600 }}
                        onClick={() => setActiveTool("Script")}
                      >
                        Open Full Script Editor ➔
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* SCRIPT TOOL */}
              {activeTool === "Script" && (
                <>
                  <div className="tool-title">
                    <h3>Script</h3>
                    <p>Write what your avatar should speak.</p>
                  </div>

                  <textarea
                    className="script-box"
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Enter your script here..."
                    rows={6}
                  />

                  <button
                    className="ai-script-button"
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                  >
                    {isGeneratingScript ? "✦ Writing Script..." : "✦ Generate with AI"}
                  </button>

                  <div className="word-count">
                    {script.trim() ? script.trim().split(/\s+/).length : 0} words · ~
                    {Math.round(
                      ((script.trim() ? script.trim().split(/\s+/).length : 0) / 150) *
                        60
                    )}{" "}
                    sec audio
                  </div>
                </>
              )}

              {/* VOICE TOOL */}
              {activeTool === "Voice" && (
                <>
                  <div className="tool-title">
                    <h3>AI Voices (Ultra-Realistic Neural & Local)</h3>
                    <p>Click ▶ to test the live voice synthesis.</p>
                  </div>

                  {voicesList.map((voice) => (
                    <div
                      key={voice.name}
                      className={`voice-option ${
                        selectedVoice === voice.name ? "selected-voice" : ""
                      }`}
                      onClick={() => setSelectedVoice(voice.name)}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{voice.name}</strong>
                        <span>{voice.description || `${voice.language} · ${voice.style}`}</span>
                      </div>

                      <button
                        type="button"
                        className={`voice-play ${
                          playingVoice === voice.name ? "playing" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVoice(voice.name);
                        }}
                        title={`Preview ${voice.name}'s voice`}
                      >
                        {playingVoice === voice.name ? "❚❚" : "▶"}
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* AI TOOLS */}
              {activeTool === "AI Tools" && (
                <>
                  <div className="tool-title">
                    <h3>AI Tools</h3>
                    <p>Local AI utilities & neural generation models.</p>
                  </div>

                  <div
                    className="ai-tool-card"
                    onClick={handleGenerateScript}
                    style={{ cursor: "pointer" }}
                  >
                    <strong>✦ AI Script Writer</strong>
                    <span>Click to auto-generate a fresh, engaging script</span>
                  </div>

                  <div
                    className="ai-tool-card"
                    onClick={() => setActiveTool("Voice")}
                    style={{ cursor: "pointer" }}
                  >
                    <strong>♫ Kokoro TTS (82M)</strong>
                    <span>Millisecond-latency voice synthesis</span>
                  </div>

                  <div
                    className="ai-tool-card"
                    onClick={handleGenerateVideo}
                    style={{ cursor: "pointer" }}
                  >
                    <strong>🎬 SadTalker Lip-Sync</strong>
                    <span>Generate talking video from portrait + audio</span>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
    );
  };

  // -----------------------------------------
  // AVATARS PAGE
  // -----------------------------------------
  const renderAvatarsPage = () => {
    return (
      <div className={`app ${darkMode ? "dark-mode" : ""}`}>
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-mark">✦</div>
            <span>AvatarAI</span>
          </div>

          <button className="create-button" onClick={openStudio}>
            <span>+</span>
            Create Video
          </button>

          <nav className="navigation">
            <button className="nav-item" onClick={() => setCurrentPage("home")}>
              <span className="nav-icon">⌂</span>
              Home
            </button>
            <button className="nav-item" onClick={openStudio}>
              <span className="nav-icon">▣</span>
              Create Video
            </button>
            <button className="nav-item active" onClick={() => setCurrentPage("avatars")}>
              <span className="nav-icon">◉</span>
              Avatars
            </button>
            <button className="nav-item" onClick={() => setCurrentPage("voices")}>
              <span className="nav-icon">♫</span>
              Voices
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <h1>Avatars Gallery</h1>
              <p>Manage and pick portraits for your talking avatar videos</p>
            </div>
            <div className="top-actions">
              <button
                className="icon-button theme-toggle"
                onClick={() => setDarkMode((val) => !val)}
              >
                {darkMode ? "☀" : "☾"}
              </button>
            </div>
          </header>

          <div className="content">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3>Available Avatars ({avatars.length})</h3>
              <button
                className="hero-button"
                onClick={() => setShowAvatarCreator(true)}
              >
                + Upload New Avatar
              </button>
            </div>

            <div className="avatar-page-grid">
              {avatars.map((av) => (
                <div key={av.filename} className="avatar-page-card">
                  <img src={av.url} alt={av.filename} className="avatar-page-img" />
                  <div className="avatar-page-info">
                    <strong>{av.filename}</strong>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button
                        className="studio-button"
                        onClick={() => {
                          selectAvatar(av);
                          openStudio();
                        }}
                      >
                        Use in Studio
                      </button>
                      <button
                        className="studio-button"
                        style={{ color: "#e53e3e" }}
                        onClick={() => deleteAvatar(av)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  };

  // -----------------------------------------
  // VOICES PAGE
  // -----------------------------------------
  const renderVoicesPage = () => {
    return (
      <div className={`app ${darkMode ? "dark-mode" : ""}`}>
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-mark">✦</div>
            <span>AvatarAI</span>
          </div>

          <button className="create-button" onClick={openStudio}>
            <span>+</span>
            Create Video
          </button>

          <nav className="navigation">
            <button className="nav-item" onClick={() => setCurrentPage("home")}>
              <span className="nav-icon">⌂</span>
              Home
            </button>
            <button className="nav-item" onClick={openStudio}>
              <span className="nav-icon">▣</span>
              Create Video
            </button>
            <button className="nav-item" onClick={() => setCurrentPage("avatars")}>
              <span className="nav-icon">◉</span>
              Avatars
            </button>
            <button className="nav-item active" onClick={() => setCurrentPage("voices")}>
              <span className="nav-icon">♫</span>
              Voices
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <h1>AI Voices (Neural & Local TTS)</h1>
              <p>Studio-quality neural voices and lightweight local synthesis</p>
            </div>
            <div className="top-actions">
              <button
                className="icon-button theme-toggle"
                onClick={() => setDarkMode((val) => !val)}
              >
                {darkMode ? "☀" : "☾"}
              </button>
            </div>
          </header>

          <div className="content">
            <div className="voices-page-grid">
              {voicesList.map((v) => (
                <div key={v.name} className="voice-page-card">
                  <div className="voice-page-header">
                    <div>
                      <h3>{v.name}</h3>
                      <span className="voice-badge">
                        {v.language || "English"} · {v.style || "Natural"}
                      </span>
                    </div>
                    <button
                      className={`voice-play-large ${
                        playingVoice === v.name ? "playing" : ""
                      }`}
                      onClick={() => handlePlayVoice(v.name)}
                    >
                      {playingVoice === v.name ? "❚❚ Pause" : "▶ Play Voice"}
                    </button>
                  </div>
                  <p>{v.description}</p>
                  <button
                    className="hero-button"
                    style={{ marginTop: 15 }}
                    onClick={() => {
                      setSelectedVoice(v.name);
                      openStudio();
                    }}
                  >
                    Select & Open Studio
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  };

  // -----------------------------------------
  // AVATAR CREATOR MODAL
  // -----------------------------------------
  const renderAvatarModal = () => {
    if (!showAvatarCreator) return null;

    return (
      <div
        className="avatar-modal-overlay"
        onClick={() => setShowAvatarCreator(false)}
      >
        <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
          <div className="avatar-modal-header">
            <div>
              <h2>Add an Avatar</h2>
              <p>Upload a clear face portrait to generate talking avatar videos.</p>
            </div>
            <button
              className="avatar-modal-close"
              onClick={() => setShowAvatarCreator(false)}
            >
              ×
            </button>
          </div>

          <div className="avatar-creator-options">
            <label className="avatar-creator-card" style={{ cursor: "pointer" }}>
              <div className="creator-icon">↑</div>
              <strong>Upload a Photo</strong>
              <span>JPG or PNG portrait facing forward works best</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
            </label>
          </div>

          <div className="avatar-modal-footer">
            <button
              className="modal-cancel"
              onClick={() => setShowAvatarCreator(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------
  // PREVIEW PROJECT MODAL
  // -----------------------------------------
  const renderProjectModal = () => {
    if (!previewProjectModal) return null;

    return (
      <div
        className="avatar-modal-overlay"
        onClick={() => setPreviewProjectModal(null)}
      >
        <div
          className="avatar-modal project-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="avatar-modal-header">
            <div>
              <h2>{previewProjectModal.filename}</h2>
              <p>Generated talking avatar video ({previewProjectModal.size_mb} MB)</p>
            </div>
            <button
              className="avatar-modal-close"
              onClick={() => setPreviewProjectModal(null)}
            >
              ×
            </button>
          </div>

          <div style={{ padding: 20 }}>
            <video
              src={previewProjectModal.url}
              controls
              autoPlay
              style={{ width: "100%", maxHeight: "60vh", borderRadius: 8 }}
            />
          </div>

          <div className="avatar-modal-footer" style={{ gap: 10 }}>
            <a
              href={previewProjectModal.url}
              download={previewProjectModal.filename}
              className="studio-button download-link-btn"
              target="_blank"
              rel="noreferrer"
            >
              ⬇ Download Video
            </a>
            <button
              className="modal-cancel"
              onClick={() => setPreviewProjectModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------
  // MAIN RETURN
  // -----------------------------------------
  return (
    <>
      {currentPage === "home" && renderDashboard()}
      {currentPage === "studio" && renderStudio()}
      {currentPage === "avatars" && renderAvatarsPage()}
      {currentPage === "voices" && renderVoicesPage()}
      {[
        "templates",
        "assets",
        "settings",
      ].includes(currentPage) && renderDashboard()}

      {renderAvatarModal()}
      {renderProjectModal()}
    </>
  );
}

export default App;