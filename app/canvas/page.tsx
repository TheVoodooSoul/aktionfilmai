'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import DrawingCanvas from '@/components/DrawingCanvas';
import NodeCard from '@/components/NodeCard';
import AddNodeMenu from '@/components/AddNodeMenu';
import { CanvasNode as NodeType } from '@/lib/types';
import { Sparkles, User, Layers, Home } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

export default function CanvasPage() {
  const { canvas, addNode, updateNode, deleteNode, credits, setCredits, user } = useStore();
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [characterRefs, setCharacterRefs] = useState<any[]>([]);
  const [environment, setEnvironment] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(false);

  // Load character references
  useEffect(() => {
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
  }, [user]);

  // Create new node based on type
  const createNewNode = (type: 'character' | 'scene' | 'sketch' | 'i2i' | 't2i' | 't2v' | 'lipsync') => {
    const newNode: NodeType = {
      id: uuidv4(),
      type,
      x: Math.random() * 400 + 200,
      y: Math.random() * 200 + 150,
      width: 320,
      height: 400,
      prompt: '',
      settings: {
        creativity: 0.7,
        characterRefs: characterRefs.map(ref => ref.id),
      },
    };
    addNode(newNode);

    // Open drawing modal for sketch type
    if (type === 'sketch') {
      setCurrentNodeId(newNode.id);
      setShowDrawingModal(true);
    }
  };

  // Save sketch from drawing canvas
  const handleSaveSketch = (imageData: string) => {
    if (currentNodeId) {
      updateNode(currentNodeId, { imageData });
      setShowDrawingModal(false);
      setCurrentNodeId(null);
    }
  };

  // Generate using appropriate API based on node type
  const handleGenerate = async (nodeId: string) => {
    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Credit costs per node type
    const creditCosts: Record<string, number> = {
      'character': 2,
      'scene': 3,
      'sketch': 1,
      'i2i': 5,
      't2i': 5,
      't2v': 8,
      'lipsync': 3,
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
      let endpoint = '';
      let body: any = {
        userId: user?.id,
        prompt: node.prompt || '',
      };

      // Route to appropriate API based on node type
      switch (node.type) {
        case 'character':
          endpoint = '/api/a2e/character';
          body.referenceImage = node.imageData;
          break;

        case 'scene':
          endpoint = '/api/runpod/scene-builder';
          body.characters = characterRefs.map(ref => ref.image_url);
          body.environment = environment;
          body.action = node.settings?.actionType || 'fight';
          body.creativity = node.settings?.creativity || 0.7;
          break;

        case 'sketch':
        case 'i2i':
          endpoint = '/api/runcomfy/preview';
          body.image = node.imageData;
          body.creativity = node.settings?.creativity || 0.7;
          body.characterRefs = characterRefs.map(ref => ref.image_url);
          body.environment = environment;
          break;

        case 't2i':
          endpoint = '/api/runcomfy/preview';
          body.creativity = node.settings?.creativity || 0.7;
          body.characterRefs = characterRefs.map(ref => ref.image_url);
          body.environment = environment;
          break;

        case 't2v':
          endpoint = '/api/a2e/i2v';
          body.image = node.imageUrl || node.imageData;
          break;

        case 'lipsync':
          endpoint = '/api/a2e/lipsync';
          body.image = node.imageUrl || node.imageData;
          body.text = node.dialogue || '';
          break;

        default:
          alert('Unknown node type');
          setIsLoading(false);
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.output_url) {
        if (node.type === 't2v' || node.type === 'lipsync') {
          updateNode(nodeId, { videoUrl: data.output_url });
        } else {
          updateNode(nodeId, { imageUrl: data.output_url });
        }
        setCredits(credits - requiredCredits);
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

  // Upload character reference
  const handleCharacterRefUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!user || characterRefs.length >= 2) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const fileName = `${user.id}/${uuidv4()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('character-refs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('character-refs')
        .getPublicUrl(fileName);

      const { data } = await supabase
        .from('character_references')
        .insert({
          user_id: user.id,
          name: `Character ${index + 1}`,
          image_url: publicUrl,
        })
        .select()
        .single();

      if (data) {
        setCharacterRefs([...characterRefs, data]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload character reference');
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
            <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-2">
              <Sparkles size={16} className="text-red-500" />
              <span className="text-sm font-medium">{credits}</span>
              <span className="text-xs text-zinc-500">credits</span>
            </div>

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
              <div className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                <img src={characterRefs[0].image_url} alt="Character 1" className="w-full h-full object-cover" />
              </div>
            ) : (
              <label className="block aspect-square bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-lg hover:border-red-600 transition-colors cursor-pointer">
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 hover:text-red-500">
                  <User size={32} />
                  <span className="text-xs mt-2">Upload Fighter 1</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCharacterRefUpload(e, 0)}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Character 2 */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Character 2</label>
            {characterRefs[1] ? (
              <div className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                <img src={characterRefs[1].image_url} alt="Character 2" className="w-full h-full object-cover" />
              </div>
            ) : (
              <label className="block aspect-square bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-lg hover:border-red-600 transition-colors cursor-pointer">
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 hover:text-red-500">
                  <User size={32} />
                  <span className="text-xs mt-2">Upload Fighter 2</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCharacterRefUpload(e, 1)}
                  className="hidden"
                  disabled={characterRefs.length < 1}
                />
              </label>
            )}
          </div>

          <p className="text-xs text-zinc-600 pt-2">
            Upload 2 characters for fight scenes. These will be used for consistency across all generations.
          </p>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="ml-64 pt-[57px] min-h-screen">
        <div
          className="relative w-full h-screen overflow-hidden bg-black"
          style={{
            backgroundImage: 'radial-gradient(circle, #18181b 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        >
          {/* Nodes */}
          {canvas.nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onUpdate={updateNode}
              onDelete={deleteNode}
              onGenerate={handleGenerate}
              isSelected={canvas.selectedNodeId === node.id}
              onClick={() => updateNode(node.id, {})}
            />
          ))}

          {/* Empty State */}
          {canvas.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="text-6xl mb-4">🎬</div>
                <h2 className="text-2xl font-bold text-zinc-700">Start Creating</h2>
                <p className="text-zinc-600">
                  Click the + button below to add your first node and start creating action sequences
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

      {/* Drawing Modal */}
      {showDrawingModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-4xl w-full border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Draw Your Sketch</h2>
              <button
                onClick={() => {
                  setShowDrawingModal(false);
                  setCurrentNodeId(null);
                }}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <DrawingCanvas
              width={800}
              height={600}
              onSave={handleSaveSketch}
            />
          </div>
        </div>
      )}
    </div>
  );
}
