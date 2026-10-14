import * as THREE from "three";

interface NavbarFloatOptions {
  amplitude?: number;
  rotationAmplitude?: number;
  duration?: number;
}

export function startNavbarFloat(
  element: HTMLElement,
  {
    amplitude = 3,
    rotationAmplitude = 0.15,
    duration = 12,
  }: NavbarFloatOptions = {},
) {
  const clock = new THREE.Clock();
  let animationFrameId = 0;
  let isRunning = true;

  const initialPosition = new THREE.Vector3(0, 0, 0);

  function animate() {
    if (!isRunning) return;

    const elapsed = clock.getElapsedTime();
    const phase = (elapsed / duration) * Math.PI * 2;

    // Slow, smooth, continuous floating motion
    const verticalOffset = Math.sin(phase) * amplitude;

    // Very subtle rocking, like a floating object on water
    const rotation = Math.sin(phase * 0.7) * rotationAmplitude;

    const position = initialPosition.clone();
    position.y = verticalOffset;

    element.style.transform = `
      translate3d(0, ${position.y}px, 0)
      rotate(${rotation}deg)
    `;

    animationFrameId = requestAnimationFrame(animate);
  }

  animate();

  // Cleanup function: stops the animation and resets the element
  return () => {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    element.style.transform = "";
  };
}
