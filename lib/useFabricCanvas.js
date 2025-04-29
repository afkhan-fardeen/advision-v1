import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to manage a Fabric.js canvas in React, ensuring reliable client-side execution.
 * @param {React.RefObject} canvasRef - Ref to the canvas element.
 * @param {Object} initialOptions - Initial canvas options (width, height).
 * @returns {Object} - Canvas instance, initialization status, and error state.
 */
export function useFabricCanvas(canvasRef, initialOptions = { width: 1200, height: 628 }) {
  const [canvas, setCanvas] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;
  const retryDelay = 200;

  useEffect(() => {
    let fabricCanvas = null;
    let intervalId = null;

    // Ensure this runs only on the client side
    if (typeof window === 'undefined') {
      console.log('useFabricCanvas: Running on server, skipping canvas initialization.');
      return;
    }

    const initializeCanvas = () => {
      // Log the state of canvasRef.current for debugging
      console.log('useFabricCanvas: Checking canvasRef.current:', canvasRef.current);

      if (!canvasRef.current) {
        if (retryCountRef.current < maxRetries) {
          console.log(`useFabricCanvas: canvasRef.current not set, retrying (${retryCountRef.current + 1}/${maxRetries})...`);
          retryCountRef.current += 1;
          return;
        }
        console.error('useFabricCanvas: canvasRef.current is not set after retries.');
        setError('Canvas element not found after multiple attempts.');
        clearInterval(intervalId);
        return;
      }

      // Dynamically import fabric.js
      import('fabric')
        .then((module) => {
          const fabric = module.fabric;
          console.log('useFabricCanvas: Fabric.js loaded successfully.');

          try {
            // Initialize Fabric.js canvas
            fabricCanvas = new fabric.Canvas(canvasRef.current, {
              width: initialOptions.width,
              height: initialOptions.height,
              backgroundColor: '#fff',
              preserveObjectStacking: true,
              perPixelTargetFind: true,
              perfectDrawEnabled: false, // Performance optimization
            });

            console.log('useFabricCanvas: Canvas initialized successfully with dimensions:', initialOptions);
            setCanvas(fabricCanvas);
            setIsInitialized(true);
            setError(null);
            clearInterval(intervalId);
          } catch (err) {
            console.error('useFabricCanvas: Error initializing canvas:', err);
            setError('Failed to initialize canvas: ' + err.message);
            clearInterval(intervalId);
          }
        })
        .catch((err) => {
          console.error('useFabricCanvas: Failed to load fabric.js:', err);
          setError('Failed to load Fabric.js: ' + err.message);
          clearInterval(intervalId);
        });
    };

    // Retry every 200ms until canvasRef.current is available or max retries reached
    intervalId = setInterval(initializeCanvas, retryDelay);
    initializeCanvas(); // Try immediately

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      if (fabricCanvas) {
        console.log('useFabricCanvas: Disposing canvas on cleanup.');
        fabricCanvas.dispose();
      }
      setCanvas(null);
      setIsInitialized(false);
      setError(null);
      retryCountRef.current = 0;
    };
  }, [canvasRef, initialOptions.width, initialOptions.height]);

  return { canvas, isInitialized, error };
}