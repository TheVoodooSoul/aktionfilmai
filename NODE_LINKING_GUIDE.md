# Node Linking System - How It Works

## Overview
Nodes can now be connected in two ways:
1. **Character Reference Connections** (red dashed lines)
2. **Sequence Connections** (green curved lines)

---

## 1. Character Reference Connections

**What it does:**
Links a character reference to any node that needs it (scene builder, i2v, lipsync, etc.)

**How to use:**
1. Create a character (Character node or upload)
2. Save it as a character reference (click "Save as Reference")
3. In any other node, select the character reference from dropdown
4. A red dashed line will appear connecting them

**Visual:**
```
[Character Ref]
        |
        | (red dashed line)
        |
        v
    [Scene Node]
```

**In the code:**
```typescript
node.settings.characterRefs = ['ref-id-123', 'ref-id-456'];
// This creates connections from those refs to this node
```

---

## 2. Sequence Connections (Node to Node)

**What it does:**
Links two nodes together for sequence interpolation (first frame → last frame → video)

**How to use:**
1. Create first frame (any image-generating node)
2. Create last frame (any image-generating node)
3. Right-click first frame → "Connect to Next Frame"
4. Click on the last frame node
5. A green line appears connecting them
6. Generate the sequence to create interpolated video

**Visual:**
```
[First Frame]
      |
      | (green curved line)
      |
      v
[Last Frame]
      |
      v
  [Sequence Video]
```

**In the code:**
```typescript
firstFrameNode.connections = {
  next: 'last-frame-node-id'
};
```

---

## Implementation Plan

### Phase 1: Character Reference Connections (Easier)
- [x] Created NodeConnections component
- [ ] Add "Save as Reference" button to nodes with images
- [ ] Add character ref selector dropdown to nodes
- [ ] Render red dashed lines between refs and nodes

### Phase 2: Sequence Connections (More Complex)
- [ ] Add connection mode button to canvas toolbar
- [ ] Click-to-connect interaction (click source → click target)
- [ ] Render green curved lines between sequence nodes
- [ ] Add "Generate Sequence" button when connection exists
- [ ] Call `/api/runcomfy/sequence` with first + last frame

### Phase 3: Visual Polish
- [ ] Add connection points (circles) on node edges
- [ ] Hover effects on connections
- [ ] Delete connection button
- [ ] Drag to rearrange connections

---

## Quick Integration

Add to `app/canvas/page.tsx`:

```tsx
import NodeConnections from '@/components/NodeConnections';

// In the return JSX:
<div className="relative w-full h-full">
  {/* Render connections behind nodes */}
  <NodeConnections
    nodes={canvas.nodes}
    characterRefs={characterRefs}
  />

  {/* Existing nodes */}
  {canvas.nodes.map(node => (
    <NodeCard key={node.id} ... />
  ))}
</div>
```

---

## API Routes to Use

**For Sequence (first + last frame interpolation):**
```
POST /api/runcomfy/sequence
Body: {
  firstFrame: 'image-url-or-base64',
  lastFrame: 'image-url-or-base64',
  userId: 'user-id'
}
```

**For Character Refs:**
Already exists - just need to wire up the UI to use `node.settings.characterRefs[]`

---

## User Flow Example

**Creating an action sequence:**

1. User creates Character node → saves as @hero reference
2. User creates Action Pose node → selects @hero from dropdown → red line appears
3. User generates action pose (punch)
4. User creates another Action Pose node → selects @hero → generates (kick)
5. User right-clicks first action pose → "Connect to Next Frame"
6. User clicks second action pose → green line appears
7. User clicks "Generate Sequence" → 4-second video of punch → kick transition

---

## Next Steps for Full Implementation

Want me to:
1. **Add character ref selector to nodes** - Quick UI update
2. **Add click-to-connect mode** - Moderate, needs interaction state
3. **Wire up sequence API** - Easy, API already exists

Which would you like me to do first?
