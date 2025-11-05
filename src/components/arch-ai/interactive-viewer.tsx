"use client";

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GeneratePlanSchema } from '@/lib/schemas';

// Helper function to create a wall
const Wall = (props: JSX.IntrinsicElements['mesh']) => {
  return (
    <mesh {...props}>
      <boxGeometry args={[1, 2.5, 0.1]} />
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
};

// Helper function to create a room as a box
const Room = ({ position, size, label }: { position: [number, number, number], size: [number, number], label: string }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[size[0], 2.4, size[1]]} />
        <meshStandardMaterial color={new THREE.Color(0xffffff * Math.random())} transparent opacity={0.3} />
      </mesh>
       <Text
        position={[0, 1.5, 0]}
        fontSize={0.5}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

// Main component to generate the floor plan
const FloorPlan = ({ planConfig }: { planConfig: GeneratePlanSchema }) => {
  // 1 Three.js unit = 1 meter
  const { totalArea, roomCounts } = planConfig;
  
  // Calculate overall dimensions for the floor plan based on total area
  // Assuming a roughly square layout
  const sideLength = Math.sqrt(totalArea);
  const floorWidth = parseFloat(sideLength.toFixed(2));
  const floorDepth = parseFloat(sideLength.toFixed(2));

  // Simple procedural layout logic
  const rooms = [];
  let currentX = -floorWidth / 2 + 1;
  let currentZ = -floorDepth / 2 + 1;
  const roomPadding = 0.5;

  let totalRooms = 0;
  for (const count of Object.values(roomCounts)) {
    totalRooms += count;
  }
  
  // Estimate room size - this is a very simplified approach
  const avgRoomArea = totalArea / Math.max(1, totalRooms);
  const avgRoomSide = Math.sqrt(avgRoomArea);

  for (const [roomType, count] of Object.entries(roomCounts)) {
    for (let i = 0; i < count; i++) {
        // Simple grid placement logic
        const roomSize: [number, number] = [avgRoomSide - roomPadding, avgRoomSide - roomPadding];
        if (currentX + roomSize[0] > floorWidth / 2) {
            currentX = -floorWidth / 2 + 1;
            currentZ += avgRoomSide;
        }

        if (currentZ + roomSize[1] < floorDepth / 2) {
             rooms.push(
                <Room 
                    key={`${roomType}-${i}`} 
                    position={[currentX + roomSize[0] / 2, 1.2, currentZ + roomSize[1] / 2]}
                    size={roomSize}
                    label={roomType.replace(/([A-Z])/g, ' $1').trim()}
                />
            );
            currentX += avgRoomSide;
        }
    }
  }


  return (
    <group>
      {/* Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[floorWidth, floorDepth]} />
        <meshStandardMaterial color="#f0f0f0" side={THREE.DoubleSide} />
      </mesh>

      {/* Exterior Walls */}
      <Wall position={[-floorWidth / 2, 1.25, 0]} scale={[floorDepth, 1, 1]} rotation={[0, Math.PI / 2, 0]} />
      <Wall position={[floorWidth / 2, 1.25, 0]} scale={[floorDepth, 1, 1]} rotation={[0, -Math.PI / 2, 0]} />
      <Wall position={[0, 1.25, -floorDepth / 2]} scale={[floorWidth, 1, 1]} />
      <Wall position={[0, 1.25, floorDepth / 2]} scale={[floorWidth, 1, 1]} rotation={[0, Math.PI, 0]} />
      
      {/* Render Rooms */}
      {rooms}
    </group>
  );
};


interface InteractiveViewerProps {
  planConfig: GeneratePlanSchema;
}

export function InteractiveViewer({ planConfig }: InteractiveViewerProps) {
  return (
    <Canvas
      camera={{ position: [0, 15, 20], fov: 50 }}
      shadows
      style={{ background: '#f0f4f8' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[10, 20, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <React.Suspense fallback={null}>
        <FloorPlan planConfig={planConfig} />
      </React.Suspense>
      
      <OrbitControls 
        makeDefault 
        minDistance={5} 
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
      />

      <gridHelper args={[100, 100]} position={[0, -0.01, 0]} />
    </Canvas>
  );
}
