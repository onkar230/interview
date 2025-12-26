'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, X, Minimize2, Maximize2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebcamMirrorProps {
  isVisible: boolean;
  onClose: () => void;
  mode?: 'floating' | 'embedded';
  size?: 'small' | 'medium' | 'large';
}

type WebcamStatus = 'loading' | 'active' | 'denied' | 'error' | 'no-device';
type WebcamSize = 'small' | 'medium' | 'large';

export default function WebcamMirror({ isVisible, onClose, mode = 'floating', size: initialSize = 'medium' }: WebcamMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<WebcamStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [size, setSize] = useState<WebcamSize>(initialSize);
  const [isMinimized, setIsMinimized] = useState(false);

  // Size configurations for floating mode
  const floatingSizeConfigs = {
    small: { width: 'w-48', height: 'h-36' },
    medium: { width: 'w-64', height: 'h-48' },
    large: { width: 'w-80', height: 'h-60' },
  };

  // Size configurations for embedded mode
  const embeddedSizeConfigs = {
    small: { width: 'max-w-md', height: 'h-64' },
    medium: { width: 'max-w-xl', height: 'h-80' },
    large: { width: 'max-w-2xl', height: 'h-96' },
  };

  useEffect(() => {
    // Load saved size preference from localStorage (only for floating mode)
    if (mode === 'floating') {
      const savedSize = localStorage.getItem('webcamMirrorSize') as WebcamSize;
      if (savedSize && ['small', 'medium', 'large'].includes(savedSize)) {
        setSize(savedSize);
      }
    }
  }, [mode]);

  useEffect(() => {
    if (!isVisible) {
      // Clean up stream when hidden
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setStatus('loading');
      return;
    }

    // Request camera access
    setStatus('loading');
    setErrorMessage('');

    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      .then(mediaStream => {
        setStream(mediaStream);
        setStatus('active');
      })
      .catch(err => {
        console.error('Camera error:', err);

        // Handle different error types
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('denied');
          setErrorMessage('Camera access denied. Please enable camera permissions in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setStatus('no-device');
          setErrorMessage('No camera detected on your device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setStatus('error');
          setErrorMessage('Camera is being used by another application. Please close other apps using the camera.');
        } else {
          setStatus('error');
          setErrorMessage('Unable to access camera. Please try again.');
        }
      });

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVisible]);

  // Separate effect to attach stream to video element
  useEffect(() => {
    if (stream && videoRef.current && status === 'active') {
      console.log('Attaching stream to video element', {
        stream,
        videoRef: videoRef.current,
        streamActive: stream.active,
        videoTracks: stream.getVideoTracks().length
      });

      videoRef.current.srcObject = stream;

      // Ensure video plays
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playback started successfully');
          })
          .catch(err => {
            console.error('Error playing video:', err);
          });
      }
    }
  }, [stream, status]);

  const handleSizeChange = (newSize: WebcamSize) => {
    setSize(newSize);
    localStorage.setItem('webcamMirrorSize', newSize);
  };

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) return null;

  const sizeConfigs = mode === 'embedded' ? embeddedSizeConfigs : floatingSizeConfigs;

  // Embedded mode rendering
  if (mode === 'embedded') {
    return (
      <div className={`w-full mx-auto ${sizeConfigs[size].width}`}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Video Container */}
          <div className={`${sizeConfigs[size].height} bg-gray-900 relative`}>
            {/* Always render video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${status !== 'active' ? 'hidden' : ''}`}
              style={{ transform: 'scaleX(-1)' }} // Mirror the video horizontally
            />

            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
                  <p className="text-sm">Requesting camera access...</p>
                </div>
              </div>
            )}

            {(status === 'denied' || status === 'error' || status === 'no-device') && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 p-6">
                <div className="text-center text-white max-w-md">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                  <p className="text-sm mb-2 font-medium">
                    {status === 'denied' && 'Permission Denied'}
                    {status === 'no-device' && 'No Camera Found'}
                    {status === 'error' && 'Camera Error'}
                  </p>
                  <p className="text-sm text-gray-300 mb-4">{errorMessage}</p>
                  {status === 'denied' && (
                    <div className="text-sm text-left bg-gray-700 rounded p-3">
                      <p className="font-medium mb-2">How to enable:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        <li>Click the lock/camera icon in address bar</li>
                        <li>Allow camera access</li>
                        <li>Refresh the page</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Privacy Notice Overlay */}
            {status === 'active' && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white py-3 px-4">
                <p className="text-sm text-center font-medium">
                  Your video is never recorded or transmitted - This is for practice only
                </p>
              </div>
            )}

            {/* Status Indicator */}
            <div className="absolute top-3 right-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                status === 'active' ? 'bg-green-500' : 'bg-gray-500'
              } text-white text-xs font-medium`}>
                <div className={`h-2 w-2 rounded-full ${
                  status === 'active' ? 'bg-white animate-pulse' : 'bg-gray-300'
                }`} />
                {status === 'active' ? 'Live' : 'Inactive'}
              </div>
            </div>

            {/* Close button */}
            <div className="absolute top-3 left-3">
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                title="Hide webcam"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating mode - minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleMinimizeToggle}
          className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
          size="icon"
          title="Expand webcam mirror"
        >
          <Camera className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Floating mode - full rendering
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl border-2 border-gray-200 overflow-hidden transition-all ${sizeConfigs[size].width}`}
    >
      {/* Header */}
      <div className="bg-gray-800 text-white px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          <span className="text-xs font-medium">
            {status === 'active' ? 'Camera Active' : 'Camera Mirror'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={handleMinimizeToggle}
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-white hover:bg-gray-700"
            title="Minimize"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-white hover:bg-gray-700"
            title="Close webcam"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div className={`${sizeConfigs[size].height} bg-gray-900 relative`}>
        {/* Always render video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${status !== 'active' ? 'hidden' : ''}`}
          style={{ transform: 'scaleX(-1)' }} // Mirror the video horizontally
        />

        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-xs">Requesting camera access...</p>
            </div>
          </div>
        )}

        {(status === 'denied' || status === 'error' || status === 'no-device') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 p-4">
            <div className="text-center text-white">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-xs mb-2 font-medium">
                {status === 'denied' && 'Permission Denied'}
                {status === 'no-device' && 'No Camera Found'}
                {status === 'error' && 'Camera Error'}
              </p>
              <p className="text-xs text-gray-300">{errorMessage}</p>
              {status === 'denied' && (
                <div className="mt-3 text-xs text-left bg-gray-700 rounded p-2">
                  <p className="font-medium mb-1">How to enable:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Click the lock/camera icon in address bar</li>
                    <li>Allow camera access</li>
                    <li>Refresh the page</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Privacy Notice Overlay */}
        {status === 'active' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
            <p className="text-xs text-center">
              Your video is never recorded or transmitted
            </p>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-t border-gray-200">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600">Size:</span>
          <div className="flex gap-1">
            <button
              onClick={() => handleSizeChange('small')}
              className={`text-xs px-2 py-1 rounded ${
                size === 'small'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              S
            </button>
            <button
              onClick={() => handleSizeChange('medium')}
              className={`text-xs px-2 py-1 rounded ${
                size === 'medium'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              M
            </button>
            <button
              onClick={() => handleSizeChange('large')}
              className={`text-xs px-2 py-1 rounded ${
                size === 'large'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              L
            </button>
          </div>
        </div>
        <div className={`h-2 w-2 rounded-full ${
          status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} title={status === 'active' ? 'Camera active' : 'Camera inactive'} />
      </div>
    </div>
  );
}
