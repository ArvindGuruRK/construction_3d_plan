"use client";

import * as React from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GeneratePlanSchema } from '@/lib/schemas';


// --- ARCHITECTURAL CONSTANTS (real-world scale) ---
const METER_TO_FEET = 3.28084;
const SQFT_TO_SQM = 0.092903;

const WALL_HEIGHT = 2.7; // 2.7m ceiling height
const INTERIOR_WALL_THICKNESS = 0.15; // 15cm
const EXTERIOR_WALL_THICKNESS = 0.25; // 25cm

const DOOR_WIDTH = 0.9; // 90cm
const DOOR_HEIGHT = 2.1; // 2.1m

const WINDOW_WIDTH = 1.5; // 1.5m
const WINDOW_HEIGHT = 1.2; // 1.2m
const WINDOW_SILL_HEIGHT = 0.9; // 90cm from floor

// --- PROCEDURAL GENERATION ENGINE ---

class AdvancedLayoutGenerator {
  totalAreaMeters: number;
  roomRequest: GeneratePlanSchema['roomCounts'];
  gridSize = 0.5; // 50cm grid for snapping

  constructor(planConfig: GeneratePlanSchema) {
    this.totalAreaMeters = (planConfig.totalArea ?? 1200) * SQFT_TO_SQM;
    this.roomRequest = planConfig.roomCounts;
  }
  
  private snapToGrid(value: number) {
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  private getMinimumArea(roomType: keyof GeneratePlanSchema['roomCounts']) {
    const minimums: Record<keyof GeneratePlanSchema['roomCounts'], number> = {
      LivingRoom: 12,
      Kitchen: 6,
      Bedroom: 9,
      Bathroom: 4,
      DiningRoom: 9,
    };
    return minimums[roomType] || 0;
  }

  private allocateRoomAreas() {
    const standards: Record<keyof GeneratePlanSchema['roomCounts'], number> = {
      LivingRoom: 0.30,
      Kitchen: 0.12,
      Bedroom: 0.20,
      Bathroom: 0.08,
      DiningRoom: 0.10,
    };

    const roomAreas: { [key: string]: { id: string, type: string, area: number }[] } = {};
    let allocatedArea = 0;
    let totalRequestedArea = 0;
    
    // First pass: assign areas based on standards and minimums
    for (const [roomType, count] of Object.entries(this.roomRequest)) {
      if (count > 0) {
        roomAreas[roomType as string] = [];
        const minArea = this.getMinimumArea(roomType as keyof GeneratePlanSchema['roomCounts']);
        const standardArea = this.totalAreaMeters * (standards[roomType as keyof GeneratePlanSchema['roomCounts']] || 0.1);
        const areaPerRoom = Math.max(standardArea / count, minArea);
        
        for (let i = 0; i < count; i++) {
          roomAreas[roomType as string].push({
            id: `${roomType}-${i}`,
            type: roomType,
            area: areaPerRoom
          });
          totalRequestedArea += areaPerRoom;
        }
      }
    }
    
    // Normalize if total requested area exceeds available area
    if (totalRequestedArea > this.totalAreaMeters) {
      const scaleFactor = this.totalAreaMeters / totalRequestedArea;
      for (const roomType in roomAreas) {
        roomAreas[roomType].forEach(room => room.area *= scaleFactor);
      }
    }
    
    return Object.values(roomAreas).flat();
  }
  
  // Guillotine Algorithm for rectangle packing
  private solveRectanglePacking(envelope: { width: number, depth: number }, roomsToPlace: { id: string, type: string, area: number }[]) {
    const placedRooms: any[] = [];
    let freeRects = [{ x: 0, y: 0, width: envelope.width, height: envelope.depth }];

    // Sort rooms by area, descending. This is a greedy approach.
    roomsToPlace.sort((a, b) => b.area - a.area);

    for (const room of roomsToPlace) {
      let bestFit: any = { score: Infinity };

      for (let i = freeRects.length - 1; i >= 0; i--) {
        const freeRect = freeRects[i];
        
        // Try to fit the room, testing different aspect ratios
        const aspectRatios = [1, 1.5, 1/1.5, 2, 0.5]; // width/height
        for(const ratio of aspectRatios){
            const roomWidth = this.snapToGrid(Math.sqrt(room.area * ratio));
            const roomHeight = this.snapToGrid(room.area / roomWidth);

            if (roomWidth <= freeRect.width && roomHeight <= freeRect.height) {
                const score = (freeRect.width * freeRect.height) - (roomWidth * roomHeight); // Simple score: smaller leftover area is better
                if (score < bestFit.score) {
                    bestFit = {
                        score,
                        x: freeRect.x,
                        y: freeRect.y,
                        width: roomWidth,
                        height: roomHeight,
                        rectIndex: i,
                    };
                }
            }
        }
      }
      
      if (bestFit.score !== Infinity) {
        const { x, y, width, height, rectIndex } = bestFit;
        placedRooms.push({ ...room, x, y, width, height });

        const freeRect = freeRects[rectIndex];
        freeRects.splice(rectIndex, 1);

        // Split the free rectangle (Guillotine cut)
        const rightRect = { x: x + width, y, width: freeRect.width - width, height: freeRect.height };
        if(rightRect.width > 0) freeRects.push(rightRect);

        const bottomRect = { x, y: y + height, width, height: freeRect.height - height };
        if(bottomRect.height > 0) freeRects.push(bottomRect);
      }
    }
    return placedRooms;
  }

  generateLayout() {
    // 1. Calculate building envelope
    const circulationFactor = 1.25; // 25% for walls/hallways
    const grossArea = this.totalAreaMeters * circulationFactor;
    const aspectRatio = 1.5; // width:depth
    const envelopeWidth = this.snapToGrid(Math.sqrt(grossArea * aspectRatio));
    const envelopeDepth = this.snapToGrid(grossArea / envelopeWidth);
    const envelope = { width: envelopeWidth, depth: envelopeDepth };
    
    // 2. Allocate room areas
    const roomSpecs = this.allocateRoomAreas();
    
    // 3. Solve layout using rectangle packing
    const layout = this.solveRectanglePacking(envelope, roomSpecs);

    // 4. Place Doors and Windows
    const finalLayout = this.placeOpenings(layout);

    return { layout: finalLayout, envelope };
  }

  private placeOpenings(layout: any[]) {
     layout.forEach(room => {
      room.doors = [];
      room.windows = [];

      const wallSegments = {
        north: [{ start: room.x, end: room.x + room.width }],
        south: [{ start: room.x, end: room.x + room.width }],
        east: [{ start: room.y, end: room.y + room.height }],
        west: [{ start: room.y, end: room.y + room.height }],
      };

      // Find adjacencies and place doors
      layout.forEach(other => {
        if (room.id === other.id) return;
        
        // Simplified adjacency check for shared walls
        const xOverlap = Math.max(0, Math.min(room.x + room.width, other.x + other.width) - Math.max(room.x, other.x));
        const yOverlap = Math.max(0, Math.min(room.y + room.height, other.y + other.height) - Math.max(room.y, other.y));

        if (Math.abs((room.y + room.height) - other.y) < 0.1 && xOverlap > DOOR_WIDTH) { // North wall of room shares with south wall of other
          room.doors.push({ wall: 'north', pos: room.x + xOverlap / 2, connectsTo: other.id });
        } else if (Math.abs(room.y - (other.y + other.height)) < 0.1 && xOverlap > DOOR_WIDTH) { // South wall
          room.doors.push({ wall: 'south', pos: room.x + xOverlap / 2, connectsTo: other.id });
        } else if (Math.abs((room.x + room.width) - other.x) < 0.1 && yOverlap > DOOR_WIDTH) { // East wall
          room.doors.push({ wall: 'east', pos: room.y + yOverlap / 2, connectsTo: other.id });
        } else if (Math.abs(room.x - (other.x + other.width)) < 0.1 && yOverlap > DOOR_WIDTH) { // West wall
          room.doors.push({ wall: 'west', pos: room.y + yOverlap / 2, connectsTo: other.id });
        }
      });

      // Place windows on exterior walls
      Object.entries(wallSegments).forEach(([wall, segments]) => {
          if (room.doors.every(d => d.wall !== wall) && segments[0].end - segments[0].start > WINDOW_WIDTH + 1) {
              room.windows.push({ wall, pos: segments[0].start + (segments[0].end - segments[0].start) / 2 });
          }
      });
    });
    return layout;
  }
}

// --- 3D GEOMETRY GENERATOR ---

class MeshGenerator {
  private getFloorMaterial(roomType: string) {
    const colors: Record<string, THREE.ColorRepresentation> = {
      LivingRoom: '#D2B48C', // Light wood
      Bedroom: '#EADAC4', // Lighter wood
      Kitchen: '#E0E0E0', // Light tile
      Bathroom: '#CCCCCC', // Darker tile
      DiningRoom: '#C8A97E', // Medium wood
    };
    return new THREE.MeshStandardMaterial({
      color: colors[roomType] || '#F0F0F0',
      roughness: 0.8,
      metalness: 0.1,
    });
  }

  private getWallMaterial() {
    return new THREE.MeshStandardMaterial({
      color: '#F5F5F5', // Off-white
      roughness: 0.9,
    });
  }
  
  build(layout: any[]) {
    const group = new THREE.Group();

    layout.forEach(room => {
      // Floor
      const floorGeom = new THREE.PlaneGeometry(room.width, room.height);
      const floorMesh = new THREE.Mesh(floorGeom, this.getFloorMaterial(room.type));
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(room.x + room.width / 2, 0, room.y + room.height / 2);
      group.add(floorMesh);

      // Walls
      const walls = this.createWallsWithOpenings(room);
      walls.forEach(wall => group.add(wall));
    });

    return group;
  }

  private createWallsWithOpenings(room: any) {
    const wallMeshes: THREE.Mesh[] = [];
    const wallMaterial = this.getWallMaterial();

    const openings = [
        ...room.doors.map((d: any) => ({ ...d, type: 'door', width: DOOR_WIDTH, height: DOOR_HEIGHT, y: 0 })),
        ...room.windows.map((w: any) => ({ ...w, type: 'window', width: WINDOW_WIDTH, height: WINDOW_HEIGHT, y: WINDOW_SILL_HEIGHT }))
    ];

    // North, South, East, West
    const wallDefs = [
      { side: 'north', p1: [room.x, room.y + room.height], p2: [room.x + room.width, room.y + room.height], normal: [0, 1] },
      { side: 'south', p1: [room.x, room.y], p2: [room.x + room.width, room.y], normal: [0, -1] },
      { side: 'east', p1: [room.x + room.width, room.y], p2: [room.x + room.width, room.y + room.height], normal: [1, 0] },
      { side: 'west', p1: [room.x, room.y], p2: [room.x, room.y + room.height], normal: [-1, 0] },
    ];
    
    wallDefs.forEach(def => {
        const wallOpenings = openings.filter((o: any) => o.wall === def.side).sort((a:any, b:any) => a.pos - b.pos);
        let currentPos = (def.side === 'north' || def.side === 'south') ? def.p1[0] : def.p1[1];
        const wallEnd = (def.side === 'north' || def.side === 'south') ? def.p2[0] : def.p2[1];

        // Wall before first opening
        if (wallOpenings.length === 0 || wallOpenings[0].pos - wallOpenings[0].width/2 > currentPos) {
             const end = wallOpenings.length > 0 ? wallOpenings[0].pos - wallOpenings[0].width/2 : wallEnd;
             wallMeshes.push(this.createWallSegment(def.side, room, currentPos, end, wallMaterial));
        }

        // Segments between openings
        wallOpenings.forEach((opening:any, i:number) => {
            // Segment before this opening
            const start = currentPos;
            const end = opening.pos - opening.width/2;
            if(end > start) wallMeshes.push(this.createWallSegment(def.side, room, start, end, wallMaterial));

            // Segments for the opening (above and below)
            wallMeshes.push(...this.createOpeningSegments(def.side, room, opening, wallMaterial));

            currentPos = opening.pos + opening.width/2;

            // Segment after last opening
            if(i === wallOpenings.length - 1 && wallEnd > currentPos){
                wallMeshes.push(this.createWallSegment(def.side, room, currentPos, wallEnd, wallMaterial));
            }
        });
    });

    return wallMeshes;
  }
  
  private createWallSegment(side: string, room:any, start: number, end: number, material: THREE.Material) {
      const length = end - start;
      if (length <= 0) return new THREE.Mesh(); // Should not happen with correct logic
      
      let width, depth, posX, posZ;
      const thickness = INTERIOR_WALL_THICKNESS;

      if(side === 'north' || side === 'south') {
          width = length; depth = thickness;
          posX = start + length / 2;
          posZ = (side === 'north') ? room.y + room.height - thickness / 2 : room.y + thickness/2;
      } else { // east or west
          width = thickness; depth = length;
          posX = (side === 'east') ? room.x + room.width - thickness / 2 : room.x + thickness/2;
          posZ = start + length/2;
      }

      const geom = new THREE.BoxGeometry(width, WALL_HEIGHT, depth);
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(posX, WALL_HEIGHT / 2, posZ);
      return mesh;
  }

  private createOpeningSegments(side: string, room: any, opening: any, material: THREE.Material) {
      const segments = [];
      const thickness = INTERIOR_WALL_THICKNESS;
      
      // Segment below (for windows)
      if (opening.type === 'window' && opening.y > 0) {
          let width = (side === 'north' || side === 'south') ? opening.width : thickness;
          let depth = (side === 'east' || side === 'west') ? opening.width : thickness;
          let posX = (side === 'north' || side === 'south') ? opening.pos : ((side === 'east') ? room.x + room.width - thickness / 2 : room.x + thickness/2);
          let posZ = (side === 'north' || side === 'south') ? (side === 'north' ? room.y + room.height - thickness/2 : room.y + thickness/2) : opening.pos;

          const geom = new THREE.BoxGeometry(width, opening.y, depth);
          const mesh = new THREE.Mesh(geom, material);
          mesh.position.set(posX, opening.y/2, posZ);
          segments.push(mesh);
      }

      // Segment above
      const topHeight = WALL_HEIGHT - (opening.y + opening.height);
       if (topHeight > 0) {
          let width = (side === 'north' || side === 'south') ? opening.width : thickness;
          let depth = (side === 'east' || side === 'west') ? opening.width : thickness;
          let posX = (side === 'north' || side === 'south') ? opening.pos : ((side === 'east') ? room.x + room.width - thickness / 2 : room.x + thickness/2);
          let posZ = (side === 'north' || side === 'south') ? (side === 'north' ? room.y + room.height - thickness/2 : room.y + thickness/2) : opening.pos;
          
          const geom = new THREE.BoxGeometry(width, topHeight, depth);
          const mesh = new THREE.Mesh(geom, material);
          mesh.position.set(posX, (opening.y + opening.height) + topHeight/2, posZ);
          segments.push(mesh);
      }

      return segments;
  }
}


// --- MAIN 3D COMPONENT ---

const FloorPlan = React.memo(({ planConfig, onSceneReady }: { planConfig: GeneratePlanSchema, onSceneReady: (scene: THREE.Scene) => void; }) => {
  const { scene } = useThree();

  const generatedModel = React.useMemo(() => {
    try {
      const layoutGenerator = new AdvancedLayoutGenerator(planConfig);
      const { layout, envelope } = layoutGenerator.generateLayout();
      
      if (!layout || layout.length === 0) {
        console.error("Layout generation failed to produce any rooms.");
        return { model: new THREE.Group(), envelope: { width: 10, depth: 10 } };
      }

      const meshGenerator = new MeshGenerator();
      const model = meshGenerator.build(layout);
      
      // Center the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      
      return { model, envelope };

    } catch (error) {
      console.error("Error during 3D model generation:", error);
      return { model: new THREE.Group(), envelope: { width: 10, depth: 10 } }; // Return empty group on error
    }
  }, [planConfig]);

  React.useEffect(() => {
    // Add the generated model to the scene
    const group = new THREE.Group();
    group.add(generatedModel.model);
    
    // Pass a clone to avoid issues with React Three Fiber's scene management
    onSceneReady(group.clone());

    // This is for local display in the canvas
    scene.add(generatedModel.model);
    return () => {
      scene.remove(generatedModel.model);
    };
  }, [generatedModel, scene, onSceneReady]);


  return (
    <>
      {/* Room Labels */}
      {generatedModel.model.children.map(floor => {
        if(floor.userData.type === 'floor') {
          const room = (planConfig as any).layout?.find((r:any) => r.id === floor.userData.roomId);
          const label = room ? room.type.replace(/([A-Z])/g, ' $1').trim() : '';
          return (
             <Text
                key={floor.uuid}
                position={[floor.position.x, 1.5, floor.position.z]}
                fontSize={0.5}
                color="black"
                anchorX="center"
                anchorY="middle"
            >
                {label}
            </Text>
          )
        }
        return null;
      })}
    </>
  );
});

FloorPlan.displayName = 'FloorPlan';

interface InteractiveViewerProps {
  planConfig: GeneratePlanSchema;
  regenerationKey: number;
  onSceneReady: (scene: THREE.Scene) => void;
}

export function InteractiveViewer({ planConfig, regenerationKey, onSceneReady }: InteractiveViewerProps) {
  const totalArea = (planConfig.totalArea ?? 1200) * SQFT_TO_SQM;
  const cameraDistance = Math.sqrt(totalArea) * 1.8;

  return (
    <Canvas
      camera={{ position: [0, cameraDistance, cameraDistance * 0.8], fov: 50 }}
      shadows
      style={{ background: 'hsl(var(--background))' }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight 
        position={[15, 25, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      <React.Suspense fallback={null}>
        <FloorPlan key={regenerationKey} planConfig={planConfig} onSceneReady={onSceneReady} />
      </React.Suspense>
      
      <OrbitControls 
        makeDefault 
        minDistance={5} 
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.05} // Prevent looking from below
      />
      <gridHelper args={[100, 100]} position={[0, -0.01, 0]} />
    </Canvas>
  );
}
