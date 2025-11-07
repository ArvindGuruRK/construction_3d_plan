
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
  sqftRequest: GeneratePlanSchema['roomSqft'];
  gridSize = 0.5; // 50cm grid for snapping

  constructor(planConfig: GeneratePlanSchema) {
    this.totalAreaMeters = (planConfig.totalArea ?? 1200) * SQFT_TO_SQM;
    this.roomRequest = planConfig.roomCounts;
    this.sqftRequest = planConfig.roomSqft;
  }
  
  private snapToGrid(value: number) {
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  private allocateRoomAreas() {
    const roomSpecs: { id: string, type: string, area: number }[] = [];
    let totalSpecifiedArea = 0;

    for (const [roomType, count] of Object.entries(this.roomRequest)) {
        if (count > 0) {
            const sqft = this.sqftRequest[roomType as keyof typeof this.sqftRequest];
            const areaMeters = sqft * SQFT_TO_SQM;
            for (let i = 0; i < count; i++) {
                roomSpecs.push({
                    id: `${roomType}-${i}`,
                    type: roomType,
                    area: areaMeters
                });
                totalSpecifiedArea += areaMeters;
            }
        }
    }

    // Normalize if total specified area doesn't match total area
    if (totalSpecifiedArea > 0 && Math.abs(totalSpecifiedArea - this.totalAreaMeters) > 1) {
        const scaleFactor = this.totalAreaMeters / totalSpecifiedArea;
        roomSpecs.forEach(spec => spec.area *= scaleFactor);
    }
    
    return roomSpecs;
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
        const aspectRatios = [1, 1.5, 1/1.5, 2, 0.5, Math.random() * 1.5 + 0.5]; // width/height, add randomness
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
        if(rightRect.width > this.gridSize) freeRects.push(rightRect);

        const bottomRect = { x, y: y + height, width, height: freeRect.height - height };
        if(bottomRect.height > this.gridSize) freeRects.push(bottomRect);
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
    const finalLayout = this.placeOpenings(layout, envelope);

    return { layout: finalLayout, envelope };
  }

  private placeOpenings(layout: any[], envelope: {width: number, depth: number}) {
     layout.forEach(room => {
      room.doors = [];
      room.windows = [];

      // Find adjacencies and place doors
      layout.forEach(other => {
        if (room.id === other.id) return;
        
        const xOverlap = Math.max(0, Math.min(room.x + room.width, other.x + other.width) - Math.max(room.x, other.x));
        const yOverlap = Math.max(0, Math.min(room.y + room.height, other.y + other.height) - Math.max(room.y, other.y));

        if (xOverlap > DOOR_WIDTH && Math.abs(room.y + room.height - other.y) < 0.1) {
            room.doors.push({ wall: 'north', pos: room.x + xOverlap / 2 });
        } else if (xOverlap > DOOR_WIDTH && Math.abs(room.y - (other.y + other.height)) < 0.1) {
            room.doors.push({ wall: 'south', pos: room.x + xOverlap / 2 });
        } else if (yOverlap > DOOR_WIDTH && Math.abs(room.x + room.width - other.x) < 0.1) {
            room.doors.push({ wall: 'east', pos: room.y + yOverlap / 2 });
        } else if (yOverlap > DOOR_WIDTH && Math.abs(room.x - (other.x + other.width)) < 0.1) {
            room.doors.push({ wall: 'west', pos: room.y + yOverlap / 2 });
        }
      });
      
      const placeWindowIfRoom = (wall: 'north' | 'south' | 'east' | 'west', start: number, end: number) => {
         // Check if this wall has a door
          const hasDoor = room.doors.some((d:any) => d.wall === wall);
          // Check if there is enough space for a window
          if (!hasDoor && (end - start) > (WINDOW_WIDTH + 1)) {
              room.windows.push({ wall, pos: start + (end - start) / 2 });
          }
      }

      // Place windows on exterior walls
      if (Math.abs(room.y) < 0.1) placeWindowIfRoom('south', room.x, room.x + room.width);
      if (Math.abs(room.y + room.height - envelope.depth) < 0.1) placeWindowIfRoom('north', room.x, room.x + room.width);
      if (Math.abs(room.x) < 0.1) placeWindowIfRoom('west', room.y, room.y + room.height);
      if (Math.abs(room.x + room.width - envelope.width) < 0.1) placeWindowIfRoom('east', room.y, room.y + room.height);
    });
    return layout;
  }
}

// --- 3D GEOMETRY GENERATOR ---

class MeshGenerator {
  private getFloorMaterial(roomType: string) {
    const colors: Record<string, THREE.ColorRepresentation> = {
      LivingRoom: '#D2B48C', // Tan - Wood
      Bedroom: '#EADAC4', // Beige - Carpet/Light Wood
      Kitchen: '#BFC0C0', // Silver - Tile
      Bathroom: '#A2A2A2', // Gray - Darker Tile
      DiningRoom: '#C8A97E', // Bisque - Medium Wood
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
      floorMesh.userData = { type: 'floor', room }; // Attach room data
      floorMesh.receiveShadow = true;
      group.add(floorMesh);

      // Walls
      const walls = this.createWallsWithOpenings(room);
      walls.forEach(wall => {
        wall.castShadow = true;
        wall.receiveShadow = true;
        group.add(wall)
      });
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
      { side: 'north', p1: [room.x, room.y + room.height], p2: [room.x + room.width, room.y + room.height] },
      { side: 'south', p1: [room.x, room.y], p2: [room.x + room.width, room.y] },
      { side: 'east', p1: [room.x + room.width, room.y], p2: [room.x + room.width, room.y + room.height] },
      { side: 'west', p1: [room.x, room.y], p2: [room.x, room.y + room.height] },
    ];
    
    wallDefs.forEach(def => {
        const wallOpenings = openings.filter((o: any) => o.wall === def.side).sort((a:any, b:any) => a.pos - b.pos);
        let currentPos = (def.side === 'north' || def.side === 'south') ? def.p1[0] : def.p1[1];
        const wallEnd = (def.side === 'north' || def.side === 'south') ? def.p2[0] : def.p2[1];

        const createSegment = (start: number, end: number) => {
            if (end - start > 0.01) {
                wallMeshes.push(this.createWallSegment(def.side, room, start, end, wallMaterial));
            }
        };
        
        // Wall before first opening
        createSegment(currentPos, wallOpenings.length > 0 ? wallOpenings[0].pos - wallOpenings[0].width / 2 : wallEnd);
        
        wallOpenings.forEach((opening:any, i:number) => {
            // Segments for the opening (above and below)
            wallMeshes.push(...this.createOpeningSegments(def.side, room, opening, wallMaterial));

            currentPos = opening.pos + opening.width / 2;
            
            // Segment after opening
            const nextStart = wallOpenings[i + 1] ? wallOpenings[i + 1].pos - wallOpenings[i + 1].width / 2 : wallEnd;
            createSegment(currentPos, nextStart);
        });
    });

    return wallMeshes;
  }
  
  private createWallSegment(side: string, room:any, start: number, end: number, material: THREE.Material) {
      const length = end - start;
      const thickness = INTERIOR_WALL_THICKNESS;
      
      const geom = new THREE.BoxGeometry(
        (side === 'north' || side === 'south') ? length : thickness, 
        WALL_HEIGHT, 
        (side === 'east' || side === 'west') ? length : thickness
      );
      
      const mesh = new THREE.Mesh(geom, material);

      const posX = (side === 'north' || side === 'south') ? start + length / 2 : ((side === 'east') ? room.x + room.width - thickness / 2 : room.x + thickness/2);
      const posZ = (side === 'east' || side === 'west') ? start + length/2 : ((side === 'north') ? room.y + room.height - thickness / 2 : room.y + thickness/2);
      
      mesh.position.set(posX, WALL_HEIGHT / 2, posZ);
      return mesh;
  }

  private createOpeningSegments(side: string, room: any, opening: any, material: THREE.Material) {
      const segments = [];
      const thickness = INTERIOR_WALL_THICKNESS;
      
      const width = (side === 'north' || side === 'south') ? opening.width : thickness;
      const depth = (side === 'east' || side === 'west') ? opening.width : thickness;
      const posX = (side === 'north' || side === 'south') ? opening.pos : ((side === 'east') ? room.x + room.width - thickness / 2 : room.x + thickness/2);
      const posZ = (side === 'east' || side === 'west') ? opening.pos : ((side === 'north') ? room.y + room.height - thickness / 2 : room.y + thickness/2);

      // Segment below (for windows)
      if (opening.type === 'window' && opening.y > 0) {
          const geom = new THREE.BoxGeometry(width, opening.y, depth);
          const mesh = new THREE.Mesh(geom, material);
          mesh.position.set(posX, opening.y/2, posZ);
          segments.push(mesh);
      }

      // Segment above
      const topHeight = WALL_HEIGHT - (opening.y + opening.height);
       if (topHeight > 0.01) {
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

  const { model: generatedModel, layout, centerOffset } = React.useMemo(() => {
    try {
      const layoutGenerator = new AdvancedLayoutGenerator(planConfig);
      const { layout, envelope } = layoutGenerator.generateLayout();
      
      if (!layout || layout.length === 0) {
        console.error("Layout generation failed to produce any rooms.");
        return { model: new THREE.Group(), layout: [], centerOffset: new THREE.Vector3() };
      }

      const meshGenerator = new MeshGenerator();
      const model = meshGenerator.build(layout);
      
      // Center the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      
      // Elevate the model above the grid
      model.position.y += 1.5;
      
      return { model, layout, centerOffset: center };

    } catch (error) {
      console.error("Error during 3D model generation:", error);
      return { model: new THREE.Group(), layout: [], centerOffset: new THREE.Vector3() }; // Return empty group on error
    }
  }, [planConfig]);

  React.useEffect(() => {
    // Add the generated model to the scene
    const group = new THREE.Group();
    group.add(generatedModel);
    
    // Pass a clone to avoid issues with React Three Fiber's scene management
    onSceneReady(group.clone());

    // This is for local display in the canvas
    scene.add(generatedModel);
    return () => {
      scene.remove(generatedModel);
    };
  }, [generatedModel, scene, onSceneReady]);


  return (
    <>
      {/* Room Labels */}
      {layout.map((room: any) => {
        const name = room.type.replace(/([A-Z])/g, ' $1').trim();
        const widthFt = Math.round(room.width * METER_TO_FEET);
        const depthFt = Math.round(room.height * METER_TO_FEET);
        const areaSqft = Math.round(widthFt * depthFt);
        
        const label = `${name}\n${widthFt}' x ${depthFt}'\n~${areaSqft} sqft`;

        // Calculate the label's absolute position, then apply the centering offset.
        const labelPosition = new THREE.Vector3(
            room.x + room.width / 2,
            WALL_HEIGHT, // Position labels at ceiling height
            room.y + room.height / 2
        );
        labelPosition.sub(centerOffset);
        
        // Apply the same elevation as the model itself
        labelPosition.y += 1.5;

        return (
            <Text
            key={room.id}
            position={labelPosition}
            fontSize={0.3}
            color="#333333"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
            textAlign="center"
            lineHeight={1.2}
          >
            {label}
          </Text>
        )
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
