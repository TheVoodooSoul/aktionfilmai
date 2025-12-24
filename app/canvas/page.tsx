'use client';

import dynamic from 'next/dynamic';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import DrawingCanvas from '@/components/DrawingCanvas';
import NodeCard from '@/components/NodeCard';
import AddNodeMenu from '@/components/AddNodeMenu';
import NodeConnections from '@/components/NodeConnections';
import EpicScenePanel from '@/components/EpicScenePanel';
import { CanvasNode as NodeType } from '@/lib/types';
import { Sparkles, User, Layers, Home, Settings, Link2, Plus, Upload, Wand2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { resolveMentions, AvatarReference } from '@/lib/avatar-mentions';

export default function CanvasPage() {
  const { canvas, setCanvas, addNode, updateNode, deleteNode, credits, setCredits, user, setUser } = useStore();
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [characterRefs, setCharacterRefs] = useState<any[]>([]);
  const [faces, setFaces] = useState<Array<{ _id: string; face_url: string }>>([]);
  const [trainedAvatars, setTrainedAvatars] = useState<AvatarReference[]>([]);
  const [environment, setEnvironment] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [showCharacterGen, setShowCharacterGen] = useState<number | null>(null);
  const [characterPrompt, setCharacterPrompt] = useState('');
  const [linkingMode, setLinkingMode] = useState(false);
  const [linkSourceNode, setLinkSourceNode] = useState<string | null>(null);
  // Reference linking state (purple ports)
  const [refLinkingMode, setRefLinkingMode] = useState(false);
  const [refLinkSourceNode, setRefLinkSourceNode] = useState<string | null>(null);
  // Audio linking state (green ports)
  const [audioLinkingMode, setAudioLinkingMode] = useState(false);
  const [audioLinkSourceNode, setAudioLinkSourceNode] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [modalSize, setModalSize] = useState({ width: 1200, height: 700 });
  const [isResizing, setIsResizing] = useState(false);
  const [upscalingNodeId, setUpscalingNodeId] = useState<string | null>(null);
  const [klingGeneratingNodeId, setKlingGeneratingNodeId] = useState<string | null>(null);
  const [magicPromptLoadingNodeId, setMagicPromptLoadingNodeId] = useState<string | null>(null);
  const [loadImageTargetNodeId, setLoadImageTargetNodeId] = useState<string | null>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const nodeImageUploadRef = useRef<HTMLInputElement>(null);

  // Wire dragging state for visual feedback
  const [draggingWire, setDraggingWire] = useState<{
    type: 'ref' | 'seq' | 'audio';
    sourceNodeId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Set mounted state for hydration safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize super admin user and test credits
  useEffect(() => {
    if (!isMounted) return;
    
    // Auto-login super admin if no user exists
    if (!user) {
      const superAdmin = {
        id: '00000000-0000-0000-0000-000000000001', // Valid UUID for super admin
        email: 'adam@egopandacreative.com',
        username: 'ArnoldStallone82',
        pin: '4313',
        role: 'superadmin',
      };
      setUser(superAdmin);

      // Store in localStorage for persistence
      localStorage.setItem('aktionfilm_user', JSON.stringify(superAdmin));
    }

    if (credits === 0) {
      setCredits(9999); // Give unlimited credits for super admin
    }
  }, [credits, user, isMounted]); // Zustand setters are stable and don't need to be in deps

  // Load character references
  useEffect(() => {
    if (!isMounted) return;

    const loadCharacterRefs = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('character_references')
        .select('*')
        .eq('user_id', user.id)
        .limit(2);
      if (data) setCharacterRefs(data);
    };
    loadCharacterRefs();
  }, [user, isMounted]);

  // Load faces from A2E Face Library
  useEffect(() => {
    if (!isMounted || !user) return;

    const loadFaces = async () => {
      try {
        const response = await fetch('/api/a2e/faces/list');
        const data = await response.json();
        if (data.faces) {
          setFaces(data.faces);
        }
      } catch (error) {
        console.error('Failed to load faces:', error);
      }
    };
    loadFaces();
  }, [user, isMounted]);

  // Load trained avatars for @mention resolution
  useEffect(() => {
    if (!isMounted) return;

    const loadAvatars = async () => {
      try {
        const response = await fetch('/api/a2e/list-avatars');
        const data = await response.json();
        if (data.trained) {
          // Map trained avatars to AvatarReference format
          const avatarRefs: AvatarReference[] = data.trained.map((t: any) => ({
            id: t._id,
            name: t.name,
            type: 'custom',
            image_url: t.image_url,
          }));
          setTrainedAvatars(avatarRefs);
          console.log('Loaded trained avatars for @mentions:', avatarRefs.length);
        }
      } catch (error) {
        console.error('Failed to load avatars:', error);
      }
    };
    loadAvatars();
  }, [isMounted]);

  // Create new node based on type
  const createNewNode = (type: 'scene' | 'sketch' | 'i2i' | 't2i' | 'i2v' | 'v2v' | 't2v' | 'text2video' | 'lipsync' | 'talking-photo' | 'face-swap' | 'action-pose' | 'coherent-scene' | 'wan-i2v' | 'wan-vace' | 'wan-first-last' | 'wan-animate' | 'wan-fast' | 'wan-t2v' | 'nanobanana') => {
    const newNode: NodeType = {
      id: uuidv4(),
      type,
      x: Math.random() * 400 + 200,
      y: Math.random() * 200 + 150,
      width: 400,
      height: 300,
      aspectRatio: '16:9', // Default to landscape
      prompt: '',
      coherentImages: type === 'coherent-scene' ? [] : undefined,
      settings: {
        creativity: 0.7,
        characterRefs: characterRefs.map(ref => ref.id),
        actionType: type === 'action-pose' ? 'punch' : undefined,
      },
    };
    addNode(newNode);

    // Open drawing modal for sketch and action-pose types
    if (type === 'sketch' || type === 'action-pose') {
      setCurrentNodeId(newNode.id);
      setShowDrawingModal(true);
    }
  };

  // ControlNet mode type for sketch/action-pose nodes
  type ControlNetMode = 'img2img' | 'scribble' | 'canny' | 'openpose';

  // Save sketch from drawing canvas
  const handleSaveSketch = async (imageData: string, prompt?: string, autoGenerate: boolean = false, controlnetMode?: ControlNetMode) => {
    if (currentNodeId) {
      // Get current node to preserve existing settings
      const currentNode = canvas.nodes.find(n => n.id === currentNodeId);

      // First update the node with the image data and controlnet mode
      updateNode(currentNodeId, {
        imageData,
        ...(prompt && { prompt }), // Save prompt if provided
        settings: {
          ...currentNode?.settings,
          ...(controlnetMode && { controlnetMode }), // Save controlnet mode
        },
      });
      
      // Close the modal
      setShowDrawingModal(false);
      
      // Store the nodeId for generation
      const nodeIdToGenerate = currentNodeId;
      setCurrentNodeId(null);
      
      // Auto-generate if requested
      if (autoGenerate) {
        // Directly call generate after a short delay for modal to close
        setTimeout(() => {
          handleGenerateWithImageData(nodeIdToGenerate, imageData, prompt);
        }, 100);
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/87d64ab3-42cf-46a6-ad0d-43caa4bcb44c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
          location: 'app/canvas/page.tsx:handleSaveSketch',
          message: 'Saved sketch from canvas',
          data: {
            nodeId: nodeIdToGenerate,
            hasImageData: !!imageData,
            promptLength: (prompt || '').length,
            autoGenerate
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
    }
  };

  // Save output to database if user opted in to data sharing
  const saveOutputToDatabase = async (nodeId: string, outputUrl: string, outputType: 'image' | 'video') => {
    if (!user) return;

    try {
      const node = canvas.nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Prepare character references if used
      const characterReferences = node.settings?.characterRefs
        ? characterRefs
            .filter(ref => node.settings!.characterRefs!.includes(ref.id))
            .map(ref => ({
              id: ref.id,
              name: ref.name,
              outfit: ref.outfit,
            }))
        : null;

      // Call the training data storage API (checks opt-in status)
      const response = await fetch('/api/training-data/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          outputUrl,
          outputType,
          nodeType: node.type,
          prompt: node.prompt || null,
          settings: node.settings || null,
          characterRefs: characterReferences,
          inputImageUrl: node.imageData || null,
          inputImages: node.coherentImages || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('✓ Training data stored:', result.id);
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.error('Error saving training data:', error);
    }
  };

  // Process prompt to replace @ tags with character names + outfits
  const processPrompt = (prompt: string): string => {
    if (!prompt) return '';

    let processedPrompt = prompt;
    characterRefs.forEach(ref => {
      if (ref.name) {
        const tag = ref.name; // e.g., "@adam"
        const fullDescription = ref.outfit
          ? `${tag.replace('@', '')} wearing ${ref.outfit}`
          : tag.replace('@', '');

        // Replace all instances of the tag
        const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        processedPrompt = processedPrompt.replace(regex, fullDescription);
      }
    });

    return processedPrompt;
  };

  // Helper function to generate with provided image data
  const handleGenerateWithImageData = async (nodeId: string, providedImageData?: string, providedPrompt?: string) => {
    console.log('HANDLEGENERATE WITH IMAGE DATA:', nodeId, !!providedImageData);
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.log('NO NODE FOUND - RETURNING');
      return;
    }
    
    // Use provided data if available, otherwise use node's data
    const actualImageData = providedImageData || node.imageData;
    const actualPrompt = providedPrompt || node.prompt;
    
    // Call the main generate function with the updated node
    const updatedNode = { ...node, imageData: actualImageData, prompt: actualPrompt };
    await handleGenerateInternal(updatedNode, nodeId);
  };
  
  // Main generate function
  const handleGenerate = async (nodeId: string) => {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.log('NO NODE FOUND - RETURNING');
      return;
    }
    await handleGenerateInternal(node, nodeId);
  };
  
  // Internal generate logic
  const handleGenerateInternal = async (node: any, nodeId: string) => {
    console.log('HANDLEGENERATE INTERNAL - NODE:', node.type, 'HAS IMAGE:', !!node.imageData)

    // Credit costs per node type (based on actual API costs)
    const creditCosts: Record<string, number> = {
      // Images
      'character': 2,  // A2E text-to-image
      'sketch': 1,  // Replicate ControlNet
      'i2i': 2,  // A2E character generation
      't2i': 2,  // A2E text-to-image
      // A2E Video
      'scene': 3,
      'i2v': 100,  // A2E image-to-video (5sec 720p, ~10min processing)
      'v2v': 120,  // A2E video-to-video
      't2v': 50,  // A2E talking portrait
      'nanobanana': 3,  // A2E multi-character
      'lipsync': 3,  // A2E lipsync
      'talking-photo': 5,  // A2E talking photo
      'face-swap': 5,  // A2E face swap
      // Wan Direct (Replicate)
      'wan-i2v': 80,  // Wan 2.5 i2v
      'wan-t2v': 40,  // Wan text-to-video
      'wan-fast': 30,  // Wan 2.2 fast
      'wan-first-last': 60,  // Wan frame interpolation
      'wan-animate': 70,  // Wan animation
      'wan-vace': 50,  // Wan VACE
      // Text to video
      'text2video': 80,  // A2E text-to-video
      // Scenes
      'action-pose': 2,
      'coherent-scene': 10,
      'image': 0,
      'video': 0,
    };

    const requiredCredits = creditCosts[node.type] || 5;
    if (credits < requiredCredits) {
      alert(`Insufficient credits! You need ${requiredCredits} credits for ${node.type}.`);
      return;
    }

    setIsLoading(true);
    try {
      // Process prompt to include character outfit information
      const processedPrompt = processPrompt(node.prompt || '');
      console.log('GENERATE - Node prompt:', node.prompt, 'Processed:', processedPrompt);

      let endpoint = '';
      let body: any = {
        userId: user?.id,
        prompt: processedPrompt,
      };

      // Handle file uploads for character node
      if (node.type === 'character' && (node as any).uploadedFile) {
        const file = (node as any).uploadedFile;
        const fileType = (node as any).uploadedFileType;

        // Upload to Supabase storage
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('character-uploads')
          .upload(fileName, file);

        if (uploadError) {
          alert('Failed to upload file: ' + uploadError.message);
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('character-uploads')
          .getPublicUrl(fileName);

        // Add to body for avatar training
        if (fileType === 'video') {
          body.uploadedVideo = publicUrl;
        } else {
          body.uploadedImage = publicUrl;
        }
      }

      // Route to appropriate API based on node type
      console.log('NODE TYPE:', node.type);
      switch (node.type) {
        case 'character':
          endpoint = '/api/a2e/character';
          body.referenceImage = node.imageData;
          break;

        case 'scene':
          console.log('HIT SCENE CASE - ROUTING TO A2E NANOBANANA');
          endpoint = '/api/a2e/nanobanana';
          // Include character references
          if (node.settings?.characterRefs && node.settings.characterRefs.length > 0) {
            const selectedCharRefs = characterRefs.filter(ref =>
              node.settings!.characterRefs!.includes(ref.id)
            );
            body.characterRefs = selectedCharRefs;
          } else {
            // Use all available character refs
            body.characterRefs = characterRefs;
          }
          // Build prompt with action type and environment
          const actionType = node.settings?.actionType || 'fight';
          const envPrompt = environment !== 'none' ? ` in ${environment}` : '';
          body.prompt = `${processedPrompt || actionType + ' scene'}${envPrompt}, cinematic action, dynamic composition, high quality`;
          break;

        case 'action-pose':
          // Check controlnet mode - default to openpose for action poses
          const actionControlnetMode = node.settings?.controlnetMode || 'openpose';
          console.log('ACTION-POSE - Using mode:', actionControlnetMode);

          // Check if action pose has been drawn
          if (!node.imageData) {
            alert('Please draw your action pose first before generating!');
            setIsLoading(false);
            return;
          }

          // Use appropriate endpoint based on mode
          if (actionControlnetMode === 'img2img') {
            endpoint = '/api/fal/action-lora';
            body.image = node.imageData;
            body.actionType = node.settings?.actionType || 'punch';
          } else {
            // Use ControlNet API for scribble, canny, openpose
            endpoint = '/api/modelslab/controlnet';
            body.image = node.imageData;
            body.mode = actionControlnetMode;
            body.creativity = node.settings?.creativity || 0.7;
          }
          break;

        case 'sketch':
          // Check controlnet mode - default to img2img
          const sketchControlnetMode = node.settings?.controlnetMode || 'img2img';
          console.log('SKETCH - Using mode:', sketchControlnetMode);

          // Check if sketch has been drawn
          if (!node.imageData) {
            alert('Please draw your sketch first before generating!');
            setIsLoading(false);
            return;
          }

          // Use appropriate endpoint based on mode
          if (sketchControlnetMode === 'img2img') {
            endpoint = '/api/replicate/sketch-to-image';
            body.image = node.imageData;
            body.creativity = node.settings?.creativity || 0.7;
          } else {
            // Use ControlNet API for scribble, canny, openpose
            endpoint = '/api/modelslab/controlnet';
            body.image = node.imageData;
            body.mode = sketchControlnetMode;
            body.creativity = node.settings?.creativity || 0.7;
          }

          // Include character references if selected
          if (node.settings?.characterRefs && node.settings.characterRefs.length > 0) {
            const selectedCharRefs = characterRefs.filter(ref =>
              node.settings!.characterRefs!.includes(ref.id)
            );
            // Build character info array with names and outfits
            body.characterInfo = selectedCharRefs.map(ref => ({
              name: ref.name,
              outfit: (ref as any).outfit || 'action outfit'
            }));
          }
          break;
          
        case 'i2i':
          // Image to Image uses A2E for consistency
          console.log('I2I - Using A2E character generation');
          
          // Check if image has been uploaded or drawn
          if (!node.imageData && !node.imageUrl) {
            alert('Please upload or draw an image first!');
            setIsLoading(false);
            return;
          }
          
          endpoint = '/api/a2e/character';
          body.image = node.imageUrl || node.imageData;
          body.creativity = node.settings?.creativity || 0.7;
          break;

        case 't2i':
          // Use A2E for consistent character generation
          endpoint = '/api/a2e/character';
          body.prompt = processedPrompt;
          body.creativity = node.settings?.creativity || 0.7;
          break;

        case 'i2v':
          // Image to Video - A2E
          console.log('I2V - Using A2E image to video');
          endpoint = '/api/a2e/i2v';
          body.imageUrl = node.imageUrl || node.imageData;
          body.prompt = processedPrompt || 'cinematic action scene, dynamic movement, high quality';
          break;

        case 'lipsync':
          // Lipsync - A2E (uses talkingPhoto API)
          console.log('LIPSYNC - Using A2E lipsync');
          endpoint = '/api/a2e/lipsync';
          body.imageUrl = node.imageUrl || node.imageData;
          body.text = node.dialogue || prompt || 'Action hero speech';
          break;
          
        case 'face-swap':
          // Face Swap - A2E
          console.log('FACE SWAP - Using A2E face swap');
          endpoint = '/api/a2e/face-swap';
          // faceUrl: the face image to swap in (from imageData or faceImageUrl)
          // videoUrl: the target video to swap face onto
          body.faceUrl = node.faceImageUrl || node.imageData;
          body.videoUrl = node.targetVideoUrl || node.videoUrl;
          body.name = `Face Swap - ${new Date().toISOString()}`;
          break;
          
        case 'talking-photo':
          // Talking Photo - A2E
          console.log('TALKING PHOTO - Using A2E talking photo');
          endpoint = '/api/a2e/talking-photo';
          body.imageUrl = node.imageUrl || node.imageData;
          body.audioUrl = node.audioUrl; // Audio URL if available
          body.prompt = node.dialogue || node.prompt || 'speaking person looking at camera';
          break;

        case 't2v':
          // Text to Video (Talking Portrait) - A2E
          console.log('T2V - Using A2E talking portrait');
          endpoint = '/api/a2e/t2v';
          body.text = node.dialogue || node.prompt || 'Action hero speech';

          // Check for @mention in prompt/dialogue to resolve avatar
          const t2vText = node.dialogue || node.prompt || '';
          const { firstAvatar, unresolvedMentions } = resolveMentions(t2vText, trainedAvatars);

          if (unresolvedMentions.length > 0) {
            alert(`Unknown avatar: @${unresolvedMentions[0]}. Check your trained avatars.`);
            setIsLoading(false);
            return;
          }

          // Priority: @mention > node.avatarId > prompt-based generation
          if (firstAvatar) {
            body.avatarId = firstAvatar.id;
            console.log(`Resolved @${firstAvatar.name} to avatar ID: ${firstAvatar.id}`);
          } else if ((node as any).avatarId) {
            body.avatarId = (node as any).avatarId;
          } else {
            // T2V requires an avatar, show error if none found
            alert('T2V requires a trained avatar. Use @mention or select a character with a trained avatar.');
            setIsLoading(false);
            return;
          }
          break;

        case 'coherent-scene':
          // Validate 6 images are uploaded
          if (!node.coherentImages || node.coherentImages.length !== 6) {
            alert('⚠️ Please upload all 6 images before generating!');
            setIsLoading(false);
            return;
          }
          // Show time warning
          if (!confirm('⏱️ WARNING: Coherent scene generation takes 10-15 minutes.\n\nThis will use 10 credits. Continue?')) {
            setIsLoading(false);
            return;
          }
          endpoint = '/api/runcomfy/coherent-scene';
          body.images = node.coherentImages;
          break;

        // === NEW A2E NODES ===
        case 'v2v':
          // Video to Video - A2E
          console.log('V2V - Using A2E video to video');
          if (!node.videoUrl) {
            alert('Please upload a video first!');
            setIsLoading(false);
            return;
          }
          endpoint = '/api/a2e/v2v';
          body.videoUrl = node.videoUrl;
          body.strength = node.settings?.creativity || 0.7;
          break;

        case 'nanobanana':
          // NanoBanana - Multi-character scene
          console.log('NANOBANANA - Multi-character scene');
          endpoint = '/api/a2e/nanobanana';
          body.characterRefs = characterRefs;
          body.sketch = node.imageData;
          break;

        // === WAN DIRECT NODES ===
        case 'wan-i2v':
          // Wan 2.5 Image to Video (Replicate)
          console.log('WAN-I2V - Using Replicate Wan 2.5');
          if (!node.imageUrl && !node.imageData) {
            alert('Please add an image first!');
            setIsLoading(false);
            return;
          }
          endpoint = '/api/replicate/wan-i2v';
          body.image = node.imageUrl || node.imageData;
          break;

        case 'wan-fast':
          // Wan 2.2 Fast (Replicate)
          console.log('WAN-FAST - Using Replicate Wan 2.2 Fast');
          endpoint = '/api/replicate/wan-fast';
          body.image = node.imageUrl || node.imageData;
          break;

        case 'wan-first-last':
          // Wan First-Last Frame Interpolation
          console.log('WAN-FIRST-LAST - Frame interpolation');
          if (!node.firstFrame || !node.lastFrame) {
            alert('Please add both first and last frame images!');
            setIsLoading(false);
            return;
          }
          endpoint = '/api/replicate/wan-first-last';
          body.firstFrame = node.firstFrame;
          body.lastFrame = node.lastFrame;
          break;

        case 'wan-animate':
          // Wan 2.2 Animate
          console.log('WAN-ANIMATE - Character animation');
          if (!node.imageUrl && !node.imageData) {
            alert('Please add an image to animate!');
            setIsLoading(false);
            return;
          }
          endpoint = '/api/replicate/wan-animate';
          body.image = node.imageUrl || node.imageData;
          body.mode = node.settings?.animateMode || 'animation';
          break;

        case 'wan-vace':
          // Wan VACE - Video editing with references
          console.log('WAN-VACE - Video editing');
          if (!node.videoUrl) {
            alert('Please add a video to the node first');
            setNodes(nodes.map(n => n.id === node.id ? { ...n, isGenerating: false } : n));
            return;
          }
          endpoint = '/api/replicate/wan-vace';
          body.srcVideo = node.videoUrl;
          body.srcRefImages = node.referenceImages || [];
          body.prompt = processedPrompt;
          break;

        case 'wan-t2v':
          // Wan Text to Video (Replicate)
          console.log('WAN-T2V - Text to video');
          endpoint = '/api/replicate/wan-t2v';
          body.prompt = processedPrompt;
          break;

        case 'text2video':
          // A2E Text to Video - generate video from prompt
          console.log('TEXT2VIDEO - A2E text to video');
          endpoint = '/api/a2e/text2video';
          body.prompt = processedPrompt;
          break;

        default:
          alert('Unknown node type');
          setIsLoading(false);
          return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/87d64ab3-42cf-46a6-ad0d-43caa4bcb44c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
          location: 'app/canvas/page.tsx:handleGenerateInternal:preFetch',
          message: 'Preparing generation request',
          data: {
            nodeType: node.type,
            endpoint,
            hasImageData: !!node.imageData,
            hasImageUrl: !!(node as any).imageUrl,
            hasVideoUrl: !!(node as any).videoUrl,
            promptLength: (body.prompt || '').length
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/87d64ab3-42cf-46a6-ad0d-43caa4bcb44c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C',
          location: 'app/canvas/page.tsx:handleGenerateInternal:postFetch',
          message: 'Generation response received',
          data: {
            nodeType: node.type,
            endpoint,
            hasOutputUrl: !!data.output_url,
            hasError: !!data.error,
            creditsBefore: credits,
            requiredCredits
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion

      console.log('🎬 Generation response:', { output_url: data.output_url, error: data.error, nodeType: node.type });

      if (data.output_url) {
        // Determine if output is video based on node type
        const videoNodeTypes = ['i2v', 'v2v', 't2v', 'text2video', 'lipsync', 'wan-i2v', 'wan-t2v', 'wan-fast', 'wan-first-last', 'wan-animate', 'wan-vace'];
        const outputType = videoNodeTypes.includes(node.type) ? 'video' : 'image';

        if (outputType === 'video') {
          updateNode(nodeId, { videoUrl: data.output_url });
        } else {
          // Store avatar_id if this is a character generation
          const nodeUpdate: any = { imageUrl: data.output_url };
          if (node.type === 'character' && data.avatar_id) {
            nodeUpdate.avatarId = data.avatar_id;
          }
          updateNode(nodeId, nodeUpdate);
        }

        setCredits(credits - requiredCredits);

        // Save to database if user opted in
        await saveOutputToDatabase(nodeId, data.output_url, outputType);
      } else {
        alert('Failed to generate: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle node click for sequence linking
  const handleNodeClick = (nodeId: string) => {
    if (linkingMode) {
      const node = canvas.nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Can only link image nodes
      if (!node.imageUrl && !node.videoUrl) {
        alert('Can only link nodes with generated content');
        return;
      }

      if (!linkSourceNode) {
        // First click - select source node
        setLinkSourceNode(nodeId);
        alert('Source frame selected. Now click the target frame to connect.');
      } else if (linkSourceNode === nodeId) {
        // Clicking same node - deselect
        setLinkSourceNode(null);
        alert('Selection cancelled');
      } else {
        // Second click - create connection
        updateNode(linkSourceNode, {
          connections: { next: nodeId }
        });
        alert('✅ Nodes connected! You can now generate a sequence.');
        setLinkSourceNode(null);
        setLinkingMode(false);
      }
    } else {
      // Normal click - just select
      updateNode(nodeId, {});
    }
  };

  // Generate sequence video from connected nodes
  const handleGenerateSequence = async (sourceNodeId: string) => {
    const sourceNode = canvas.nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode || !sourceNode.connections?.next) {
      alert('No sequence connection found');
      return;
    }

    const targetNode = canvas.nodes.find(n => n.id === sourceNode.connections?.next);
    if (!targetNode) {
      alert('Target node not found');
      return;
    }

    if (!sourceNode.imageUrl || !targetNode.imageUrl) {
      alert('Both frames must have generated images');
      return;
    }

    const creditCost = 60; // Wan 2.2 First-Last Frame costs 60 credits
    if (credits < creditCost) {
      alert(`Insufficient credits! Sequence generation costs ${creditCost} credits.`);
      return;
    }

    setIsLoading(true);
    try {
      // Use Wan 2.2 First-Last Frame for smooth interpolation
      const response = await fetch('/api/replicate/wan-first-last', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstFrame: sourceNode.imageUrl,
          lastFrame: targetNode.imageUrl,
          prompt: sourceNode.prompt || targetNode.prompt || 'smooth action transition, cinematic motion',
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.output_url) {
        // Create a new video node between the two frames
        const newNode: NodeType = {
          id: uuidv4(),
          type: 'video',
          x: (sourceNode.x + targetNode.x) / 2,
          y: (sourceNode.y + targetNode.y) / 2 + 50,
          width: 320,
          height: 400,
          videoUrl: data.output_url,
        };
        addNode(newNode);
        setCredits(credits - creditCost);

        // Save to training data if user opted in
        await saveOutputToDatabase(newNode.id, data.output_url, 'video');

        alert('✅ Sequence video generated!');
      } else {
        alert('Failed to generate sequence');
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/87d64ab3-42cf-46a6-ad0d-43caa4bcb44c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'D',
          location: 'app/canvas/page.tsx:handleGenerateSequence',
          message: 'Sequence generation response',
          data: {
            sourceNodeId,
            targetNodeId: sourceNode.connections?.next,
            hasOutputUrl: !!data.output_url,
            creditsBefore: credits
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
    } catch (error) {
      console.error('Sequence generation error:', error);
      alert('Failed to generate sequence');
    } finally {
      setIsLoading(false);
    }
  };

  // === PORT CLICK HANDLERS ===

  // Reference Output Click (purple) - Node wants to BE a reference for another node
  const handleRefOutputClick = (nodeId: string) => {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node?.imageUrl) {
      alert('Node needs a generated image to be used as reference');
      return;
    }

    if (!refLinkingMode) {
      // Start linking - this node will provide reference
      setRefLinkingMode(true);
      setRefLinkSourceNode(nodeId);
      // Cancel other linking modes
      setLinkingMode(false);
      setLinkSourceNode(null);
      setAudioLinkingMode(false);
      setAudioLinkSourceNode(null);
    } else if (refLinkSourceNode === nodeId) {
      // Cancel linking
      setRefLinkingMode(false);
      setRefLinkSourceNode(null);
    }
  };

  // Reference Input Click (purple) - Node wants to RECEIVE a reference
  const handleRefInputClick = (nodeId: string) => {
    if (refLinkingMode && refLinkSourceNode && refLinkSourceNode !== nodeId) {
      // Complete the connection - add source to target's references
      const targetNode = canvas.nodes.find(n => n.id === nodeId);
      if (targetNode) {
        const currentRefs = targetNode.connections?.references || [];
        // Avoid duplicates
        if (!currentRefs.includes(refLinkSourceNode)) {
          updateNode(nodeId, {
            connections: {
              ...targetNode.connections,
              references: [...currentRefs, refLinkSourceNode]
            }
          });
          console.log(`✅ Connected reference: ${refLinkSourceNode} → ${nodeId}`);
        }
      }
      // Reset linking mode
      setRefLinkingMode(false);
      setRefLinkSourceNode(null);
    } else if (!refLinkingMode) {
      // Show what's connected to this input
      const node = canvas.nodes.find(n => n.id === nodeId);
      const refs = node?.connections?.references || [];
      if (refs.length > 0) {
        alert(`This node has ${refs.length} reference connection(s). Click a reference output (purple, right side) to add more.`);
      } else {
        alert('Click a reference output (purple port, right side of another node) first, then click this input to connect.');
      }
    }
  };

  // Sequence Output Click (blue) - Node's image goes to next frame
  const handleSeqOutputClick = (nodeId: string) => {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node?.imageUrl) {
      alert('Node needs a generated image to connect sequence');
      return;
    }

    if (!linkingMode) {
      // Start sequence linking
      setLinkingMode(true);
      setLinkSourceNode(nodeId);
      // Cancel other modes
      setRefLinkingMode(false);
      setRefLinkSourceNode(null);
      setAudioLinkingMode(false);
      setAudioLinkSourceNode(null);
    } else if (linkSourceNode === nodeId) {
      // Cancel
      setLinkingMode(false);
      setLinkSourceNode(null);
    }
  };

  // Sequence Input Click (blue) - This node receives from previous frame
  const handleSeqInputClick = (nodeId: string) => {
    if (linkingMode && linkSourceNode && linkSourceNode !== nodeId) {
      // Complete the sequence connection
      updateNode(linkSourceNode, {
        connections: {
          ...canvas.nodes.find(n => n.id === linkSourceNode)?.connections,
          next: nodeId
        }
      });
      console.log(`✅ Connected sequence: ${linkSourceNode} → ${nodeId}`);
      setLinkingMode(false);
      setLinkSourceNode(null);
    } else if (!linkingMode) {
      // Check what's connected
      const hasPrev = canvas.nodes.some(n => n.connections?.next === nodeId);
      if (hasPrev) {
        alert('This node already has a previous frame connected.');
      } else {
        alert('Click a sequence output (blue port, right side) on another node first, then click this input.');
      }
    }
  };

  // Audio Output Click (green) - Node provides audio (TTS nodes)
  const handleAudioOutputClick = (nodeId: string) => {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node?.audioUrl) {
      alert('Node needs generated audio to connect');
      return;
    }

    if (!audioLinkingMode) {
      setAudioLinkingMode(true);
      setAudioLinkSourceNode(nodeId);
      // Cancel other modes
      setRefLinkingMode(false);
      setRefLinkSourceNode(null);
      setLinkingMode(false);
      setLinkSourceNode(null);
    } else if (audioLinkSourceNode === nodeId) {
      setAudioLinkingMode(false);
      setAudioLinkSourceNode(null);
    }
  };

  // Audio Input Click (green) - Lipsync node receives audio
  const handleAudioInputClick = (nodeId: string) => {
    if (audioLinkingMode && audioLinkSourceNode && audioLinkSourceNode !== nodeId) {
      // Complete audio connection
      updateNode(nodeId, {
        connections: {
          ...canvas.nodes.find(n => n.id === nodeId)?.connections,
          audioSource: audioLinkSourceNode
        }
      });
      console.log(`✅ Connected audio: ${audioLinkSourceNode} → ${nodeId}`);
      setAudioLinkingMode(false);
      setAudioLinkSourceNode(null);
    } else if (!audioLinkingMode) {
      const node = canvas.nodes.find(n => n.id === nodeId);
      if (node?.connections?.audioSource) {
        alert('Audio source already connected.');
      } else {
        alert('Click an audio output (green port) on a TTS node first, then click here.');
      }
    }
  };

  // === WIRE DRAGGING HANDLERS ===

  // Start dragging a wire from an output port
  const handlePortDragStart = (nodeId: string, portType: 'ref' | 'seq' | 'audio', isOutput: boolean, x: number, y: number) => {
    if (!isOutput) return; // Only outputs can start a drag

    // Set the appropriate linking mode
    if (portType === 'ref') {
      setRefLinkingMode(true);
      setRefLinkSourceNode(nodeId);
    } else if (portType === 'seq') {
      setLinkingMode(true);
      setLinkSourceNode(nodeId);
    } else if (portType === 'audio') {
      setAudioLinkingMode(true);
      setAudioLinkSourceNode(nodeId);
    }

    // Start the visual wire
    setDraggingWire({
      type: portType,
      sourceNodeId: nodeId,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  };

  // Handle mouse move while dragging wire
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggingWire) {
      setDraggingWire({
        ...draggingWire,
        currentX: e.clientX,
        currentY: e.clientY,
      });
    }
  };

  // Handle mouse up - check if dropped on a valid input port
  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!draggingWire) return;

    // Check if we dropped on a valid input port
    const target = e.target as HTMLElement;
    const port = target.closest('[data-port]');

    if (port) {
      const portType = port.getAttribute('data-port');
      const nodeCard = port.closest('[data-node-id]');
      const targetNodeId = nodeCard?.getAttribute('data-node-id');

      // Match the wire type to the input port type and complete connection
      if (targetNodeId && targetNodeId !== draggingWire.sourceNodeId) {
        if (draggingWire.type === 'ref' && portType === 'ref-input') {
          // Complete reference connection
          const targetNode = canvas.nodes.find(n => n.id === targetNodeId);
          if (targetNode) {
            const currentRefs = targetNode.connections?.references || [];
            if (!currentRefs.includes(draggingWire.sourceNodeId)) {
              updateNode(targetNodeId, {
                connections: {
                  ...targetNode.connections,
                  references: [...currentRefs, draggingWire.sourceNodeId]
                }
              });
              console.log(`✅ Connected reference: ${draggingWire.sourceNodeId} → ${targetNodeId}`);
            }
          }
        } else if (draggingWire.type === 'seq' && portType === 'seq-input') {
          // Complete sequence connection
          updateNode(draggingWire.sourceNodeId, {
            connections: {
              ...canvas.nodes.find(n => n.id === draggingWire.sourceNodeId)?.connections,
              next: targetNodeId
            }
          });
          console.log(`✅ Connected sequence: ${draggingWire.sourceNodeId} → ${targetNodeId}`);
        } else if (draggingWire.type === 'audio' && portType === 'audio-input') {
          // Complete audio connection
          updateNode(targetNodeId, {
            connections: {
              ...canvas.nodes.find(n => n.id === targetNodeId)?.connections,
              audioSource: draggingWire.sourceNodeId
            }
          });
          console.log(`✅ Connected audio: ${draggingWire.sourceNodeId} → ${targetNodeId}`);
        }
      }
    }

    // Reset all states
    setDraggingWire(null);
    setRefLinkingMode(false);
    setRefLinkSourceNode(null);
    setLinkingMode(false);
    setLinkSourceNode(null);
    setAudioLinkingMode(false);
    setAudioLinkSourceNode(null);
  };

  // Cancel all linking modes on Escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDraggingWire(null);
      setRefLinkingMode(false);
      setRefLinkSourceNode(null);
      setLinkingMode(false);
      setLinkSourceNode(null);
      setAudioLinkingMode(false);
      setAudioLinkSourceNode(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Epic Scene - Generate from images (standard or Kling)
  const handleEpicSceneGenerate = async (images: string[], model?: 'standard' | 'kling', prompt?: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      let response;
      let creditCost = 10;

      if (model === 'kling') {
        // Use Kling multi-reference API
        creditCost = 8;
        response = await fetch('/api/modelslab/kling-multi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images,
            prompt: prompt || 'Cinematic action scene with dramatic lighting',
            duration: '10',
            aspectRatio: '16:9',
            userId: user.id,
          }),
        });
      } else {
        // Standard coherent scene
        response = await fetch('/api/runcomfy/coherent-scene', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images,
            userId: user.id,
          }),
        });
      }

      const data = await response.json();

      if (data.output_url) {
        // Create a new node with the result
        const isVideo = model === 'kling';
        const newNode: NodeType = {
          id: uuidv4(),
          type: isVideo ? 'video' : 'image',
          x: Math.random() * 400 + 200,
          y: Math.random() * 200 + 150,
          width: 320,
          height: 400,
          prompt: model === 'kling' ? `Kling: ${prompt}` : 'Epic Scene (6 images)',
          ...(isVideo ? { videoUrl: data.output_url } : { imageUrl: data.output_url }),
          coherentImages: images,
          settings: {},
        };
        addNode(newNode);

        setCredits(credits - creditCost);

        // Save to training data if user opted in
        await saveOutputToDatabase(newNode.id, data.output_url, isVideo ? 'video' : 'image');

        alert(`✅ ${model === 'kling' ? 'Kling video' : 'Epic scene'} generated successfully!`);
      } else {
        alert('Failed to generate: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Epic scene generation error:', error);
      alert('Failed to generate');
    } finally {
      setIsLoading(false);
    }
  };

  // Save node as character reference
  const handleSaveAsReference = async (nodeId: string) => {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node || !node.imageUrl) {
      alert('No image to save as reference');
      return;
    }

    if (!user) {
      alert('Please log in to save character references');
      return;
    }

    if (characterRefs.length >= 2) {
      alert('Maximum 2 character references allowed. Delete one first.');
      return;
    }

    setIsLoading(true);
    try {
      // Prompt for character name
      const name = prompt('Enter character name (e.g., @hero, @villain):');
      if (!name) {
        setIsLoading(false);
        return;
      }

      // Save to database
      const insertData: any = {
        user_id: user.id,
        name: name.replace('@', ''), // Remove @ if included
        image_url: node.imageUrl,
        outfit_description: node.prompt || '',
      };

      // Add avatar_id if available
      if ((node as any).avatarId) {
        insertData.avatar_id = (node as any).avatarId;
        insertData.avatar_status = 'training'; // Avatar is training
      }

      const { data, error } = await supabase
        .from('character_references')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setCharacterRefs([...characterRefs, data]);
      alert(`✅ Saved as @${data.name}`);
    } catch (error) {
      console.error('Error saving character reference:', error);
      alert('Failed to save character reference');
    } finally {
      setIsLoading(false);
    }
  };

  // Upscale image
  const handleUpscale = async (nodeId: string) => {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node || !node.imageUrl) {
      alert('No image to upscale');
      return;
    }

    setUpscalingNodeId(nodeId);
    try {
      const response = await fetch('/api/modelslab/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: node.imageUrl,
          prompt: node.prompt || '',
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upscale failed');

      // Update the node with the upscaled image
      updateNode(nodeId, { imageUrl: data.output_url });
      alert('Image upscaled successfully!');
    } catch (error: any) {
      console.error('Upscale error:', error);
      alert('Failed to upscale: ' + error.message);
    } finally {
      setUpscalingNodeId(null);
    }
  };

  // Nano correct - opens drawing modal for inpainting
  const handleNanoCorrect = (nodeId: string) => {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node || !node.imageUrl) {
      alert('No image to correct');
      return;
    }
    // Set the current node and open drawing modal in mask mode
    setCurrentNodeId(nodeId);
    setShowDrawingModal(true);
    // The DrawingCanvas component will need to detect this is for nano-correct
  };

  // Kling i2v - Premium single image to video
  const handleKlingI2V = async (nodeId: string) => {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node || !node.imageUrl) {
      alert('No image for Kling video');
      return;
    }

    // Prompt for scene description
    const scenePrompt = prompt('Describe the cinematic scene for Kling (5 credits):');
    if (!scenePrompt) return;

    setKlingGeneratingNodeId(nodeId);
    try {
      const response = await fetch('/api/modelslab/kling-i2v', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: node.imageUrl,
          prompt: scenePrompt,
          duration: '5',
          aspectRatio: node.aspectRatio === '9:16' ? '9:16' : '16:9',
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kling generation failed');

      // Create a new video node
      const newNode: NodeType = {
        id: uuidv4(),
        type: 'video',
        x: node.x + 50,
        y: node.y + 50,
        width: node.width,
        height: node.height,
        aspectRatio: node.aspectRatio,
        prompt: `Kling: ${scenePrompt}`,
        videoUrl: data.output_url,
        settings: {},
      };
      addNode(newNode);
      alert('✅ Kling video generated!');
    } catch (error: any) {
      console.error('Kling i2v error:', error);
      alert('Failed to generate Kling video: ' + error.message);
    } finally {
      setKlingGeneratingNodeId(null);
    }
  };

  // Handle loading an image from file to create an image node
  const handleLoadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;

      // Create a new image node with the loaded image
      const newNode: NodeType = {
        id: uuidv4(),
        type: 'image',
        x: Math.random() * 400 + 200,
        y: Math.random() * 200 + 150,
        width: 400,
        height: 300,
        aspectRatio: '16:9',
        imageUrl: imageData, // Use as imageUrl so it shows in preview
        prompt: file.name.replace(/\.[^/.]+$/, ''), // Use filename as prompt
        settings: {},
      };
      addNode(newNode);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (imageUploadRef.current) {
      imageUploadRef.current.value = '';
    }
  };

  // Handle loading an image from a node's "Load Image" button
  const handleNodeLoadImage = (nodeId: string) => {
    setLoadImageTargetNodeId(nodeId);
    nodeImageUploadRef.current?.click();
  };

  // Handle the file selection for node image upload
  const handleNodeImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !loadImageTargetNodeId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;
      updateNode(loadImageTargetNodeId, { imageUrl: imageData });
      setLoadImageTargetNodeId(null);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (nodeImageUploadRef.current) {
      nodeImageUploadRef.current.value = '';
    }
  };

  // Magic prompt - enhance prompt with AI
  const handleMagicPrompt = async (nodeId: string, currentPrompt: string) => {
    if (!currentPrompt.trim()) {
      alert('Please enter a prompt first to enhance');
      return;
    }

    setMagicPromptLoadingNodeId(nodeId);
    try {
      const node = canvas.nodes.find(n => n.id === nodeId);
      const nodeType = node?.type || 'scene';

      const response = await fetch('/api/magic-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          nodeType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Magic prompt failed');

      // Update the node with enhanced prompt (dialogue for lipsync, prompt for others)
      if (node?.type === 'lipsync') {
        updateNode(nodeId, { dialogue: data.enhancedPrompt });
      } else {
        updateNode(nodeId, { prompt: data.enhancedPrompt });
      }
    } catch (error: any) {
      console.error('Magic prompt error:', error);
      alert('Failed to enhance prompt: ' + error.message);
    } finally {
      setMagicPromptLoadingNodeId(null);
    }
  };

  // Upload character reference
  const handleCharacterRefUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    console.log('Upload triggered! File:', e.target.files?.[0]);
    console.log('User:', user);
    console.log('Current refs:', characterRefs);

    if (!user) {
      alert('Please wait for user to load...');
      return;
    }

    if (characterRefs.length >= 2) {
      alert('Maximum 2 character references allowed');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsLoading(true);
    try {
      // Create a temporary URL for immediate preview
      const tempUrl = URL.createObjectURL(file);

      // Add temporary character ref for immediate feedback
      const tempRef = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        name: `Fighter ${index + 1}`,
        image_url: tempUrl,
        created_at: new Date().toISOString(),
      };

      setCharacterRefs([...characterRefs, tempRef]);

      // Try to upload to Supabase (will fail if bucket doesn't exist, but that's ok for now)
      try {
        const fileName = `${user.id}/${uuidv4()}.${file.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('character-uploads')
          .upload(fileName, file);

        if (uploadError) {
          console.warn('Supabase storage not configured:', uploadError);
          // Keep the temp URL - it will work for this session
          alert('Character reference added! (Using local preview - Supabase storage not configured)');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('character-uploads')
          .getPublicUrl(fileName);

        // Try to save to database
        const { data, error: dbError } = await supabase
          .from('character_references')
          .insert({
            user_id: user.id,
            name: `Fighter ${index + 1}`,
            image_url: publicUrl,
          })
          .select()
          .single();

        if (dbError) {
          console.warn('Database save failed:', dbError);
          alert('Character reference added! (Using local preview - Database not configured)');
          return;
        }

        if (data) {
          // Replace temp ref with real one
          setCharacterRefs(characterRefs.filter(ref => ref.id !== tempRef.id).concat([data]));
          alert('Character reference uploaded successfully!');
        }
      } catch (storageError) {
        console.warn('Storage error:', storageError);
        alert('Character reference added! (Using local preview)');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload: ' + (error as Error).message);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate character using A2E API
  const handleGenerateCharacter = async (index: number) => {
    if (!user) {
      alert('Please wait for user to load...');
      return;
    }

    if (!characterPrompt.trim()) {
      alert('Please enter a character description');
      return;
    }

    if (credits < 2) {
      alert('Insufficient credits! You need 2 credits to generate a character.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/a2e/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: characterPrompt,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.output_url) {
        const newRef = {
          id: `gen-${Date.now()}`,
          user_id: user.id,
          name: `Fighter ${index + 1}`,
          image_url: data.output_url,
          created_at: new Date().toISOString(),
        };

        setCharacterRefs([...characterRefs, newRef]);
        setCredits(credits - 2);
        setCharacterPrompt('');
        setShowCharacterGen(null);
        alert('Character generated successfully!');
      } else {
        alert('Failed to generate character: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Character generation error:', error);
      alert('Failed to generate character. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] border-b border-zinc-900 z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              <Home size={20} />
            </Link>
            <h1 className="text-lg font-bold text-white">Canvas</h1>
            <Link href="/contest" className="text-zinc-400 hover:text-white transition-colors text-sm">
              Contest
            </Link>
            <Link href="/settings" className="text-zinc-400 hover:text-white transition-colors">
              <Settings size={18} />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Environment Selector */}
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-zinc-500" />
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="none">No Environment</option>
                <option value="warehouse">Warehouse</option>
                <option value="rooftop">Rooftop</option>
                <option value="street">Street Fight</option>
                <option value="dojo">Dojo</option>
                <option value="cyberpunk">Cyberpunk City</option>
                <option value="desert">Desert</option>
              </select>
            </div>

            {/* Credits */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-2">
                <Sparkles size={16} className="text-red-500" />
                <span className="text-sm font-medium">{isMounted ? credits : '...'}</span>
                <span className="text-xs text-zinc-500">credits</span>
                {isMounted && (user as any)?.role === 'superadmin' && (
                  <span className="text-xs text-red-500 font-semibold">∞</span>
                )}
              </div>
              {(user as any)?.role === 'superadmin' && (
                <button
                  onClick={() => {
                    setCredits(credits + 1000);
                  }}
                  className="px-2 py-1.5 bg-red-600 hover:bg-red-700 border border-red-500 rounded-lg transition-colors"
                  title="Add 1000 credits"
                >
                  <Plus size={16} className="text-white" />
                </button>
              )}
            </div>

            {/* Linking Status Indicator */}
            {(refLinkingMode || linkingMode || audioLinkingMode) && (
              <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-pulse ${
                refLinkingMode ? 'bg-purple-600' : linkingMode ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                <Link2 size={14} />
                {refLinkingMode ? 'Click purple input to connect reference' :
                 linkingMode ? 'Click blue input to connect sequence' :
                 'Click green input to connect audio'}
                <button
                  onClick={() => {
                    setRefLinkingMode(false);
                    setRefLinkSourceNode(null);
                    setLinkingMode(false);
                    setLinkSourceNode(null);
                    setAudioLinkingMode(false);
                    setAudioLinkSourceNode(null);
                  }}
                  className="ml-1 hover:text-white/80"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Load Image Button */}
            <label className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2">
              <Upload size={16} />
              Load Image
              <input
                ref={imageUploadRef}
                type="file"
                accept="image/*"
                onChange={handleLoadImage}
                className="hidden"
              />
            </label>

            {/* Hidden file input for node-specific image upload */}
            <input
              ref={nodeImageUploadRef}
              type="file"
              accept="image/*"
              onChange={handleNodeImageSelected}
              className="hidden"
            />

            <button className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
              Buy Credits
            </button>
          </div>
        </div>
      </div>

      {/* Left Sidebar - Character References */}
      <div className="fixed left-0 top-[57px] bottom-0 w-64 bg-[#0a0a0a] border-r border-zinc-900 p-4 z-30">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-zinc-500" />
            <h3 className="text-sm font-semibold text-white">Characters</h3>
          </div>

          {/* Character 1 */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Character 1</label>
            {characterRefs[0] ? (
              <div className="space-y-1">
                <div className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                  <img src={characterRefs[0].image_url} alt="Character 1" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setCharacterRefs(characterRefs.filter((_, i) => i !== 0))}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={characterRefs[0].name || ''}
                  onChange={(e) => {
                    const updated = [...characterRefs];
                    updated[0] = { ...updated[0], name: e.target.value };
                    setCharacterRefs(updated);
                  }}
                  placeholder="Name (e.g., @adam)"
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600"
                />
                <textarea
                  value={characterRefs[0].outfit || ''}
                  onChange={(e) => {
                    const updated = [...characterRefs];
                    updated[0] = { ...updated[0], outfit: e.target.value };
                    setCharacterRefs(updated);
                  }}
                  placeholder="Costume/Outfit (e.g., black ninja suit, tactical gear)"
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
                  rows={2}
                />
                <p className="text-[10px] text-zinc-600">Auto-added: "{characterRefs[0].name || '@fighter1'} {characterRefs[0].outfit ? 'in ' + characterRefs[0].outfit : ''}"</p>
              </div>
            ) : showCharacterGen === 0 ? (
              <div className="aspect-square bg-zinc-900 border-2 border-red-600 rounded-lg p-3 flex flex-col gap-2">
                <textarea
                  value={characterPrompt}
                  onChange={(e) => setCharacterPrompt(e.target.value)}
                  placeholder="Describe your fighter... (e.g., muscular bald man with scars)"
                  className="flex-1 px-2 py-1 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-vertical min-h-[60px]"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => handleGenerateCharacter(0)}
                    disabled={isLoading}
                    className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50"
                  >
                    Generate (2cr)
                  </button>
                  <button
                    onClick={() => setShowCharacterGen(null)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block aspect-square bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-lg hover:border-red-600 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center justify-center h-full text-zinc-600 hover:text-red-500">
                    <User size={32} />
                    <span className="text-xs mt-2">Upload Fighter 1</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      console.log('Character 1 file selected');
                      handleCharacterRefUpload(e, 0);
                    }}
                    className="hidden"
                    onClick={(e) => {
                      console.log('Character 1 input clicked');
                      (e.target as HTMLInputElement).value = '';
                    }}
                  />
                </label>
                <button
                  onClick={() => setShowCharacterGen(0)}
                  className="w-full px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-medium transition-colors"
                >
                  Or Generate with AI
                </button>
              </div>
            )}
          </div>

          {/* Character 2 */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Character 2</label>
            {characterRefs[1] ? (
              <div className="space-y-1">
                <div className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                  <img src={characterRefs[1].image_url} alt="Character 2" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setCharacterRefs(characterRefs.filter((_, i) => i !== 1))}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={characterRefs[1].name || ''}
                  onChange={(e) => {
                    const updated = [...characterRefs];
                    updated[1] = { ...updated[1], name: e.target.value };
                    setCharacterRefs(updated);
                  }}
                  placeholder="Name (e.g., @opponent)"
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600"
                />
                <textarea
                  value={characterRefs[1].outfit || ''}
                  onChange={(e) => {
                    const updated = [...characterRefs];
                    updated[1] = { ...updated[1], outfit: e.target.value };
                    setCharacterRefs(updated);
                  }}
                  placeholder="Costume/Outfit (e.g., viking armor, leather jacket)"
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
                  rows={2}
                />
                <p className="text-[10px] text-zinc-600">Auto-added: "{characterRefs[1].name || '@fighter2'} {characterRefs[1].outfit ? 'in ' + characterRefs[1].outfit : ''}"</p>
              </div>
            ) : showCharacterGen === 1 ? (
              <div className="aspect-square bg-zinc-900 border-2 border-red-600 rounded-lg p-3 flex flex-col gap-2">
                <textarea
                  value={characterPrompt}
                  onChange={(e) => setCharacterPrompt(e.target.value)}
                  placeholder="Describe your fighter... (e.g., tough woman with mohawk)"
                  className="flex-1 px-2 py-1 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-vertical min-h-[60px]"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => handleGenerateCharacter(1)}
                    disabled={isLoading}
                    className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50"
                  >
                    Generate (2cr)
                  </button>
                  <button
                    onClick={() => setShowCharacterGen(null)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block aspect-square bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-lg hover:border-red-600 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center justify-center h-full text-zinc-600 hover:text-red-500">
                    <User size={32} />
                    <span className="text-xs mt-2">Upload Fighter 2</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      console.log('Character 2 file selected');
                      handleCharacterRefUpload(e, 1);
                    }}
                    className="hidden"
                    onClick={(e) => {
                      console.log('Character 2 input clicked');
                      (e.target as HTMLInputElement).value = '';
                    }}
                  />
                </label>
                <button
                  onClick={() => setShowCharacterGen(1)}
                  className="w-full px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-medium transition-colors"
                >
                  Or Generate with AI
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 p-2 bg-zinc-900/50 border border-zinc-800 rounded text-[10px] text-zinc-500">
            <p className="font-semibold text-zinc-400 mb-1">💡 Pro Tip:</p>
            <p className="mb-1">Name your characters with @ tags and add their costume details:</p>
            <p className="text-zinc-400 mt-1">• @adam in ninja suit</p>
            <p className="text-zinc-400">• @opponent in viking armor</p>
            <p className="mt-2 text-zinc-400 italic">Then in prompts: "@adam kicks @opponent in the chest"</p>
            <p className="mt-1 text-yellow-600">The AI will automatically know what each character is wearing!</p>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="ml-64 pt-[57px] min-h-screen relative">
        {/* Zoom Controls */}
        <div className="fixed left-64 top-20 z-30 flex flex-col gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2">
          <button
            onClick={() => {
              const newScale = Math.min(canvas.scale + 0.1, 2);
              setCanvas({ ...canvas, scale: newScale });
            }}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-bold"
            title="Zoom In"
          >
            +
          </button>
          <div className="text-xs text-center text-zinc-500">
            {Math.round(canvas.scale * 100)}%
          </div>
          <button
            onClick={() => {
              const newScale = Math.max(canvas.scale - 0.1, 0.3);
              setCanvas({ ...canvas, scale: newScale });
            }}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-bold"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => setCanvas({ ...canvas, scale: 1 })}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs"
            title="Reset Zoom"
          >
            100%
          </button>
        </div>

        <div
          ref={canvasContainerRef}
          className="relative w-full h-screen overflow-auto bg-black"
          style={{
            backgroundImage: 'radial-gradient(circle, #18181b 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => {
            if (draggingWire) {
              setDraggingWire(null);
              setRefLinkingMode(false);
              setRefLinkSourceNode(null);
              setLinkingMode(false);
              setLinkSourceNode(null);
              setAudioLinkingMode(false);
              setAudioLinkSourceNode(null);
            }
          }}
        >
          {/* Dragging Wire Preview */}
          {draggingWire && (
            <svg
              className="fixed top-0 left-0 w-screen h-screen pointer-events-none z-[100]"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <filter id="wire-glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Glow effect */}
              <path
                d={`M ${draggingWire.startX} ${draggingWire.startY} C ${draggingWire.startX + 80} ${draggingWire.startY}, ${draggingWire.currentX - 80} ${draggingWire.currentY}, ${draggingWire.currentX} ${draggingWire.currentY}`}
                stroke={draggingWire.type === 'ref' ? '#a855f7' : draggingWire.type === 'seq' ? '#3b82f6' : '#22c55e'}
                strokeWidth="8"
                fill="none"
                opacity="0.3"
                filter="url(#wire-glow)"
              />
              {/* Main wire */}
              <path
                d={`M ${draggingWire.startX} ${draggingWire.startY} C ${draggingWire.startX + 80} ${draggingWire.startY}, ${draggingWire.currentX - 80} ${draggingWire.currentY}, ${draggingWire.currentX} ${draggingWire.currentY}`}
                stroke={draggingWire.type === 'ref' ? '#a855f7' : draggingWire.type === 'seq' ? '#3b82f6' : '#22c55e'}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              {/* Animated dash */}
              <path
                d={`M ${draggingWire.startX} ${draggingWire.startY} C ${draggingWire.startX + 80} ${draggingWire.startY}, ${draggingWire.currentX - 80} ${draggingWire.currentY}, ${draggingWire.currentX} ${draggingWire.currentY}`}
                stroke={draggingWire.type === 'ref' ? '#c084fc' : draggingWire.type === 'seq' ? '#60a5fa' : '#4ade80'}
                strokeWidth="2"
                fill="none"
                strokeDasharray="8,8"
                strokeLinecap="round"
                style={{ animation: 'wireDash 0.5s linear infinite' }}
              />
              {/* Start dot */}
              <circle cx={draggingWire.startX} cy={draggingWire.startY} r="6" fill={draggingWire.type === 'ref' ? '#a855f7' : draggingWire.type === 'seq' ? '#3b82f6' : '#22c55e'} />
              {/* End dot */}
              <circle cx={draggingWire.currentX} cy={draggingWire.currentY} r="6" fill={draggingWire.type === 'ref' ? '#a855f7' : draggingWire.type === 'seq' ? '#3b82f6' : '#22c55e'} />
              <style>{`
                @keyframes wireDash {
                  to { stroke-dashoffset: -16; }
                }
              `}</style>
            </svg>
          )}

          {/* Nodes Container with Zoom */}
          <div
            style={{
              transform: `scale(${canvas.scale})`,
              transformOrigin: 'top left',
              minWidth: '100%',
              minHeight: '100%',
            }}
          >
            {/* Render connection lines */}
            <NodeConnections
              nodes={canvas.nodes}
              characterRefs={characterRefs}
            />

            {canvas.nodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                onUpdate={updateNode}
                onDelete={deleteNode}
                onGenerate={handleGenerate}
                onEdit={(nodeId) => {
                  setCurrentNodeId(nodeId);
                  setShowDrawingModal(true);
                }}
                isSelected={canvas.selectedNodeId === node.id || linkSourceNode === node.id || refLinkSourceNode === node.id || audioLinkSourceNode === node.id}
                onClick={() => handleNodeClick(node.id)}
                characterRefs={characterRefs}
                faces={faces}
                onSaveAsReference={handleSaveAsReference}
                onGenerateSequence={node.connections?.next ? () => handleGenerateSequence(node.id) : undefined}
                isLinkingMode={linkingMode || refLinkingMode || audioLinkingMode}
                isLinkSource={linkSourceNode === node.id || refLinkSourceNode === node.id || audioLinkSourceNode === node.id}
                // Port click handlers
                onRefOutputClick={handleRefOutputClick}
                onRefInputClick={handleRefInputClick}
                onSeqOutputClick={handleSeqOutputClick}
                onSeqInputClick={handleSeqInputClick}
                onAudioOutputClick={handleAudioOutputClick}
                onAudioInputClick={handleAudioInputClick}
                // Wire drag handlers
                onPortDragStart={handlePortDragStart}
                // Connection state
                hasRefConnections={!!node.connections?.references?.length}
                hasSeqNext={!!node.connections?.next}
                hasSeqPrev={canvas.nodes.some(n => n.connections?.next === node.id)}
                hasAudioConnection={!!node.connections?.audioSource}
                refLinkingMode={refLinkingMode}
                seqLinkingMode={linkingMode}
                audioLinkingMode={audioLinkingMode}
                // Upscale, nano-correct, and Kling
                onUpscale={node.imageUrl ? handleUpscale : undefined}
                onNanoCorrect={node.imageUrl ? handleNanoCorrect : undefined}
                isUpscaling={upscalingNodeId === node.id}
                onKlingI2V={node.imageUrl ? handleKlingI2V : undefined}
                isKlingGenerating={klingGeneratingNodeId === node.id}
                // Magic prompt enhancement
                onMagicPrompt={handleMagicPrompt}
                isMagicPromptLoading={magicPromptLoadingNodeId === node.id}
                // Image upload for i2v and other image-input nodes
                onLoadImage={handleNodeLoadImage}
              />
            ))}
          </div>

          {/* Empty State - Client-side only to avoid hydration issues */}
          {isMounted && canvas.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4 max-w-md opacity-50">
                <h2 className="text-2xl font-bold text-zinc-800">Click + to add your first node</h2>
                <p className="text-zinc-700 text-sm">
                  Create action sequences with sketch nodes, character nodes, and more
                </p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-white font-medium">Processing...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Node Menu */}
      <AddNodeMenu onAddNode={createNewNode} />

      {/* Epic Scene Panel */}
      <EpicScenePanel onGenerate={handleEpicSceneGenerate} isGenerating={isLoading} />

      {/* Drawing Modal - Resizable */}
      {showDrawingModal && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // Close modal when clicking backdrop (outside the modal content)
            if (e.target === e.currentTarget) {
              setShowDrawingModal(false);
              setCurrentNodeId(null);
            }
          }}
          onKeyDown={(e) => {
            // Close modal on Escape key
            if (e.key === 'Escape') {
              setShowDrawingModal(false);
              setCurrentNodeId(null);
            }
          }}
          tabIndex={0}
        >
          <div
            className="relative bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col"
            style={{
              width: `${modalSize.width}px`,
              height: `${modalSize.height}px`,
              maxWidth: '95vw',
              maxHeight: '95vh'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside modal
          >
            {/* Header with drag handle */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 cursor-move select-none">
              <h2 className="text-xl font-bold text-white">Draw Your Sketch</h2>
              <div className="flex items-center gap-2">
                {/* Size Presets */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setModalSize({ width: 800, height: 600 })}
                    className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                  >
                    Small
                  </button>
                  <button
                    onClick={() => setModalSize({ width: 1200, height: 700 })}
                    className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setModalSize({ width: 1400, height: 800 })}
                    className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                  >
                    Large
                  </button>
                  <button
                    onClick={() => {
                      // Fit to window
                      setModalSize({
                        width: Math.min(window.innerWidth - 100, 1600),
                        height: Math.min(window.innerHeight - 100, 900)
                      });
                    }}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded text-white"
                  >
                    Fit Screen
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowDrawingModal(false);
                    setCurrentNodeId(null);
                  }}
                  className="text-zinc-400 hover:text-white text-2xl px-2"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Canvas Container */}
            <div className="flex-1 overflow-auto p-4">
              {isMounted && (
                <DrawingCanvas
                  width={modalSize.width - 80}
                  height={modalSize.height - 120}
                  onSave={(imageData, prompt, autoGenerate, controlnetMode) => handleSaveSketch(imageData, prompt, autoGenerate || false, controlnetMode as ControlNetMode)}
                  nodeId={currentNodeId || undefined}
                  initialControlnetMode={
                    currentNodeId
                      ? (canvas.nodes.find(n => n.id === currentNodeId)?.settings?.controlnetMode as ControlNetMode) || 'img2img'
                      : 'img2img'
                  }
                />
              )}
            </div>
            
            {/* Resize Handle - Bottom Right Corner */}
            <div
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group hover:bg-red-600/20 rounded-tl-lg transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = modalSize.width;
                const startHeight = modalSize.height;
                
                const handleMouseMove = (e: MouseEvent) => {
                  const newWidth = Math.max(600, Math.min(window.innerWidth - 50, startWidth + e.clientX - startX));
                  const newHeight = Math.max(400, Math.min(window.innerHeight - 50, startHeight + e.clientY - startY));
                  setModalSize({ width: newWidth, height: newHeight });
                };
                
                const handleMouseUp = () => {
                  setIsResizing(false);
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <svg className="w-6 h-6 text-zinc-600 group-hover:text-red-500" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22 22H20V20H22V22M22 18H20V16H22V18M18 22H16V20H18V22M18 18H16V16H18V18M14 22H12V20H14V22M22 14H20V12H22V14Z"/>
              </svg>
            </div>
            
            {/* Size indicator */}
            {isResizing && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 px-3 py-1 rounded text-sm text-white pointer-events-none">
                {modalSize.width} × {modalSize.height}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
